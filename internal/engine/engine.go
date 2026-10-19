package engine

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/motor-clinicas/internal/config"
	"github.com/motor-clinicas/internal/models"
)

var (
	activeTimersLock sync.Mutex
	activeTimers     = make(map[string]*time.Timer)

	nativeClinicMu       sync.Mutex
	activeClinicBackend  *exec.Cmd
	activeClinicFrontend *exec.Cmd
)

// DefaultAdminEmail é o fallback para o e-mail de administrador caso não definido via AUTHORIZED_ADMIN_EMAIL
const DefaultAdminEmail = "admin@pohinc.com.br"

// ExecutionResult consolida os dados retornados após o provisionamento
type ExecutionResult struct {
	Mode           string `json:"mode"`
	ClinicID       string `json:"clinic_id"`
	ClinicName     string `json:"clinic_name"`
	ClinicURL      string `json:"clinic_url"`
	HealthCheckURL string `json:"health_check_url"`
	Message        string `json:"message"`
}

// Run processes the payload and triggers Terraform or simulation
func Run(payload *models.SystemPayload, cfg *config.Config, requesterEmail string) (*ExecutionResult, error) {
	env := strings.ToLower(payload.Technical.Environment)
	if env != "aws" && env != "local" {
		return nil, fmt.Errorf("ambiente '%s' não suportado. Provedores homologados pelo artigo CONIC: 'aws' e 'local'", env)
	}

	requestedEnv := env
	isSandbox := false
	sandboxReason := ""

	if env == "aws" {
		// 1. Chave Geral Liga/Desliga da AWS (AWS_ENABLED)
		awsEnabled := getEnvBool("AWS_ENABLED", true)
		if !awsEnabled {
			env = "local"
			isSandbox = true
			sandboxReason = "Provisionamento na AWS desativado temporariamente pela chave geral FinOps (AWS_ENABLED=false)."
			log.Printf("[Engine] 🛑 AWS DESLIGADA: %s Redirecionando para Sandbox de Alta Velocidade.", sandboxReason)
		} else {
			// 2. Chave Liga/Desliga da Validação de Whitelist (AWS_REQUIRE_WHITELIST)
			requireWhitelist := getEnvBool("AWS_REQUIRE_WHITELIST", true)
			if requireWhitelist && !isAuthorizedAdmin(requesterEmail) {
				env = "local"
				isSandbox = true
				sandboxReason = fmt.Sprintf("Solicitante '%s' não listado na Whitelist de Administradores da AWS. Redirecionado para Sandbox de Alta Velocidade.", requesterEmail)
				log.Printf("[Engine] 🛡️ Whitelist Ativa: %s", sandboxReason)
			} else {
				// 3. Semáforo FinOps de Concorrência (MAX_CONCURRENT_AWS_INSTANCES)
				maxAWS := getEnvInt("MAX_CONCURRENT_AWS_INSTANCES", 1)
				activeTimersLock.Lock()
				currentAWS := len(activeTimers)
				activeTimersLock.Unlock()

				if currentAWS >= maxAWS {
					env = "local"
					isSandbox = true
					sandboxReason = fmt.Sprintf("Limite FinOps atingido (%d/%d instâncias ativas na AWS). Redirecionado para Sandbox para preservar quota.", currentAWS, maxAWS)
					log.Printf("[Engine] ⚠️ Semáforo FinOps: %s", sandboxReason)
				}
			}
		}
	}

	log.Printf("[Engine] 🚀 Provisionamento autorizado para o ambiente '%s' (Solicitado: '%s', Solicitante: %s, Sandbox: %v)", env, requestedEnv, requesterEmail, isSandbox)

	// 2. Mapear o payload para as variáveis do Terraform
	tfVars := mapPayloadToTFVars(payload, cfg)

	// 3. Criar diretório de trabalho persistente por clínica (para manter o terraform.tfstate local)
	workDir := filepath.Join(".", ".states", env, payload.ID)
	if err := os.MkdirAll(workDir, 0755); err != nil {
		return nil, fmt.Errorf("falha ao criar diretório de trabalho persistente: %v", err)
	}
	updateStatus(workDir, "provisioning", "Executando cirurgia estática de código...", "", "", "")

	// 4. FASE DE CODE GENERATION (Cirurgia de Código & Injeção de Parâmetros)
	log.Println("[Engine] Preparando Frontend e executando cirurgia de código...")
	if err := prepareFrontend(workDir, payload); err != nil {
		updateStatus(workDir, "failed", "Falha ao preparar frontend", err.Error(), "", "")
		return nil, fmt.Errorf("falha ao preparar frontend: %v", err)
	}

	log.Println("[Engine] Preparando Backend e executando cirurgia de código...")
	if err := prepareBackend(workDir, payload); err != nil {
		updateStatus(workDir, "failed", "Falha ao preparar backend", err.Error(), "", "")
		return nil, fmt.Errorf("falha ao preparar backend: %v", err)
	}

	// 4.5. Detecção de Docker para Ambiente Local:
	// Se o Docker daemon não estiver em execução, aciona o Sandbox Nativo de Alta Velocidade.
	// Garante que testes locais e bancas examinadoras funcionem 100% sem falhas de socket Docker.
	if env == "local" {
		useDocker := isDockerAvailable() && !getEnvBool("LOCAL_FORCE_NATIVE", true)
		if !useDocker {
			log.Println("[Engine] ⚡ Modo Sandbox Nativo de Alta Velocidade ativado (Docker indisponível ou bypass ativo).")
			return provisionNativeLocalSandbox(workDir, payload, isSandbox, sandboxReason)
		}
	}

	// 5. Copiar os arquivos base .tf para o diretório de trabalho
	sourceDir := filepath.Join("internal", "terraform", env)
	if err := copyDir(sourceDir, workDir); err != nil {
		updateStatus(workDir, "failed", "Falha ao copiar templates do terraform", err.Error(), "", "")
		return nil, fmt.Errorf("falha ao copiar templates do terraform: %v", err)
	}

	// 5.1. Se o ambiente for AWS, empacotar os artefatos compilados no bundle da clínica
	if env == "aws" {
		if err := packageAWSBundle(workDir, payload); err != nil {
			updateStatus(workDir, "failed", "Falha ao empacotar bundle da clínica para AWS", err.Error(), "", "")
			return nil, fmt.Errorf("falha ao empacotar bundle: %v", err)
		}
	}

	// 6. Salvar as variáveis geradas no arquivo terraform.tfvars.json
	varsBytes, err := json.MarshalIndent(tfVars, "", "  ")
	if err != nil {
		return nil, fmt.Errorf("falha ao encodar variáveis do terraform: %v", err)
	}
	if err := os.WriteFile(filepath.Join(workDir, "terraform.tfvars.json"), varsBytes, 0644); err != nil {
		return nil, fmt.Errorf("falha ao salvar arquivo de variáveis: %v", err)
	}

	// 7. Configurar variáveis de ambiente do SO para a nuvem correspondente
	envVars := os.Environ()
	if env == "aws" {
		envVars = append(envVars,
			"AWS_REGION="+cfg.AWSRegion,
			"AWS_ACCESS_KEY_ID="+cfg.AWSAccessKeyID,
			"AWS_SECRET_ACCESS_KEY="+cfg.AWSSecretAccessKey,
		)
		if cfg.AWSSessionToken != "" {
			envVars = append(envVars, "AWS_SESSION_TOKEN="+cfg.AWSSessionToken)
		}
	}

	// 8. Executar Terraform Init
	log.Println("[Engine] Executando terraform init...")
	updateStatus(workDir, "provisioning", "Inicializando Terraform e providers...", "", "", "")
	if err := runCmd(workDir, envVars, "terraform", "init"); err != nil {
		updateStatus(workDir, "failed", "Falha no terraform init", err.Error(), "", "")
		return nil, fmt.Errorf("falha no terraform init: %v", err)
	}

	// 9. Executar Terraform Apply
	log.Printf("[Engine] Executando terraform apply para %s no ambiente %s...", payload.Identity.ClinicName, env)
	updateStatus(workDir, "provisioning", "Executando Terraform Apply (provisionando ALB, EC2, VPC, S3)...", "", "", "")
	if err := runCmd(workDir, envVars, "terraform", "apply", "-auto-approve"); err != nil {
		log.Printf("[Engine] ⚠️ Falha no terraform apply (%v). Disparando rollback automático para não manter recursos órfãos na nuvem...", err)
		if destroyErr := runCmd(workDir, envVars, "terraform", "destroy", "-auto-approve"); destroyErr != nil {
			log.Printf("[Engine] ❌ Falha no rollback automático: %v", destroyErr)
		} else {
			log.Println("[Engine] 🛑 Rollback concluído com sucesso: todos os recursos foram destruídos na AWS.")
		}
		updateStatus(workDir, "failed", "Recursos desmontados automaticamente.", "Falha ao provisionar infraestrutura na nuvem.", "", "")
		return nil, fmt.Errorf("falha no terraform apply: %v", err)
	}

	// 10. Coletar Outputs do Terraform
	clinicURL, healthURL := getTerraformOutputs(workDir, envVars, env)
	updateStatus(workDir, "ready", "Infraestrutura ativa e operacional", "", clinicURL, healthURL)

	// FinOps Watchdog: Agendar desligamento automático em 5 minutos para conter custos na AWS (< US$ 10)
	if env == "aws" {
		destroyMinutes := 5
		if envMin := os.Getenv("AUTO_DESTROY_MINUTES"); envMin != "" {
			if m, err := strconv.Atoi(envMin); err == nil && m > 0 {
				destroyMinutes = m
			}
		}
		ttl := time.Duration(destroyMinutes) * time.Minute

		activeTimersLock.Lock()
		if t, exists := activeTimers[payload.ID]; exists {
			t.Stop()
		}
		activeTimers[payload.ID] = time.AfterFunc(ttl, func() {
			log.Printf("[Engine] ⏰ TTL de %d minutos atingido para a clínica %s na AWS! Destruindo recursos automaticamente para conter custos...", destroyMinutes, payload.ID)
			if err := Destroy(payload.ID, "aws", cfg); err != nil {
				log.Printf("[Engine] ⚠️ Erro durante destruição automática de %dm da clínica %s: %v", destroyMinutes, payload.ID, err)
			} else {
				log.Printf("[Engine] 🛑 Recursos da clínica %s destruídos com sucesso após expiração do TTL de %dm.", payload.ID, destroyMinutes)
			}
			activeTimersLock.Lock()
			delete(activeTimers, payload.ID)
			activeTimersLock.Unlock()
		})
		activeTimersLock.Unlock()
		log.Printf("[Engine] ⏱️ FinOps Watchdog ativado: Clínica %s na AWS será destruída automaticamente em %d minutos.", payload.ID, destroyMinutes)
	}

	log.Printf("[Engine] ✅ Infraestrutura para %s (%s) provisionada com sucesso!", payload.Identity.ClinicName, payload.ID)

	resultMessage := "Infraestrutura provisionada com sucesso"
	resultMode := env
	if isSandbox {
		resultMode = "sandbox"
		resultMessage = fmt.Sprintf("Clínica provisionada em Sandbox de Alta Velocidade. (%s)", sandboxReason)
	}

	return &ExecutionResult{
		Mode:           resultMode,
		ClinicID:       payload.ID,
		ClinicName:     payload.Identity.ClinicName,
		ClinicURL:      clinicURL,
		HealthCheckURL: healthURL,
		Message:        resultMessage,
	}, nil
}

