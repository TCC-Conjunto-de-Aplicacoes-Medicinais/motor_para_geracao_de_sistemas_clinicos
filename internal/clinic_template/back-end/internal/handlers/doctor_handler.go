package handlers

import (
	"net/http"
	"strconv"

	"clinic-backend/internal/database"
	"clinic-backend/internal/models"

	"github.com/gin-gonic/gin"
)

// ListDoctorsHandler devolve os médicos cadastrados na clínica (usados na agenda do assistente).
// O id é o KeycloakID, que é o que as consultas gravam em doctor_id.
func ListDoctorsHandler(c *gin.Context) {
	var doctors []models.Doctor
	if err := database.DB.Order("name").Find(&doctors).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao listar médicos"})
		return
	}
	type doctorItem struct {
		ID   string `json:"id"`
		Name string `json:"name"`
		CRM  string `json:"crm"`
	}
	out := make([]doctorItem, 0, len(doctors))
	for _, d := range doctors {
		id := d.KeycloakID
		if id == "" {
			id = strconv.FormatUint(uint64(d.ID), 10)
		}
		out = append(out, doctorItem{ID: id, Name: d.Name, CRM: d.CRM})
	}
	c.JSON(http.StatusOK, out)
}
