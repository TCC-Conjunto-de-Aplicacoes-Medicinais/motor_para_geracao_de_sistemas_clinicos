package engine

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/motor-clinicas/internal/config"
	"github.com/motor-clinicas/internal/models"
)

// Run processes the payload and triggers Terraform
func Run(payload *models.SystemPayload, cfg *config.Config) error {
	env := payload.Technical.Environment
	log.Printf("Iniciando engine para o ambiente: %s", env)

	// 1. Mapear o payload para as variáveis do Terraform
	tfVars := mapPayloadToTFVars(payload)

	// 2. Criar diretório de trabalho persistente por clínica (para manter o terraform.tfstate local)
	workDir := filepath.Join(".", ".states", env, payload.ID)
	if err := os.MkdirAll(workDir, 0755); err != nil {
		return fmt.Errorf("falha ao criar diretório de trabalho persistente: %v", err)
	}
	// defer os.RemoveAll(workDir) // Desativado temporariamente para debugar o que é gerado localmente

	// 3. FASE DE CODE GENERATION (Se local, clonar frontend)
	if env == "local" {
		log.Println("Clonando Frontend e injetando configurações...")
		if err := prepareFrontend(workDir, payload); err != nil {
			return fmt.Errorf("falha ao preparar frontend: %v", err)
		}

		log.Println("Clonando Backend e injetando configurações...")
		if err := prepareBackend(workDir, payload); err != nil {
			return fmt.Errorf("falha ao preparar backend: %v", err)
		}
	}

	// 4. Copiar os arquivos base .tf para o diretório de trabalho
	sourceDir := filepath.Join("internal", "terraform", env)
	if err := copyDir(sourceDir, workDir); err != nil {
		return fmt.Errorf("falha ao copiar templates do terraform: %v", err)
	}

	// 5. Salvar as variáveis geradas no arquivo terraform.tfvars.json
	varsBytes, err := json.MarshalIndent(tfVars, "", "  ")
	if err != nil {
		return fmt.Errorf("falha ao encodar variáveis do terraform: %v", err)
	}
	if err := os.WriteFile(filepath.Join(workDir, "terraform.tfvars.json"), varsBytes, 0644); err != nil {
		return fmt.Errorf("falha ao salvar arquivo de variáveis: %v", err)
	}

	// 6. Configurar variáveis de ambiente do SO para a nuvem correspondente
	envVars := os.Environ()
	if env == "aws" {
		envVars = append(envVars,
			"AWS_REGION="+cfg.AWSRegion,
			"AWS_ACCESS_KEY_ID="+cfg.AWSAccessKeyID,
			"AWS_SECRET_ACCESS_KEY="+cfg.AWSSecretAccessKey,
			"AWS_SESSION_TOKEN="+cfg.AWSSessionToken,
		)
	}

	// 7. Executar Terraform Init
	log.Println("Executando terraform init...")
	if err := runCmd(workDir, envVars, "terraform", "init"); err != nil {
		return fmt.Errorf("falha no terraform init: %v", err)
	}

	// 8. Executar Terraform Apply
	log.Println("Executando terraform apply...")
	if err := runCmd(workDir, envVars, "terraform", "apply", "-auto-approve"); err != nil {
		return fmt.Errorf("falha no terraform apply: %v", err)
	}

	log.Printf("Infraestrutura para %s (%s) criada com sucesso no diretório %s!", payload.Identity.ClinicName, payload.ID, workDir)
	return nil
}

