package models

import (
	"time"
)

type MedicalRecord struct {
	ID             string    `json:"id" gorm:"primaryKey;type:varchar(64)"`
	PatientID      string    `json:"patient_id" gorm:"type:varchar(64);index;not null"`
	DoctorID       string    `json:"doctor_id" gorm:"type:varchar(64);not null"`
	DoctorName     string    `json:"doctor_name" gorm:"type:varchar(255)"`
	Date           time.Time `json:"date"`
	Diagnosis      string    `json:"diagnosis" gorm:"type:text"`
	Prescription   string    `json:"prescription" gorm:"type:text"`
	Notes          string    `json:"notes" gorm:"type:text"`
	ECGRecordID    string    `json:"ecg_record_id,omitempty" gorm:"type:varchar(64)"`
	FHIRResourceID string    `json:"fhir_resource_id,omitempty" gorm:"type:varchar(128)"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}
