package models

import (
	"time"
)

type Appointment struct {
	ID          string    `json:"id" gorm:"primaryKey;type:varchar(64)"`
	PatientID   string    `json:"patient_id" gorm:"type:varchar(64);index;not null"`
	PatientName string    `json:"patient_name" gorm:"type:varchar(255)"`
	DoctorID    string    `json:"doctor_id" gorm:"type:varchar(64);not null"`
	DoctorName  string    `json:"doctor_name" gorm:"type:varchar(255)"`
	DateTime    time.Time `json:"date_time"`
	Status      string    `json:"status" gorm:"type:varchar(30);default:'scheduled'"` // scheduled, completed, cancelled
	Reason      string    `json:"reason" gorm:"type:text"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
