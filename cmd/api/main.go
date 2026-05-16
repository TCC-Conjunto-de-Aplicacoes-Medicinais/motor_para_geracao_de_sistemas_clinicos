package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/motor-clinicas/internal/config"
	"github.com/motor-clinicas/internal/crypto"
	"github.com/motor-clinicas/internal/engine"
	"github.com/motor-clinicas/internal/models"
)

func main() {
	cfg := config.LoadConfig()

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	http.HandleFunc("/generate", func(w http.ResponseWriter, r *http.Request) {
		handleGenerate(w, r, cfg)
	})
	http.HandleFunc("/generate-local", func(w http.ResponseWriter, r *http.Request) {
		handleGenerateLocal(w, r, cfg)
	})

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("Motor de Geração iniciado na porta %s...", cfg.Port)
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
		log.Printf("Falha ao descriptografar: %v", err)
		http.Error(w, "Falha na descriptografia", http.StatusUnauthorized)
		return
	}

	var payload models.SystemPayload
	if err := json.Unmarshal(plaintext, &payload); err != nil {
		log.Printf("Falha ao parsear payload descritografado: %v", err)
		http.Error(w, "Payload interno inválido", http.StatusBadRequest)
		return
	}

	// Invocar a engine (Terraform)
	if err := engine.Run(&payload, cfg); err != nil {
		log.Printf("Falha na execução do motor: %v", err)
		http.Error(w, "Falha ao provisionar infraestrutura", http.StatusInternalServerError)
		return
	}
	log.Printf("Payload decodificado e infraestrutura provisionada para a clinica: %s", payload.Identity.ClinicName)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Infraestrutura provisionada com sucesso", "clinic": payload.Identity.ClinicName})
}

func handleGenerateLocal(w http.ResponseWriter, r *http.Request, cfg *config.Config) {
	if r.Method != http.MethodPost {
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return
	}

	file, err := os.Open("test/obj_teste.json")
	if err != nil {
		http.Error(w, "Arquivo de teste local não encontrado", http.StatusInternalServerError)
		return
	}
	defer file.Close()

	var payload models.SystemPayload
	if err := json.NewDecoder(file).Decode(&payload); err != nil {
		http.Error(w, "Falha ao parsear obj_teste.json", http.StatusInternalServerError)
		return
	}

	// Invocar a engine (Terraform)
	if err := engine.Run(&payload, cfg); err != nil {
		log.Printf("Falha na execução do motor local: %v", err)
		http.Error(w, "Falha ao provisionar infraestrutura local", http.StatusInternalServerError)
		return
	}
	log.Printf("Teste local concluído com sucesso. Ambiente alvo: %s", payload.Technical.Environment)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Geração local finalizada com sucesso", "environment": payload.Technical.Environment})
}
