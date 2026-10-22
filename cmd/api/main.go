package main

import (
	"crypto/subtle"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/motor-clinicas/internal/config"
	"github.com/motor-clinicas/internal/crypto"
	"github.com/motor-clinicas/internal/engine"
	"github.com/motor-clinicas/internal/models"
)

func main() {
	cfg := config.LoadConfig()
	engine.StartFinOpsSweeper(cfg)

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"status":  "ok",
			"service": "motor_para_geracao_de_sistemas_clinicos",
			"version": "1.0.0-conic2026",
		})
	})

	http.HandleFunc("/generate", func(w http.ResponseWriter, r *http.Request) {
		handleGenerate(w, r, cfg)
	})

	http.HandleFunc("/generate-local", func(w http.ResponseWriter, r *http.Request) {
		handleGenerateLocal(w, r, cfg)
	})

	// Painel de controle: clínicas da AWS com status e prazo de expiração (protegido pelo X-Motor-Token).
	http.HandleFunc("/clinics", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(engine.ListAWSClinics())
	})

	http.HandleFunc("/destroy", func(w http.ResponseWriter, r *http.Request) {
		handleDestroy(w, r, cfg)
	})

	http.HandleFunc("/status", func(w http.ResponseWriter, r *http.Request) {
		handleStatus(w, r)
	})

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("Motor de Geração IaC iniciado na porta %s...", cfg.Port)
	if err := http.ListenAndServe(addr, requireToken(cfg.MotorToken, http.DefaultServeMux)); err != nil {
		log.Fatalf("Falha ao iniciar o servidor: %v", err)
	}
}

func handleGenerate(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	var req models.GenerateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	key := crypto.DeriveKey(req.Email, req.CNPJ, cfg.ObjKey)
	plaintext, err := crypto.DecryptAESGCM(key, req.Data.Payload, req.Data.Nonce)
	if err != nil {
		log.Printf("[API] Falha ao descriptografar: %v", err)
		http.Error(w, "Falha na descriptografia", http.StatusUnauthorized)
		return
	}

	var payload models.SystemPayload
	if err := json.Unmarshal(plaintext, &payload); err != nil {
		log.Printf("[API] Falha ao parsear payload descriptografado: %v", err)
		http.Error(w, "Payload interno inválido", http.StatusBadRequest)
		return
	}

	// Invocar a engine passando o e-mail do solicitante para validação de segurança
	result, err := engine.Run(&payload, cfg, req.Email)
	if err != nil {
		log.Printf("[API] Falha na execução do motor: %v", err)
		http.Error(w, fmt.Sprintf("Falha ao provisionar infraestrutura: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// localGenerateAllowed: o modo local (sem AWS) só vale onde ALLOW_LOCAL_GENERATE=true.
// Fica desligado no servidor e ligado só na máquina do admin.
func localGenerateAllowed() bool {
	return os.Getenv("ALLOW_LOCAL_GENERATE") == "true"
}

func handleGenerateLocal(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}
	if !localGenerateAllowed() {
		http.Error(w, "Geração local desabilitada neste servidor", http.StatusForbidden)
		return
	}

	var payload models.SystemPayload
	if r.ContentLength > 0 {
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, "Falha ao decodificar payload enviado: "+err.Error(), http.StatusBadRequest)
			return
		}
	} else {
		targetFile := "test/obj_teste.json"
		if customFile := r.URL.Query().Get("file"); customFile != "" {
			targetFile = customFile
		}
		file, err := os.Open(targetFile)
		if err != nil {
			http.Error(w, "Arquivo de teste local não encontrado: "+err.Error(), http.StatusInternalServerError)
			return
		}
		defer file.Close()

		if err := json.NewDecoder(file).Decode(&payload); err != nil {
			http.Error(w, "Falha ao parsear payload", http.StatusInternalServerError)
			return
		}
	}

	adminEmail := os.Getenv("AUTHORIZED_ADMIN_EMAIL")
	if adminEmail == "" {
		adminEmail = engine.DefaultAdminEmail
	}

	result, err := engine.Run(&payload, cfg, adminEmail)
	if err != nil {
		log.Printf("[API] Falha na execução do motor local: %v", err)
		http.Error(w, fmt.Sprintf("Falha ao provisionar infraestrutura local: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

type DestroyRequest struct {
	ClinicID    string `json:"clinic_id"`
	Environment string `json:"environment"`
}

func handleDestroy(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	var req DestroyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	if req.ClinicID == "" {
		http.Error(w, "clinic_id é obrigatório", http.StatusBadRequest)
		return
	}
	if req.Environment == "" {
		req.Environment = "aws"
	}

	if err := engine.Destroy(req.ClinicID, req.Environment, cfg); err != nil {
		log.Printf("[API] Erro ao destruir infraestrutura: %v", err)
		http.Error(w, fmt.Sprintf("Erro ao destruir: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":    "destroyed",
		"clinic_id": req.ClinicID,
		"message":   "Infraestrutura desprovisionada com sucesso",
	})
}

func handleStatus(w http.ResponseWriter, r *http.Request) {
	clinicID := r.URL.Query().Get("clinic_id")
	env := r.URL.Query().Get("env")
	if env == "" {
		env = "aws"
	}

	if clinicID == "" {
		http.Error(w, "clinic_id é obrigatório", http.StatusBadRequest)
		return
	}

	workDir := filepath.Join(".", ".states", env, clinicID)
	statusFile := filepath.Join(workDir, "status.json")

	// Se não achou na pasta indicada, tenta na outra (aws/local)
	if _, err := os.Stat(statusFile); os.IsNotExist(err) {
		otherEnv := "local"
		if env == "local" {
			otherEnv = "aws"
		}
		if _, err := os.Stat(filepath.Join(".", ".states", otherEnv, clinicID, "status.json")); err == nil {
			workDir = filepath.Join(".", ".states", otherEnv, clinicID)
			statusFile = filepath.Join(workDir, "status.json")
			env = otherEnv
		}
	}

	w.Header().Set("Content-Type", "application/json")

	if data, err := os.ReadFile(statusFile); err == nil {
		w.Write(data)
		return
	}

	stateFile := filepath.Join(workDir, "terraform.tfstate")
	status := "not_found"
	if _, err := os.Stat(stateFile); err == nil {
		status = "ready"
	} else if _, err := os.Stat(workDir); err == nil {
		status = "provisioning"
	}

	json.NewEncoder(w).Encode(map[string]string{
		"clinic_id":   clinicID,
		"environment": env,
		"status":      status,
	})
}

// requireToken exige o header X-Motor-Token em todas as rotas, exceto /health.
// Sem MOTOR_TOKEN configurado, rejeita tudo (fail closed).
func requireToken(token string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/health" {
			next.ServeHTTP(w, r)
			return
		}
		if token == "" {
			http.Error(w, "motor sem token configurado", http.StatusServiceUnavailable)
			return
		}
		got := r.Header.Get("X-Motor-Token")
		if subtle.ConstantTimeCompare([]byte(got), []byte(token)) != 1 {
			http.Error(w, "não autorizado", http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	})
}
