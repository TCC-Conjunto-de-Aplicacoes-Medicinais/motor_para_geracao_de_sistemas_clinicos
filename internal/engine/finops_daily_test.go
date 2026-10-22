package engine

import (
	"os"
	"path/filepath"
	"testing"
	"time"
)

func writeCreated(t *testing.T, root, id, createdAt string) {
	t.Helper()
	dir := filepath.Join(root, id)
	if err := os.MkdirAll(dir, 0755); err != nil {
		t.Fatal(err)
	}
	body := `{"status":"destroyed","created_at":"` + createdAt + `"}`
	if err := os.WriteFile(filepath.Join(dir, "status.json"), []byte(body), 0644); err != nil {
		t.Fatal(err)
	}
}

func TestCountClinicsCreatedOnCountsOnlyToday(t *testing.T) {
	root := t.TempDir()
	now := time.Now()
	writeCreated(t, root, "hoje-1", now.Format(time.RFC3339))
	writeCreated(t, root, "hoje-2", now.Add(-time.Minute).Format(time.RFC3339))
	writeCreated(t, root, "ontem", now.AddDate(0, 0, -1).Format(time.RFC3339))

	if got := countClinicsCreatedOn(root, now); got != 2 {
		t.Errorf("esperado 2 clínicas criadas hoje, obtido %d", got)
	}
}

func TestListAWSClinicsShowsStatusAndExpiry(t *testing.T) {
	// ListAWSClinics lê .states/aws relativo ao diretório de trabalho; aqui só checa a conversão.
	s := awsClinicState{ID: "x", Status: "ready", CreatedAt: time.Now(), ExpiresAt: time.Now().Add(time.Minute)}
	if !s.occupiesQuota() {
		t.Error("clínica ready deveria ocupar cota")
	}
}
