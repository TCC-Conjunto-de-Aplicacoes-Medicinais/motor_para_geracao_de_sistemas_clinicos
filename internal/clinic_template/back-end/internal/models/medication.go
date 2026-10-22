package models

import "time"

// Medication é um medicamento em uso pelo paciente, cadastrado na clínica.
type Medication struct {
	ID        string    `json:"id" gorm:"primaryKey;type:varchar(64)"`
	PatientID string    `json:"patient_id" gorm:"type:varchar(64);index;not null"`
	Name      string    `json:"name" gorm:"type:varchar(255);not null"`
	Frequency string    `json:"freq" gorm:"type:varchar(100)"`
	Since     string    `json:"since" gorm:"type:varchar(50)"`
	CreatedAt time.Time `json:"created_at"`
}
