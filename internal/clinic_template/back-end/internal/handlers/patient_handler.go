package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"clinic-backend/internal/database"
	"clinic-backend/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func ListPatientsHandler(c *gin.Context) {
	var patients []models.Patient
	if err := database.DB.Order("name ASC").Find(&patients).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar pacientes"})
		return
	}
	c.JSON(http.StatusOK, patients)
}

func GetPatientHandler(c *gin.Context) {
	id := c.Param("id")
	var patient models.Patient
	if err := database.DB.First(&patient, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Paciente não encontrado"})
		return
	}
	c.JSON(http.StatusOK, patient)
}

func CreatePatientHandler(c *gin.Context) {
	var input models.Patient
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
		return
	}

	if input.ID == "" {
		input.ID = uuid.New().String()
	}
	input.CreatedAt = time.Now()
	input.UpdatedAt = time.Now()

	// Trata duplicação de CPF localmente de forma idempotente
	var existing models.Patient
	if err := database.DB.Where("cpf = ?", input.CPF).First(&existing).Error; err == nil {
		input.ID = existing.ID
		database.DB.Model(&existing).Updates(input)
	} else {
		if err := database.DB.Create(&input).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao cadastrar paciente: " + err.Error()})
			return
		}
	}

	// Sincroniza com o barramento centralizador Open Health POHINC
	go func(pat models.Patient) {
		centralURL := os.Getenv("CENTRAL_BUS_URL")
		if centralURL == "" {
			centralURL = "http://localhost:8002"
		}
		centralBase := strings.TrimSuffix(centralURL, "/api/exams/ingest")
		centralBase = strings.TrimSuffix(centralBase, "/api/exams")
		centralBase = strings.TrimSuffix(centralBase, "/")

		syncPayload, _ := json.Marshal(map[string]interface{}{
			"id":         "pat-" + pat.ID,
			"name":       pat.Name,
			"cpf":        pat.CPF,
			"birth_date": pat.BirthDate,
			"email":      pat.Email,
			"phone":      pat.Phone,
			"gender":     pat.Gender,
		})

		client := &http.Client{Timeout: 4 * time.Second}
		req, _ := http.NewRequest(http.MethodPost, centralBase+"/api/patients/sync", bytes.NewBuffer(syncPayload))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Clinic-Key", os.Getenv("CENTRAL_BUS_KEY"))
		_, _ = client.Do(req)
	}(input)

	c.JSON(http.StatusCreated, input)
}

type ImportRequest struct {
	CPF           string `json:"cpf" binding:"required"`
	TokenCode     string `json:"token_code,omitempty"`
	Justification string `json:"justification,omitempty"`
}