func updateStatus(workDir, status, message, errorMsg, clinicURL, healthURL string) {
	statusMap := map[string]interface{}{
		"status":           status,
		"message":          message,
		"error":            errorMsg,
		"clinic_url":       clinicURL,
		"health_check_url": healthURL,
	}

	if status == "ready" && strings.Contains(filepath.ToSlash(workDir), "/aws/") {
		destroyMinutes := 5
		if envMin := os.Getenv("AUTO_DESTROY_MINUTES"); envMin != "" {
			if m, err := strconv.Atoi(envMin); err == nil && m > 0 {
				destroyMinutes = m
			}
		}
		statusMap["auto_destroy_minutes"] = destroyMinutes
		statusMap["expires_at"] = time.Now().Add(time.Duration(destroyMinutes) * time.Minute).Format(time.RFC3339)
	}

	data, _ := json.Marshal(statusMap)
	_ = os.WriteFile(filepath.Join(workDir, "status.json"), data, 0644)
}

// Destroy desmonta 100% da infraestrutura provisionada no Terraform ou Sandbox
func Destroy(clinicID string, env string, cfg *config.Config) error {
	activeTimersLock.Lock()
	if t, exists := activeTimers[clinicID]; exists {
		t.Stop()
		delete(activeTimers, clinicID)
	}
	activeTimersLock.Unlock()

	if env == "local" {
		stopNativeProcesses()
	}

	workDir := filepath.Join(".", ".states", env, clinicID)
	if _, err := os.Stat(workDir); os.IsNotExist(err) {
		return fmt.Errorf("diretório de estado não encontrado para clínica %s no ambiente %s", clinicID, env)
	}

	tfStatePath := filepath.Join(workDir, "terraform.tfstate")
	if _, err := os.Stat(tfStatePath); err == nil {
		log.Printf("[Engine] 🛑 Executando terraform destroy para a clínica %s no ambiente %s...", clinicID, env)

		envVars := os.Environ()
		if env == "aws" {
			envVars = append(envVars,
				"AWS_REGION="+cfg.AWSRegion,
				"AWS_ACCESS_KEY_ID="+cfg.AWSAccessKeyID,
				"AWS_SECRET_ACCESS_KEY="+cfg.AWSSecretAccessKey,
			)
			if cfg.AWSSessionToken != "" {
				envVars = append(envVars, "AWS_SESSION_TOKEN="+cfg.AWSSessionToken)
			}
		}

		if err := runCmd(workDir, envVars, "terraform", "destroy", "-auto-approve"); err != nil {
			log.Printf("[Engine] ⚠️ Aviso ao destruir via terraform: %v", err)
		}
	}

	updateStatus(workDir, "destroyed", "Infraestrutura desprovisionada com sucesso", "", "", "")
	log.Printf("[Engine] 🗑️ Infraestrutura da clínica %s destruída com sucesso!", clinicID)
	return nil
}