// prepareFrontend clona o webproject e adiciona Dockerfile e configs
func prepareFrontend(workDir string, payload *models.SystemPayload) error {
	frontTarget := filepath.Join(workDir, "frontend")
	
	// A origem agora é o template autossuficiente mantido no motor
	frontSource := filepath.Join("internal", "clinic_template")
	
	// Verifica se a pasta de origem existe
	if _, err := os.Stat(frontSource); os.IsNotExist(err) {
		return fmt.Errorf("pasta do template base não encontrada em %s", frontSource)
	}

	// Limpar diretório alvo se já existir (evita lixo de execuções anteriores)
	os.RemoveAll(frontTarget)

	// 1. Copiar a pasta inteira
	if err := copyDirRecursive(frontSource, frontTarget); err != nil {
		return fmt.Errorf("erro copiando pasta do frontend: %v", err)
	}

	// 2. Cirurgia de Código: Excluir código que o cliente não ativou
	if err := performCodeSurgery(frontTarget, payload); err != nil {
		return fmt.Errorf("erro durante a cirurgia de código: %v", err)
	}

	// 3. Injetar o clinic.config.json na pasta public para o frontend conseguir acessar via fetch
	// Adicionamos a URL do backend dinamicamente
	configMap := make(map[string]interface{})
	payloadBytes, _ := json.Marshal(payload)
	json.Unmarshal(payloadBytes, &configMap)
	
	backendUrl := "http://localhost:8081" // Padrão local
	if payload.Technical.Environment != "local" {
		// Em produção/nuvem, isso viria de uma variável de ambiente ou output do Terraform
		backendUrl = "https://api-" + payload.ID + ".clinica.com" 
	}
	configMap["backendUrl"] = backendUrl

	configBytes, _ := json.MarshalIndent(configMap, "", "  ")
	if err := os.WriteFile(filepath.Join(frontTarget, "public", "clinic.config.json"), configBytes, 0644); err != nil {
		return fmt.Errorf("erro escrevendo clinic.config.json: %v", err)
	}

	// 3. Criar Dockerfile
	dockerfileContent := `FROM node:20-slim AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# Usa npm install no lugar de npm ci para maior flexibilidade
RUN npm install --legacy-peer-deps

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Realiza o build do Next.js
ENV NEXT_TELEMETRY_DISABLED 1
# Disable ESLint and TS errors during build just in case there are case-sensitive issues on linux
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

// prepareBackend clona o template do back-end e realiza a injeção modular
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

	// 2. Cirurgia de Código no Back-end
	if err := backendCodeSurgery(backTarget, payload); err != nil {
		return fmt.Errorf("erro durante a cirurgia de código no back-end: %v", err)
	}

	// 3. Criar .env para o Back-end
	envContent := fmt.Sprintf(`DB_USER=clinic_user
DB_PASSWORD=clinic_pass
DB_HOST=mariadb_%s
DB_PORT=3306
DB_NAME=clinic_%s
CLINIC_NAME=%s
PORT=8080
`, payload.ID, payload.ID, payload.Identity.ClinicName)

	if err := os.WriteFile(filepath.Join(backTarget, ".env"), []byte(envContent), 0644); err != nil {
		return fmt.Errorf("erro escrevendo .env do back-end: %v", err)
	}

	return nil
}

// backendCodeSurgery remove models e rotas não utilizados
func backendCodeSurgery(backTarget string, payload *models.SystemPayload) error {
	log.Println("Realizando Cirurgia de Código no Back-end...")

	if !payload.Modules.Assistant.Enabled {
		log.Println("- Removendo modelos de Assistant")
		os.Remove(filepath.Join(backTarget, "internal", "models", "assistant.go"))
	}

	if !payload.Modules.Doctor.Enabled {
		log.Println("- Removendo modelos de Doctor")
		os.Remove(filepath.Join(backTarget, "internal", "models", "doctor.go"))
	}

	// Aqui poderíamos injetar as chamadas de AutoMigrate dinamicamente no main.go
	// Por enquanto, apenas removemos os arquivos físicos.

	return nil
}

func performCodeSurgery(frontTarget string, payload *models.SystemPayload) error {
	log.Println("Realizando Cirurgia de Código no Frontend...")

	if !payload.Modules.Assistant.Enabled {
		log.Println("- Removendo rotas do módulo Assistant")
		os.RemoveAll(filepath.Join(frontTarget, "app", "assistant"))
	}

	if !payload.Modules.Doctor.Enabled {
		log.Println("- Removendo rotas do módulo Doctor")
		os.RemoveAll(filepath.Join(frontTarget, "app", "doctor"))
	}

	if !payload.Modules.Management.Enabled {
		log.Println("- Removendo rotas do módulo Management")
		os.RemoveAll(filepath.Join(frontTarget, "app", "management"))
	}

	return nil
}

func mapPayloadToTFVars(p *models.SystemPayload) map[string]interface{} {
	instanceType := "t3.medium"
	if p.Technical.Sizing.AvgDoctors > 5 {
		instanceType = "m5.large"
	}
	if p.Technical.Environment == "local" {
		instanceType = "local-docker"
	}

	return map[string]interface{}{
		"clinic_id":       p.ID,
		"clinic_name":     p.Identity.ClinicName,
		"environment":     p.Technical.Environment,
		"instance_type":   instanceType,
		"dr_enabled":      p.Technical.HasDisasterRecovery,
		"module_doctor":   p.Modules.Doctor.Enabled,
		"module_billing":  p.Modules.Management.Features.BillingControl,
	}
}

// copyDir Recursive para clonar o frontend
func copyDirRecursive(src string, dst string) error {
	return filepath.Walk(src, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		
		// Ignorar .git, node_modules e .next para otimizar
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

// copyDir plano para templates
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
