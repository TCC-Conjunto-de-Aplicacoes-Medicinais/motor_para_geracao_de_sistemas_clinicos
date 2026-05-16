package database

import (
	"clinic-backend/internal/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"log"
)

func SeedData(db *gorm.DB) {
	log.Println("Seeding default users...")

	// 1. Seed Doctor
	seedDoctor(db)

	// 2. Seed Assistant
	seedAssistant(db)
	
	// 3. Seed Admin (for management)
	seedAdmin(db)

	log.Println("Seeding completed!")
}

func hashPassword(password string) string {
	bytes, _ := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes)
}

func seedDoctor(db *gorm.DB) {
	var count int64
	db.Model(&models.Doctor{}).Where("email = ?", "medico@gmail.com").Count(&count)
	if count == 0 {
		doctor := models.Doctor{
			Name:       "Dr. Padrão",
			Email:      "medico@gmail.com",
			Password:   hashPassword("medico123"),
			CPF:        "000.000.000-00",
			CRM:        "123456/SP",
			KeycloakID: "mock-doctor-id",
		}
		db.Create(&doctor)
	}
}

func seedAssistant(db *gorm.DB) {
	var count int64
	db.Model(&models.Assistant{}).Where("email = ?", "assistente@gmail.com").Count(&count)
	if count == 0 {
		assistant := models.Assistant{
			Name:       "Assistente Padrão",
			Email:      "assistente@gmail.com",
			Password:   hashPassword("assistente123"),
			CPF:        "111.111.111-11",
			KeycloakID: "mock-assistant-id",
		}
		db.Create(&assistant)
	}
}


func seedAdmin(db *gorm.DB) {
	var count int64
	db.Model(&models.Administrator{}).Where("email = ?", "gerente@gmail.com").Count(&count)
	if count == 0 {
		admin := models.Administrator{
			Name:       "Gerente Padrão",
			Email:      "gerente@gmail.com",
			Password:   hashPassword("gerente123"),
			CPF:        "222.222.222-22",
			KeycloakID: "mock-admin-id",
		}
		db.Create(&admin)
	}
}


