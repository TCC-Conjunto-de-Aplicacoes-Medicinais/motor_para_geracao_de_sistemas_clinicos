package engine

import (
	"encoding/json"
	"log"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/motor-clinicas/internal/config"
)

// destroyMu serializa destruições: TTL e vigia nunca rodam terraform destroy ao mesmo tempo.
var destroyMu sync.Mutex

// defaultAutoDestroyMinutes é o tempo de vida de uma clínica na AWS, contado a partir de "ready".
// Pode ser trocado pela variável AUTO_DESTROY_MINUTES.
const defaultAutoDestroyMinutes = 10

// stuckProvisioningAfter: provisionamento sem atualização por esse tempo é tratado como abandonado
// (por exemplo, o motor caiu no meio do apply) e é destruído pelo vigia.
const stuckProvisioningAfter = 60 * time.Minute

// awsClinicState é o retrato em disco de uma clínica provisionada na AWS.
// O estado vem do status.json, então sobrevive a reinício do motor (diferente dos timers em memória).
type awsClinicState struct {
	ID        string
	Status    string
	CreatedAt time.Time
	ExpiresAt time.Time
	Updated   time.Time
}

// readAWSClinicStates lista as clínicas da AWS registradas em root (ex.: .states/aws).
func readAWSClinicStates(root string) []awsClinicState {
	entries, err := os.ReadDir(root)
	if err != nil {
		return nil
	}
	var out []awsClinicState
	for _, e := range entries {
		if !e.IsDir() {
			continue
		}
		path := filepath.Join(root, e.Name(), "status.json")
		data, err := os.ReadFile(path)
		if err != nil {
			continue
		}
		info, err := os.Stat(path)
		if err != nil {
			continue
		}
		var raw struct {
			Status    string `json:"status"`
			CreatedAt string `json:"created_at"`
			ExpiresAt string `json:"expires_at"`
		}
		if json.Unmarshal(data, &raw) != nil {
			continue
		}
		st := awsClinicState{ID: e.Name(), Status: raw.Status, Updated: info.ModTime()}
		if t, err := time.Parse(time.RFC3339, raw.CreatedAt); err == nil {
			st.CreatedAt = t
		}
		if t, err := time.Parse(time.RFC3339, raw.ExpiresAt); err == nil {
			st.ExpiresAt = t
		}
		out = append(out, st)
	}
	return out
}

// occupiesQuota indica se a clínica ainda pode estar consumindo recursos na AWS.
func (s awsClinicState) occupiesQuota() bool {
	return s.Status == "provisioning" || s.Status == "ready" || s.Status == "destroying" || s.Status == "destroy_failed"
}

// due indica se o vigia deve destruir a clínica agora.
func (s awsClinicState) due(now time.Time) bool {
	switch s.Status {
	case "ready":
		return !s.ExpiresAt.IsZero() && now.After(s.ExpiresAt)
	case "destroy_failed":
		return true // nova tentativa de destruição
	case "destroying":
		// Destruição em andamento: só é retomada se ficar parada por tempo demais.
		return now.Sub(s.Updated) > stuckProvisioningAfter
	case "provisioning":
		return now.Sub(s.Updated) > stuckProvisioningAfter
	}
	return false
}

// countClinicsCreatedOn conta as clínicas da AWS criadas no mesmo dia (calendário local) de now.
func countClinicsCreatedOn(root string, now time.Time) int {
	n := 0
	y, m, d := now.Date()
	for _, s := range readAWSClinicStates(root) {
		if s.CreatedAt.IsZero() {
			continue
		}
		cy, cm, cd := s.CreatedAt.Local().Date()
		if cy == y && cm == m && cd == d {
			n++
		}
	}
	return n
}

// ListAWSClinics devolve o retrato das clínicas da AWS (usado pelo painel de controle).
func ListAWSClinics() []map[string]interface{} {
	var out []map[string]interface{}
	for _, s := range readAWSClinicStates(filepath.Join(".", ".states", "aws")) {
		item := map[string]interface{}{"clinic_id": s.ID, "status": s.Status, "created_at": s.CreatedAt.Format(time.RFC3339)}
		if !s.ExpiresAt.IsZero() {
			item["expires_at"] = s.ExpiresAt.Format(time.RFC3339)
		}
		out = append(out, item)
	}
	return out
}

// countActiveAWSClinics conta as clínicas da AWS que ainda ocupam cota.
func countActiveAWSClinics(root string) int {
	n := 0
	for _, s := range readAWSClinicStates(root) {
		if s.occupiesQuota() {
			n++
		}
	}
	return n
}

// StartFinOpsSweeper roda o vigia: ao iniciar e a cada minuto, destrói clínicas vencidas,
// com falha de destruição ou abandonadas no provisionamento. Garante que nenhum recurso
// fique cobrando na AWS só porque o motor reiniciou.
func StartFinOpsSweeper(cfg *config.Config) {
	root := filepath.Join(".", ".states", "aws")
	go func() {
		sweep := func() {
			now := time.Now()
			for _, s := range readAWSClinicStates(root) {
				if !s.due(now) {
					continue
				}
				log.Printf("[FinOps] Clínica %s em estado '%s' — destruindo recursos da AWS.", s.ID, s.Status)
				if err := Destroy(s.ID, "aws", cfg); err != nil {
					log.Printf("[FinOps] ⚠️ Falha ao destruir %s (nova tentativa no próximo ciclo): %v", s.ID, err)
				}
			}
		}
		sweep()
		ticker := time.NewTicker(time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			sweep()
		}
	}()
}