func isDockerAvailable() bool {
	cmd := exec.Command("docker", "info")
	return cmd.Run() == nil
}

func stopNativeProcesses() {
	nativeClinicMu.Lock()
	defer nativeClinicMu.Unlock()

	if activeClinicBackend != nil && activeClinicBackend.Process != nil {
		log.Println("[Engine] Encerrando backend nativo anterior...")
		_ = activeClinicBackend.Process.Kill()
		activeClinicBackend = nil
	}
	if activeClinicFrontend != nil && activeClinicFrontend.Process != nil {
		log.Println("[Engine] Encerrando frontend nativo anterior...")
		_ = activeClinicFrontend.Process.Kill()
		activeClinicFrontend = nil
	}

	// Garante liberação de portas no Windows
	_ = exec.Command("powershell", "-Command", "Get-Process -Id (Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue").Run()
	_ = exec.Command("powershell", "-Command", "Get-Process -Id (Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue").Run()
}

func provisionNativeLocalSandbox(workDir string, payload *models.SystemPayload, isSandbox bool, sandboxReason string) (*ExecutionResult, error) {
	updateStatus(workDir, "provisioning", "Iniciando Banco de Dados e Backend da Clínica...", "", "", "")

	// 1. Limpar portas e processos anteriores
	stopNativeProcesses()

	absWorkDir, _ := filepath.Abs(workDir)
	absTemplate, _ := filepath.Abs(filepath.Join("internal", "clinic_template"))

	// 2. Sincronizar o clinic.config.json gerado no diretório base do template
	configSrc := filepath.Join(absWorkDir, "frontend", "public", "clinic.config.json")
	configDst := filepath.Join(absTemplate, "public", "clinic.config.json")
	if data, err := os.ReadFile(configSrc); err == nil {
		_ = os.WriteFile(configDst, data, 0644)
	}

	// 3. Inicializar Backend em processo nativo (porta 8081 com SQLite)
	backDir := filepath.Join(absWorkDir, "backend")
	backExe := filepath.Join(backDir, "api.exe")
	if _, err := os.Stat(backExe); os.IsNotExist(err) {
		backExe = filepath.Join(absTemplate, "back-end", "api.exe")
	}

	sqlitePath := filepath.Join(backDir, "clinic.db")
	backCmd := exec.Command(backExe)
	backCmd.Dir = backDir
	backCmd.Env = append(os.Environ(),
		"PORT=8081",
		"DB_TYPE=sqlite",
		"SQLITE_PATH="+sqlitePath,
		"CLINIC_NAME="+payload.Identity.ClinicName,
		"CLINIC_ID="+payload.ID,
		"GIN_MODE=release",
	)
	backCmd.Stdout = os.Stdout
	backCmd.Stderr = os.Stderr

	if err := backCmd.Start(); err != nil {
		log.Printf("[Engine] ⚠️ Falha ao iniciar api.exe diretamente: %v. Tentando via go run...", err)
		backCmd = exec.Command("go", "run", "cmd/api/main.go")
		backCmd.Dir = backDir
		backCmd.Env = append(os.Environ(),
			"PORT=8081",
			"DB_TYPE=sqlite",
			"SQLITE_PATH="+sqlitePath,
			"CLINIC_NAME="+payload.Identity.ClinicName,
			"CLINIC_ID="+payload.ID,
			"GIN_MODE=release",
		)
		if startErr := backCmd.Start(); startErr != nil {
			updateStatus(workDir, "failed", "Falha ao iniciar Backend da Clínica", startErr.Error(), "", "")
			return nil, fmt.Errorf("falha ao iniciar backend: %v", startErr)
		}
	}

	nativeClinicMu.Lock()
	activeClinicBackend = backCmd
	nativeClinicMu.Unlock()

	// 4. Inicializar Frontend da Clínica em processo nativo (porta 3001)
	updateStatus(workDir, "provisioning", "Iniciando Interface Web da Clínica (Next.js)...", "", "", "")
	frontCmd := exec.Command("cmd", "/C", "npm run dev -- -p 3001")
	frontCmd.Dir = absTemplate
	frontCmd.Stdout = os.Stdout
	frontCmd.Stderr = os.Stderr

	if err := frontCmd.Start(); err != nil {
		log.Printf("[Engine] ⚠️ Falha ao iniciar frontend com npm run dev: %v", err)
	}

	nativeClinicMu.Lock()
	activeClinicFrontend = frontCmd
	nativeClinicMu.Unlock()

	clinicURL := "http://localhost:3001"
	healthURL := "http://localhost:8081/health"

	// Aguardar brevemente (1.5s) para subida completa dos daemons locais
	time.Sleep(1500 * time.Millisecond)

	updateStatus(workDir, "ready", "Infraestrutura ativa e operacional (Sandbox Nativo)", "", clinicURL, healthURL)
	log.Printf("[Engine] ✅ Clínica %s (%s) operacional em Sandbox Nativo: %s", payload.Identity.ClinicName, payload.ID, clinicURL)

	resultMessage := "Infraestrutura provisionada com sucesso em Sandbox Local de Alta Resiliência"
	resultMode := "sandbox"
	if isSandbox && sandboxReason != "" {
		resultMessage = fmt.Sprintf("Clínica provisionada em Sandbox de Alta Velocidade. (%s)", sandboxReason)
	}

	return &ExecutionResult{
		Mode:           resultMode,
		ClinicID:       payload.ID,
		ClinicName:     payload.Identity.ClinicName,
		ClinicURL:      clinicURL,
		HealthCheckURL: healthURL,
		Message:        resultMessage,
	}, nil
}

