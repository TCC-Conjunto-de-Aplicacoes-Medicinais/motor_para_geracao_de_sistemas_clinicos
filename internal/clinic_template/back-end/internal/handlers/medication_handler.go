package handlers

import (
	"net/http"
	"strings"
	"time"

	"clinic-backend/internal/database"
	"clinic-backend/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ListMedicationsHandler GET /api/medications?patient_id=...
func ListMedicationsHandler(c *gin.Context) {
	var meds []models.Medication
	if err := database.DB.Where("patient_id = ?", c.Query("patient_id")).Order("created_at ASC").Find(&meds).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao listar medicamentos"})
		return
	}
	c.JSON(http.StatusOK, meds)
}

type createMedicationRequest struct {
	PatientID string `json:"patient_id" binding:"required"`
	Name      string `json:"name" binding:"required"`
	Frequency string `json:"freq"`
}

// CreateMedicationHandler POST /api/medications
func CreateMedicationHandler(c *gin.Context) {
	var req createMedicationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "paciente e nome do medicamento são obrigatórios"})
		return
	}
	med := models.Medication{
		ID:        uuid.New().String(),
		PatientID: req.PatientID,
		Name:      strings.TrimSpace(req.Name),
		Frequency: strings.TrimSpace(req.Frequency),
		Since:     time.Now().Format("02/01/2006"),
		CreatedAt: time.Now(),
	}
	if err := database.DB.Create(&med).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao salvar medicamento"})
		return
	}
	c.JSON(http.StatusCreated, med)
}
