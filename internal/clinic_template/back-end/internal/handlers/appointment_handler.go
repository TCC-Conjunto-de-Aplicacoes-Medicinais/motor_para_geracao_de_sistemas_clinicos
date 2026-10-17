package handlers

import (
	"net/http"
	"time"

	"clinic-backend/internal/database"
	"clinic-backend/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func ListAppointmentsHandler(c *gin.Context) {
	doctorID := c.Query("doctor_id")
	patientID := c.Query("patient_id")

	var appointments []models.Appointment
	query := database.DB.Order("date_time ASC")

	if doctorID != "" {
		query = query.Where("doctor_id = ?", doctorID)
	}
	if patientID != "" {
		query = query.Where("patient_id = ?", patientID)
	}

	if err := query.Find(&appointments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar agendamentos"})
		return
	}

	c.JSON(http.StatusOK, appointments)
}

func CreateAppointmentHandler(c *gin.Context) {
	var input models.Appointment
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
		return
	}

	if input.ID == "" {
		input.ID = uuid.New().String()
	}
	if input.DateTime.IsZero() {
		input.DateTime = time.Now().Add(24 * time.Hour)
	}
	if input.Status == "" {
		input.Status = "scheduled"
	}
	input.CreatedAt = time.Now()
	input.UpdatedAt = time.Now()

	if err := database.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar agendamento: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, input)
}