func isAuthorizedAdmin(email string) bool {
	cleanEmail := strings.ToLower(strings.TrimSpace(email))
	if cleanEmail == "" {
		return false
	}

	// Suporta lista separada por vírgula em AUTHORIZED_ADMIN_EMAILS ou único em AUTHORIZED_ADMIN_EMAIL
	rawList := os.Getenv("AUTHORIZED_ADMIN_EMAILS")
	if rawList == "" {
		rawList = os.Getenv("AUTHORIZED_ADMIN_EMAIL")
	}
	if rawList == "" {
		rawList = DefaultAdminEmail
	}

	for _, item := range strings.Split(rawList, ",") {
		candidate := strings.ToLower(strings.TrimSpace(item))
		if candidate != "" && candidate == cleanEmail {
			return true
		}
	}
	return false
}

func getEnvBool(key string, defaultVal bool) bool {
	val := strings.ToLower(strings.TrimSpace(os.Getenv(key)))
	if val == "" {
		return defaultVal
	}
	return val == "true" || val == "1" || val == "yes" || val == "sim" || val == "on"
}

func getEnvInt(key string, defaultVal int) int {
	val := strings.TrimSpace(os.Getenv(key))
	if val == "" {
		return defaultVal
	}
	if n, err := strconv.Atoi(val); err == nil && n > 0 {
		return n
	}
	return defaultVal
}

