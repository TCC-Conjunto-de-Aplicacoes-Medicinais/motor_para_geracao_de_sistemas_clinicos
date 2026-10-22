package handlers

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"clinic-backend/internal/database"
	"clinic-backend/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func ListRecordsHandler(c *gin.Context) {
	patientID := c.Query("patient_id")
	var records []models.MedicalRecord

	query := database.DB.Order("date DESC")
	if patientID != "" {
		query = query.Where("patient_id = ?", patientID)
	}

	if err := query.Find(&records).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar prontuários"})
		return
	}

	c.JSON(http.StatusOK, records)
}

func CreateRecordHandler(c *gin.Context) {
	var input models.MedicalRecord
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
		return
	}

	if input.ID == "" {
		input.ID = uuid.New().String()
	}
	if input.Date.IsZero() {
		input.Date = time.Now()
	}
	input.CreatedAt = time.Now()
	input.UpdatedAt = time.Now()

	// Gera ID único do recurso HL7 FHIR R4
	input.FHIRResourceID = "fhir-rec-" + input.ID

	if err := database.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao salvar prontuário: " + err.Error()})
		return
	}

	// Despacho assíncrono para o Barramento Centralizador em HL7 FHIR R4
	go dispatchFHIRRecord(input)

	c.JSON(http.StatusCreated, input)
}

// dispatchFHIRRecord converte o prontuário em payload HL7 FHIR R4 e despacha para o barramento central
func dispatchFHIRRecord(record models.MedicalRecord) {
	centralBusURL := os.Getenv("CENTRAL_BUS_URL")
	if centralBusURL == "" {
		centralBusURL = "http://localhost:8002/api/exams/ingest"
	} else if !strings.HasSuffix(centralBusURL, "/api/exams/ingest") {
		centralBusURL = strings.TrimSuffix(centralBusURL, "/") + "/api/exams/ingest"
	}

	patientCPF := ""
	patientName := ""
	var pat models.Patient
	if err := database.DB.Where("id = ?", record.PatientID).First(&pat).Error; err == nil {
		patientCPF = pat.CPF
		patientName = pat.Name
	}

	fhirPayload := map[string]interface{}{
		"resourceType": "DiagnosticReport",
		"id":           record.FHIRResourceID,
		"status":       "final",
		"code": map[string]interface{}{
			"coding": []map[string]string{
				{
					"system":  "http://loinc.org",
					"code":    "11502-2",
					"display": "Laboratory and Clinical Report",
				},
			},
			"text": record.Diagnosis,
		},
		"subject": map[string]interface{}{
			"reference": "Patient/" + record.PatientID,
			"display":   patientName,
			"identifier": map[string]string{
				"system": "urn:oid:2.16.76.4.1",
				"value":  patientCPF,
			},
		},
		"performer": []map[string]string{
			{
				"display":   record.DoctorName,
				"reference": "Practitioner/" + record.DoctorID,
			},
		},
		"effectiveDateTime": record.Date.Format(time.RFC3339),
		"conclusion":        record.Diagnosis + " - Conduta: " + record.Prescription,
		"notes":             record.Notes,
		"meta": map[string]string{
			"clinic_id":    os.Getenv("CLINIC_ID"),
			"standard":     "HL7-FHIR-R4",
			"custody":      "DPoP-LGPD",
			"patient_cpf":  patientCPF,
			"patient_name": patientName,
		},
	}

	payloadBytes, err := json.Marshal(fhirPayload)
	if err != nil {
		log.Printf("[FHIR Dispatcher] Erro ao serializar FHIR: %v", err)
		return
	}

	client := &http.Client{Timeout: 5 * time.Second}
	req, _ := http.NewRequest(http.MethodPost, centralBusURL, bytes.NewBuffer(payloadBytes))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Clinic-Key", os.Getenv("CENTRAL_BUS_KEY"))
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("[FHIR Dispatcher] Barramento central indisponível (continuando localmente): %v", err)
		return
	}
	defer resp.Body.Close()

	log.Printf("[FHIR Dispatcher] ✅ Prontuário %s despachado para o barramento central (Status %d)", record.ID, resp.StatusCode)
}
