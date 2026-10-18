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

func UpdateAppointmentHandler(c *gin.Context) {
	id := c.Param("id")
	var appointment models.Appointment
	if err := database.DB.First(&appointment, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Agendamento não encontrado"})
		return
	}

	var updates models.Appointment
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos: " + err.Error()})
		return
	}

	if updates.Status != "" {
		appointment.Status = updates.Status
	}
	if !updates.DateTime.IsZero() {
		appointment.DateTime = updates.DateTime
	}
	if updates.Reason != "" {
		appointment.Reason = updates.Reason
	}
	if updates.Insurance != "" {
		appointment.Insurance = updates.Insurance
	}
	if updates.Price > 0 {
		appointment.Price = updates.Price
	}
	if updates.DoctorName != "" {
		appointment.DoctorName = updates.DoctorName
	}
	if updates.DoctorID != "" {
		appointment.DoctorID = updates.DoctorID
	}
	if updates.PatientName != "" {
		appointment.PatientName = updates.PatientName
	}
	if updates.PatientID != "" {
		appointment.PatientID = updates.PatientID
	}
	appointment.UpdatedAt = time.Now()

	if err := database.DB.Save(&appointment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar agendamento: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, appointment)
}

func DeleteAppointmentHandler(c *gin.Context) {
	id := c.Param("id")
	if err := database.DB.Delete(&models.Appointment{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao remover agendamento"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Agendamento removido com sucesso", "id": id})
}