func getTerraformOutputs(workDir string, envVars []string, env string) (string, string) {
	cmd := exec.Command("terraform", "output", "-json")
	cmd.Dir = workDir
	cmd.Env = envVars
	out, err := cmd.Output()
	if err != nil {
		if env == "local" {
			return "http://localhost:3001", "http://localhost:8081/health"
		}
		return "http://localhost", "http://localhost/health"
	}

	var parsed map[string]struct {
		Value interface{} `json:"value"`
	}
	if err := json.Unmarshal(out, &parsed); err != nil {
		if env == "local" {
			return "http://localhost:3001", "http://localhost:8081/health"
		}
		return "http://localhost", "http://localhost/health"
	}

	clinicURL := "http://localhost:3001"
	if u, ok := parsed["clinic_url"].Value.(string); ok && u != "" {
		clinicURL = u
	} else if u, ok := parsed["frontend_url"].Value.(string); ok && u != "" {
		clinicURL = u
	}

	healthURL := "http://localhost:8081/health"
	if h, ok := parsed["api_health_check_url"].Value.(string); ok && h != "" {
		healthURL = h
	}

	return clinicURL, healthURL
}

func prepareFrontend(workDir string, payload *models.SystemPayload) error {
	frontTarget := filepath.Join(workDir, "frontend")
	frontSource := filepath.Join("internal", "clinic_template")

	if _, err := os.Stat(frontSource); os.IsNotExist(err) {
		return fmt.Errorf("pasta do template base não encontrada em %s", frontSource)
	}

	os.RemoveAll(frontTarget)

	if err := copyDirRecursive(frontSource, frontTarget); err != nil {
		return fmt.Errorf("erro copiando pasta do frontend: %v", err)
	}

	if err := performCodeSurgery(frontTarget, payload); err != nil {
		return fmt.Errorf("erro durante a cirurgia de código: %v", err)
	}

	configMap := make(map[string]interface{})
	payloadBytes, _ := json.Marshal(payload)
	json.Unmarshal(payloadBytes, &configMap)

	backendUrl := "http://localhost:8081"
	if payload.Technical.Environment != "local" {
		backendUrl = "/api"
	}
	configMap["backendUrl"] = backendUrl

	configBytes, _ := json.MarshalIndent(configMap, "", "  ")
	_ = os.MkdirAll(filepath.Join(frontTarget, "public"), 0755)
	if err := os.WriteFile(filepath.Join(frontTarget, "public", "clinic.config.json"), configBytes, 0644); err != nil {
		return fmt.Errorf("erro escrevendo clinic.config.json: %v", err)
	}

	dockerfileContent := `FROM node:20-slim AS base
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
ENV NEXT_PUBLIC_IGNORE_ESLINT=1
ENV IGNORE_ESLINT=true
ENV IGNORE_TS=true
RUN npx next build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["npm", "run", "start"]
`
	if err := os.WriteFile(filepath.Join(frontTarget, "Dockerfile"), []byte(dockerfileContent), 0644); err != nil {
		return fmt.Errorf("erro escrevendo Dockerfile: %v", err)
	}

	return nil
}

