package handlers

import (
	"clinic-backend/internal/auth"
	"clinic-backend/internal/database"
	"clinic-backend/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type LoginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func LoginHandler(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	// 1. Procurar em Doctor
	var doctor models.Doctor
	if err := database.DB.Where("email = ?", req.Email).First(&doctor).Error; err == nil {
		if checkPassword(doctor.Password, req.Password) {
			respondWithToken(c, doctor.ID, "doctor", doctor.Name)
			return
		}
	}

	// 2. Procurar em Assistant
	var assistant models.Assistant
	if err := database.DB.Where("email = ?", req.Email).First(&assistant).Error; err == nil {
		if checkPassword(assistant.Password, req.Password) {
			respondWithToken(c, assistant.ID, "assistant", assistant.Name)
			return
		}
	}

	// 3. Procurar em Administrator
	var admin models.Administrator
	if err := database.DB.Where("email = ?", req.Email).First(&admin).Error; err == nil {
		if checkPassword(admin.Password, req.Password) {
			respondWithToken(c, admin.ID, "management", admin.Name)
			return
		}
	}

	c.JSON(http.StatusUnauthorized, gin.H{"error": "E-mail ou senha incorretos"})
}

func checkPassword(hashed, plain string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hashed), []byte(plain))
	return err == nil
}

func respondWithToken(c *gin.Context, userID uint, role, name string) {
	token, err := auth.GenerateToken(userID, role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao gerar token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"id":   userID,
			"role": role,
			"name": name,
		},
	})
}
