package models

import (
	"time"
)

type Patient struct {
	ID        string    `json:"id" gorm:"primaryKey;type:varchar(64)"`
	Name      string    `json:"name" gorm:"type:varchar(255);not null"`
	CPF       string    `json:"cpf" gorm:"type:varchar(14);uniqueIndex;not null"`
	BirthDate string    `json:"birth_date" gorm:"type:varchar(20)"`
	Gender    string    `json:"gender" gorm:"type:varchar(20)"`
	Phone     string    `json:"phone" gorm:"type:varchar(30)"`
	Email     string    `json:"email" gorm:"type:varchar(150)"`
	Address   string    `json:"address" gorm:"type:text"`
	Insurance string    `json:"insurance" gorm:"type:varchar(120)"`
	BloodType string    `json:"blood_type" gorm:"type:varchar(10)"`
	Allergies string    `json:"allergies" gorm:"type:text"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
