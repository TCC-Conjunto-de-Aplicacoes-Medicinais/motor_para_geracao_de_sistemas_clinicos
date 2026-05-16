package models

import (
	"time"
	"gorm.io/gorm"
)

type Assistant struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Name        string         `gorm:"size:255;not null" json:"name"`
	CPF         string         `gorm:"size:14;unique;not null" json:"cpf"`
	Phone       string         `gorm:"size:20" json:"phone"`
	Email       string         `gorm:"size:100;unique" json:"email"`
	Password    string         `gorm:"size:255" json:"-"`
	Gender      string         `gorm:"size:50" json:"gender"`
	KeycloakID  string         `gorm:"size:255;unique" json:"keycloak_id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}