// ImportPatientFromCentralHandler busca o paciente no Centralizador POHINC (HL7 FHIR Bundle) e importa para o banco da clínica
func ImportPatientFromCentralHandler(c *gin.Context) {
	var req ImportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "CPF é obrigatório: " + err.Error()})
		return
	}

	centralURL := os.Getenv("CENTRAL_BUS_URL")
	if centralURL == "" {
		centralURL = "http://localhost:8002"
	}
	centralBase := strings.TrimSuffix(centralURL, "/api/exams/ingest")
	centralBase = strings.TrimSuffix(centralBase, "/api/exams")
	centralBase = strings.TrimSuffix(centralBase, "/")

	cleanCPF := strings.ReplaceAll(strings.ReplaceAll(req.CPF, ".", ""), "-", "")

	client := &http.Client{Timeout: 4 * time.Second}
	searchURL := fmt.Sprintf("%s/api/patients/search?cpf=%s", centralBase, url.QueryEscape(cleanCPF))

	var centralPatientID string
	var patientName string
	var birthDate string

	searchReq, _ := http.NewRequest(http.MethodGet, searchURL, nil)
	searchReq.Header.Set("X-Clinic-Key", os.Getenv("CENTRAL_BUS_KEY"))
	resp, err := client.Do(searchReq)
	if err == nil && resp.StatusCode == http.StatusOK {
		var searchResult struct {
			Found   bool `json:"found"`
			Patient struct {
				ID        string `json:"id"`
				Name      string `json:"name"`
				CPF       string `json:"cpf"`
				BirthDate string `json:"birthDate"`
			} `json:"patient"`
		}
		if json.NewDecoder(resp.Body).Decode(&searchResult) == nil && searchResult.Found {
			centralPatientID = searchResult.Patient.ID
			patientName = searchResult.Patient.Name
			birthDate = searchResult.Patient.BirthDate
		}
		resp.Body.Close()
	}

	// Se não achou na rota pública ou Centralizador offline, gera dados canônicos realistas para demonstração acadêmica
	if centralPatientID == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "paciente não encontrado no centralizador"})
		return
	}

	// 2. Tenta buscar o Bundle FHIR do paciente no Centralizador
	fhirURL := fmt.Sprintf("%s/api/patients/%s/fhir-bundle", centralBase, centralPatientID)
	fhirReq, _ := http.NewRequest(http.MethodGet, fhirURL, nil)
	fhirReq.Header.Set("X-Clinic-Key", os.Getenv("CENTRAL_BUS_KEY"))
	fhirResp, fhirErr := client.Do(fhirReq)

	var fhirBundle struct {
		ResourceType string `json:"resourceType"`
		Entry        []struct {
			Resource map[string]interface{} `json:"resource"`
		} `json:"entry"`
	}

	haveRealBundle := false
	if fhirErr == nil && fhirResp.StatusCode == http.StatusOK {
		if json.NewDecoder(fhirResp.Body).Decode(&fhirBundle) == nil && len(fhirBundle.Entry) > 0 {
			haveRealBundle = true
		}
		fhirResp.Body.Close()
	}

	// 3. Salva ou atualiza o paciente no MariaDB local da clínica
	var localPatient models.Patient
	err = database.DB.Where("cpf = ? OR REPLACE(REPLACE(cpf, '.', ''), '-', '') = ?", req.CPF, cleanCPF).First(&localPatient).Error

	if err != nil {
		// Paciente novo na clínica
		localPatient = models.Patient{
			ID:        uuid.New().String(),
			Name:      patientName,
			CPF:       req.CPF,
			BirthDate: birthDate,
			Gender:    "",
			Phone:     "",
			Email:     "",
			Address:   "",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		database.DB.Create(&localPatient)
	}

	recordsImported := 0

	// 4. Se tiver Bundle FHIR real, importa os exames anteriores
	if haveRealBundle {
		for _, entry := range fhirBundle.Entry {
			res := entry.Resource
			resType, _ := res["resourceType"].(string)

			if resType == "DiagnosticReport" {
				title := "Exame Clínico Importado"
				if codeMap, ok := res["code"].(map[string]interface{}); ok {
					if t, ok := codeMap["text"].(string); ok && t != "" {
						title = t
					}
				}

				conclusion, _ := res["conclusion"].(string)
				provider := "Clínica Parceira POHINC"
				if performers, ok := res["performer"].([]interface{}); ok && len(performers) > 0 {
					if pMap, ok := performers[0].(map[string]interface{}); ok {
						if d, ok := pMap["display"].(string); ok && d != "" {
							provider = d
						}
					}
				}

				resID, _ := res["id"].(string)

				// Evita duplicatas se já foi importado
				var existing models.MedicalRecord
				if err := database.DB.Where("fhir_resource_id = ? OR (patient_id = ? AND diagnosis = ?)", resID, localPatient.ID, title).First(&existing).Error; err == nil {
					continue
				}

				parsedDate := time.Now()
				if dtStr, ok := res["effectiveDateTime"].(string); ok && dtStr != "" {
					if t, err := time.Parse(time.RFC3339, dtStr); err == nil {
						parsedDate = t
					}
				}

				// Cria prontuário histórico local
				record := models.MedicalRecord{
					ID:             uuid.New().String(),
					PatientID:      localPatient.ID,
					DoctorID:       "federated-doctor",
					DoctorName:     provider,
					Date:           parsedDate,
					Diagnosis:      title,
					Prescription:   conclusion,
					Notes:          conclusion,
					FHIRResourceID: resID,
					CreatedAt:      time.Now(),
					UpdatedAt:      time.Now(),
				}
				database.DB.Create(&record)
				recordsImported++
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"status":           "imported",
		"message":          "Paciente e histórico clínico integrados com sucesso via HL7 FHIR!",
		"patient":          localPatient,
		"records_imported": recordsImported,
		"source":           "POHINC Central Bus",
	})
}
