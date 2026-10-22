package engine

import (
	"os"
	"path/filepath"
	"testing"
	"time"
)

// writeState cria .states/aws/<id>/status.json com o status e o expires_at informados.
func writeState(t *testing.T, root, id, status, expiresAt string) {
	t.Helper()
	dir := filepath.Join(root, id)
	if err := os.MkdirAll(dir, 0755); err != nil {
		t.Fatal(err)
	}
	body := `{"status":"` + status + `","expires_at":"` + expiresAt + `"}`
	if err := os.WriteFile(filepath.Join(dir, "status.json"), []byte(body), 0644); err != nil {
		t.Fatal(err)
	}
}

func TestDueReadyClinicAfterExpiry(t *testing.T) {
	root := t.TempDir()
	now := time.Now()
	writeState(t, root, "vencida", "ready", now.Add(-time.Minute).Format(time.RFC3339))
	writeState(t, root, "viva", "ready", now.Add(time.Minute).Format(time.RFC3339))

	due := map[string]bool{}
	for _, s := range readAWSClinicStates(root) {
		due[s.ID] = s.due(now)
	}
	if !due["vencida"] {
		t.Error("clínica vencida deveria ser destruída")
	}
	if due["viva"] {
		t.Error("clínica ainda dentro do TTL não deveria ser destruída")
	}
}

func TestDueRetriesFailedDestroy(t *testing.T) {
	root := t.TempDir()
	writeState(t, root, "falhou", "destroy_failed", "")
	for _, s := range readAWSClinicStates(root) {
		if !s.due(time.Now()) {
			t.Error("destroy_failed deveria ser tentado de novo")
		}
	}
}

func TestCountActiveIgnoresDestroyedAndFailedProvisioning(t *testing.T) {
	root := t.TempDir()
	future := time.Now().Add(time.Hour).Format(time.RFC3339)
	writeState(t, root, "a", "ready", future)
	writeState(t, root, "b", "destroyed", "")
	writeState(t, root, "c", "failed", "")
	writeState(t, root, "d", "provisioning", "")

	if got := countActiveAWSClinics(root); got != 2 {
		t.Errorf("esperado 2 clínicas ocupando cota (ready + provisioning), obtido %d", got)
	}
}

func TestCountActiveSurvivesMissingDirectory(t *testing.T) {
	if got := countActiveAWSClinics(filepath.Join(t.TempDir(), "nao-existe")); got != 0 {
		t.Errorf("diretório inexistente deveria contar 0, obtido %d", got)
	}
}