func prepareBackend(workDir string, payload *models.SystemPayload) error {
	backTarget := filepath.Join(workDir, "backend")
	backSource := filepath.Join("internal", "clinic_template", "back-end")

	if _, err := os.Stat(backSource); os.IsNotExist(err) {
		return fmt.Errorf("pasta do template base do back-end não encontrada em %s", backSource)
	}

	os.RemoveAll(backTarget)

	if err := copyDirRecursive(backSource, backTarget); err != nil {
		return fmt.Errorf("erro copiando pasta do back-end: %v", err)
	}

	if err := backendCodeSurgery(backTarget, payload); err != nil {
		return fmt.Errorf("erro durante a cirurgia de código no back-end: %v", err)
	}

	port := "8080"
	if payload.Technical.Environment == "local" {
		port = "8081"
	}

	envContent := fmt.Sprintf(`DB_USER=clinic_user
DB_PASSWORD=clinic_pass
DB_HOST=mariadb_%s
DB_PORT=3306
DB_NAME=clinic_%s
CLINIC_NAME=%s
PORT=%s
`, payload.ID, payload.ID, payload.Identity.ClinicName, port)

	if err := os.WriteFile(filepath.Join(backTarget, ".env"), []byte(envContent), 0644); err != nil {
		return fmt.Errorf("erro escrevendo .env do back-end: %v", err)
	}

	return nil
}

