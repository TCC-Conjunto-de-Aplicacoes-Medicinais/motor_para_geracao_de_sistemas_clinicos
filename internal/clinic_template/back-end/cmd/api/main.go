package main

import (
	"log"
	"os"
	"time"

	"clinic-backend/internal/database"
	"clinic-backend/internal/handlers"
	"clinic-backend/internal/models"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env if exists
	_ = godotenv.Load()

	// Initialize Database
	database.InitDB()

	// Automigrate Models (Usuários, Pacientes, Prontuários e Agendamentos)
	database.DB.AutoMigrate(
		&models.Doctor{},
		&models.Assistant{},
		&models.Administrator{},
		&models.Patient{},
		&models.MedicalRecord{},
		&models.Appointment{},
	)

	// Seed Initial Data
	database.SeedData(database.DB)

	r := gin.Default()

	// CORS Configuration
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Health Check padronizado (conforme o artigo CONIC 2026 para o ALB da AWS)
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":      "ok",
			"clinic_id":   os.Getenv("CLINIC_ID"),
			"clinic_name": os.Getenv("CLINIC_NAME"),
			"timestamp":   time.Now().Format(time.RFC3339),
			"standard":    "HL7-FHIR-R4",
		})
	})

	// Auth
	r.POST("/login", handlers.LoginHandler)

	// Clinical Routes
	api := r.Group("/api")
	{
		// Pacientes
		api.GET("/patients", handlers.ListPatientsHandler)
		api.GET("/patients/:id", handlers.GetPatientHandler)
		api.POST("/patients", handlers.CreatePatientHandler)
		api.POST("/patients/import-central", handlers.ImportPatientFromCentralHandler)

		// Prontuários & Laudos (com despacho HL7 FHIR)
		api.GET("/records", handlers.ListRecordsHandler)
		api.POST("/records", handlers.CreateRecordHandler)

		// Agendamentos
		api.GET("/appointments", handlers.ListAppointmentsHandler)
		api.POST("/appointments", handlers.CreateAppointmentHandler)
		api.PUT("/appointments/:id", handlers.UpdateAppointmentHandler)
		api.DELETE("/appointments/:id", handlers.DeleteAppointmentHandler)

		// Análise de IA para ECG (SaMD ANVISA RDC 657/2022)
		api.POST("/ecg/analyze", handlers.EcgAnalysisHandler)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Servidor da Clínica iniciado na porta %s", port)
	_ = r.Run(":" + port)
}
