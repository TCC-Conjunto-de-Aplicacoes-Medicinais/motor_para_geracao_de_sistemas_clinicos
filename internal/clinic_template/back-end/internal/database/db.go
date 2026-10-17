package database

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/glebarez/sqlite"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() {
	dbType := os.Getenv("DB_TYPE")
	if dbType == "sqlite" {
		initSQLite()
		return
	}

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_NAME"),
	)

	var err error
	for i := 0; i < 3; i++ {
		DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
		if err == nil {
			fmt.Println("Database connected successfully to MariaDB/MySQL")
			return
		}
		log.Printf("Tentativa de conexão com MariaDB/MySQL (%d/3): %v", i+1, err)
		time.Sleep(1 * time.Second)
	}

	log.Println("⚠️ MariaDB não disponível no ambiente local. Ativando fallback automático para SQLite de Alta Resiliência...")
	initSQLite()
}

func initSQLite() {
	var err error
	dbPath := os.Getenv("SQLITE_PATH")
	if dbPath == "" {
		dbPath = "clinic.db"
	}
	DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		log.Fatalf("Falha crítica ao inicializar SQLite: %v", err)
	}
	log.Printf("✅ Banco de Dados SQLite local ativo com sucesso (%s)!", dbPath)
}
