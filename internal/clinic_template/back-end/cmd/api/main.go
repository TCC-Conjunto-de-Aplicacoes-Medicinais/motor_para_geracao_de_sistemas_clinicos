package main

import (
	"log"
	"os"

	"clinic-backend/internal/database"
	"clinic-backend/internal/handlers"
	"clinic-backend/internal/models"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env if exists
	godotenv.Load()

	// Initialize Database
	database.InitDB()

	// Automigrate Models
	database.DB.AutoMigrate(
		&models.Doctor{},
		&models.Assistant{},
		&models.Administrator{},
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

	// Health Check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "clinic": os.Getenv("CLINIC_NAME")})
	})

	// Auth
	r.POST("/login", handlers.LoginHandler)


	// Routes
	// The motor will inject route groups here
	// setupDoctorRoutes(r)
	// setupAssistantRoutes(r)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	r.Run(":" + port)
}
