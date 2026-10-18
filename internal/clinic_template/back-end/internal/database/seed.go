package database

import (
	"log"
	"time"

	"clinic-backend/internal/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func SeedData(db *gorm.DB) {
	log.Println("Seeding default users...")

	// 1. Seed Doctors
	seedDoctors(db)

	// 2. Seed Assistant
	seedAssistant(db)
	
	// 3. Seed Admin (for management)
	seedAdmin(db)

	// 4. Seed Base Patients
	seedPatients(db)

	// 5. Seed Base Appointments
	seedAppointments(db)

	log.Println("Seeding completed!")
}

func hashPassword(password string) string {
	bytes, _ := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes)
}

func seedDoctors(db *gorm.DB) {
	doctors := []models.Doctor{
		{
			Name:       "Dr. Silva",
			Email:      "medico@gmail.com",
			Password:   hashPassword("medico123"),
			CPF:        "000.000.000-00",
			CRM:        "123456/SP",
			KeycloakID: "mock-doctor-silva",
		},
		{
			Name:       "Dra. Lima",
			Email:      "dra.lima@gmail.com",
			Password:   hashPassword("medico123"),
			CPF:        "000.000.000-01",
			CRM:        "234567/SP",
			KeycloakID: "mock-doctor-lima",
		},
		{
			Name:       "Dr. Santos",
			Email:      "dr.santos@gmail.com",
			Password:   hashPassword("medico123"),
			CPF:        "000.000.000-02",
			CRM:        "345678/SP",
			KeycloakID: "mock-doctor-santos",
		},
	}

	for _, doc := range doctors {
		var count int64
		db.Model(&models.Doctor{}).Where("email = ?", doc.Email).Count(&count)
		if count == 0 {
			db.Create(&doc)
		}
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

func seedAppointments(db *gorm.DB) {
	var count int64
	db.Model(&models.Appointment{}).Count(&count)
	if count == 0 {
		now := time.Now()
		// Horários base de hoje
		t1 := time.Date(now.Year(), now.Month(), now.Day(), 9, 0, 0, 0, now.Location())
		t2 := time.Date(now.Year(), now.Month(), now.Day(), 11, 0, 0, 0, now.Location())
		t3 := time.Date(now.Year(), now.Month(), now.Day(), 14, 0, 0, 0, now.Location())
		t4 := time.Date(now.Year(), now.Month(), now.Day(), 16, 0, 0, 0, now.Location())
		// Dias seguintes
		t5 := t1.Add(24 * time.Hour)
		t6 := t3.Add(24 * time.Hour)
		t7 := t2.Add(48 * time.Hour)

		baseAppointments := []models.Appointment{
			{
				ID:          "apt-1",
				PatientID:   "1",
				PatientName: "Maria Santos",
				DoctorID:    "mock-doctor-silva",
				DoctorName:  "Dr. Silva",
				DateTime:    t1,
				Status:      "confirmed",
				Reason:      "Retorno Cardiológico",
				Insurance:   "Particular",
				Price:       280.0,
				CreatedAt:   now,
				UpdatedAt:   now,
			},
			{
				ID:          "apt-2",
				PatientID:   "2",
				PatientName: "Carlos Eduardo Oliveira",
				DoctorID:    "mock-doctor-silva",
				DoctorName:  "Dr. Silva",
				DateTime:    t2,
				Status:      "waiting",
				Reason:      "Consulta Hipertensão",
				Insurance:   "Unimed",
				Price:       220.0,
				CreatedAt:   now,
				UpdatedAt:   now,
			},
			{
				ID:          "apt-3",
				PatientID:   "3",
				PatientName: "Ana Beatriz Lima",
				DoctorID:    "mock-doctor-lima",
				DoctorName:  "Dra. Lima",
				DateTime:    t3,
				Status:      "in_progress",
				Reason:      "Avaliação ECG com IA",
				Insurance:   "Bradesco",
				Price:       350.0,
				CreatedAt:   now,
				UpdatedAt:   now,
			},
			{
				ID:          "apt-4",
				PatientID:   "4",
				PatientName: "Roberto Ferreira Costa",
				DoctorID:    "mock-doctor-santos",
				DoctorName:  "Dr. Santos",
				DateTime:    t4,
				Status:      "scheduled",
				Reason:      "Exame de Rotina",
				Insurance:   "SulAmérica",
				Price:       250.0,
				CreatedAt:   now,
				UpdatedAt:   now,
			},
			{
				ID:          "apt-5",
				PatientID:   "1",
				PatientName: "Maria Santos",
				DoctorID:    "mock-doctor-lima",
				DoctorName:  "Dra. Lima",
				DateTime:    t5,
				Status:      "scheduled",
				Reason:      "Revisão de Exames de Sangue",
				Insurance:   "Particular",
				Price:       280.0,
				CreatedAt:   now,
				UpdatedAt:   now,
			},
			{
				ID:          "apt-6",
				PatientID:   "2",
				PatientName: "Carlos Eduardo Oliveira",
				DoctorID:    "mock-doctor-santos",
				DoctorName:  "Dr. Santos",
				DateTime:    t6,
				Status:      "scheduled",
				Reason:      "Eletrocardiograma de Esforço",
				Insurance:   "Unimed",
				Price:       320.0,
				CreatedAt:   now,
				UpdatedAt:   now,
			},
			{
				ID:          "apt-7",
				PatientID:   "3",
				PatientName: "Ana Beatriz Lima",
				DoctorID:    "mock-doctor-silva",
				DoctorName:  "Dr. Silva",
				DateTime:    t7,
				Status:      "scheduled",
				Reason:      "Consulta Cardiológica Preventiva",
				Insurance:   "Bradesco",
				Price:       250.0,
				CreatedAt:   now,
				UpdatedAt:   now,
			},
		}

		for _, a := range baseAppointments {
			db.Create(&a)
		}
		log.Println("[Seed] Agendamentos base inseridos com sucesso no banco de dados!")
	}
}



