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

	// 4. Seed Base Patients
	seedPatients(db)

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

func seedPatients(db *gorm.DB) {
	var count int64
	db.Model(&models.Patient{}).Count(&count)
	if count == 0 {
		basePatients := []models.Patient{
			{
				ID:        "1",
				Name:      "Maria Santos",
				CPF:       "123.456.789-00",
				BirthDate: "1981-04-12",
				Gender:    "Feminino",
				Phone:     "(11) 98765-4321",
				Email:     "maria.santos@email.com",
				Address:   "Rua das Flores, 120 - São Paulo/SP (POHINC Integrado)",
			},
			{
				ID:        "2",
				Name:      "Carlos Eduardo Oliveira",
				CPF:       "234.567.890-11",
				BirthDate: "1975-08-25",
				Gender:    "Masculino",
				Phone:     "(11) 97654-3210",
				Email:     "carlos.oliveira@email.com",
				Address:   "Av. Paulista, 1500 - São Paulo/SP (POHINC Integrado)",
			},
			{
				ID:        "3",
				Name:      "Ana Beatriz Lima",
				CPF:       "345.678.901-22",
				BirthDate: "1994-11-03",
				Gender:    "Feminino",
				Phone:     "(11) 96543-2109",
				Email:     "ana.lima@email.com",
				Address:   "Rua Augusta, 450 - São Paulo/SP (POHINC Integrado)",
			},
			{
				ID:        "4",
				Name:      "Roberto Ferreira Costa",
				CPF:       "456.789.012-33",
				BirthDate: "1966-02-17",
				Gender:    "Masculino",
				Phone:     "(11) 95432-1098",
				Email:     "roberto.costa@email.com",
				Address:   "Alameda Santos, 890 - São Paulo/SP (POHINC Integrado)",
			},
		}
		for _, p := range basePatients {
			db.Create(&p)
		}
		log.Println("[Seed] Pacientes base da rede POHINC integrados com sucesso no banco de dados!")
	}
}


