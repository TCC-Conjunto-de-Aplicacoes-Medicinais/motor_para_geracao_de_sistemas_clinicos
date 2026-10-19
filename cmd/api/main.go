package main

import (
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

	http.HandleFunc("/destroy", func(w http.ResponseWriter, r *http.Request) {
		handleDestroy(w, r, cfg)
	})

	http.HandleFunc("/status", func(w http.ResponseWriter, r *http.Request) {
		handleStatus(w, r)
	})

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("Motor de Geração IaC iniciado na porta %s...", cfg.Port)
	if err := http.ListenAndServe(addr, nil); err != nil {
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

func handleGenerateLocal(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
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