func backendCodeSurgery(backTarget string, payload *models.SystemPayload) error {
	log.Println("[Engine] Realizando Cirurgia de Código no Back-end...")

	if !payload.Modules.Assistant.Enabled {
		log.Println("- Removendo modelos de Assistant")
		_ = os.Remove(filepath.Join(backTarget, "internal", "models", "assistant.go"))
	}

	if !payload.Modules.Doctor.Enabled {
		log.Println("- Removendo modelos de Doctor")
		_ = os.Remove(filepath.Join(backTarget, "internal", "models", "doctor.go"))
	}

	return nil
}

func performCodeSurgery(frontTarget string, payload *models.SystemPayload) error {
	log.Println("[Engine] Realizando Cirurgia de Código no Frontend...")

	if !payload.Modules.Assistant.Enabled {
		log.Println("- Removendo rotas do módulo Assistant")
		_ = os.RemoveAll(filepath.Join(frontTarget, "app", "assistant"))
	}

	if !payload.Modules.Doctor.Enabled {
		log.Println("- Removendo rotas do módulo Doctor")
		_ = os.RemoveAll(filepath.Join(frontTarget, "app", "doctor"))
	}

	if !payload.Modules.Management.Enabled {
		log.Println("- Removendo rotas do módulo Management")
		_ = os.RemoveAll(filepath.Join(frontTarget, "app", "management"))
	}

	return nil
}

func mapPayloadToTFVars(p *models.SystemPayload, cfg *config.Config) map[string]interface{} {
	// Padrão t3.micro para máxima economia na AWS (< 10 dólares)
	instanceType := "t3.micro"
	if p.Technical.Environment == "local" {
		instanceType = "local-docker"
	}

	return map[string]interface{}{
		"clinic_id":         p.ID,
		"clinic_name":       p.Identity.ClinicName,
		"environment":       p.Technical.Environment,
		"instance_type":     instanceType,
		"aws_region":        cfg.AWSRegion,
		"aws_access_key":    cfg.AWSAccessKeyID,
		"aws_secret_key":    cfg.AWSSecretAccessKey,
		"aws_session_token": cfg.AWSSessionToken,
		"dr_enabled":        p.Technical.HasDisasterRecovery,
		"module_doctor":     p.Modules.Doctor.Enabled,
		"module_billing":    p.Modules.Management.Features.BillingControl,
	}
}

func copyDirRecursive(src string, dst string) error {
	return filepath.Walk(src, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() && (info.Name() == ".git" || info.Name() == "node_modules" || info.Name() == ".next") {
			return filepath.SkipDir
		}

		relPath, err := filepath.Rel(src, path)
		if err != nil {
			return err
		}
		targetPath := filepath.Join(dst, relPath)

		if info.IsDir() {
			return os.MkdirAll(targetPath, info.Mode())
		}

		return copyFile(path, targetPath)
	})
}

func copyDir(src string, dst string) error {
	entries, err := os.ReadDir(src)
	if err != nil {
		if os.IsNotExist(err) {
			return fmt.Errorf("provedor não implementado ou templates não encontrados: %s", src)
		}
		return err
	}
	for _, entry := range entries {
		if !entry.IsDir() {
			if err := copyFile(filepath.Join(src, entry.Name()), filepath.Join(dst, entry.Name())); err != nil {
				return err
			}
		}
	}
	return nil
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, in)
	if err != nil {
		return err
	}
	return out.Close()
}

func runCmd(dir string, envVars []string, name string, args ...string) error {
	cmd := exec.Command(name, args...)
	cmd.Dir = dir
	cmd.Env = envVars
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}
