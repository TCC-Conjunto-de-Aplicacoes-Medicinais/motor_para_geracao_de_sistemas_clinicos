package models

import "github.com/motor-clinicas/internal/crypto"

// GenerateRequest represents the expected HTTP payload to the engine
type GenerateRequest struct {
	Email string                  `json:"email"`
	CNPJ  string                  `json:"cnpj"`
	Data  crypto.EncryptedPayload `json:"data"`
}

type SystemPayload struct {
	ID             string         `json:"id"`
	CreatedAt      string         `json:"createdAt"`
	Version        string         `json:"version"`
	Identity       Identity       `json:"identity"`
	Implementation Implementation `json:"implementation"`
	Modules        Modules        `json:"modules"`
	Technical      Technical      `json:"technical"`
}

type Identity struct {
	ClinicName   string  `json:"clinicName"`
	LogoFile     *string `json:"logoFile"`
	LogoFileName *string `json:"logoFileName"`
	LogoType     string  `json:"logoType"`
	Palette      string  `json:"palette"`
}

type Implementation struct {
	Address string `json:"address"`
	Type    string `json:"type"`
}

type Modules struct {
	Assistant  ModuleAssistant  `json:"assistant"`
	Doctor     ModuleDoctor     `json:"doctor"`
	Management ModuleManagement `json:"management"`
	Shared     ModuleShared     `json:"shared"`
}

type ModuleAssistant struct {
	Enabled  bool `json:"enabled"`
	Features struct {
		Billing             bool `json:"billing"`
		BillingCheckControl bool `json:"billingCheckControl"`
		CheckInOut          bool `json:"checkInOut"`
		DoctorScheduleView  bool `json:"doctorScheduleView"`
		InsurancePlans      bool `json:"insurancePlans"`
		PatientManagement   bool `json:"patientManagement"`
		Scheduling          bool `json:"scheduling"`
	} `json:"features"`
	Scope string `json:"scope"`
}

type ModuleDoctor struct {
	Enabled  bool `json:"enabled"`
	Features struct {
		ConsultationHistory bool `json:"consultationHistory"`
		Dashboard           bool `json:"dashboard"`
		PatientList         bool `json:"patientList"`
		PatientRecord       struct {
			AIEcg                bool `json:"aiEcg"`
			Allergies            bool `json:"allergies"`
			DigitalSignature     bool `json:"digitalSignature"`
			Enabled              bool `json:"enabled"`
			FileUpload           bool `json:"fileUpload"`
			Files                bool `json:"files"`
			MedicationControl    bool `json:"medicationControl"`
			PrescriptionTemplate bool `json:"prescriptionTemplate"`
			Prescriptions        bool `json:"prescriptions"`
			StampedPrescription  bool `json:"stampedPrescription"`
		} `json:"patientRecord"`
		Schedule bool `json:"schedule"`
	} `json:"features"`
}

type ModuleManagement struct {
	Enabled  bool `json:"enabled"`
	Features struct {
		AttendanceControl bool `json:"attendanceControl"`
		BillingByDoctor   bool `json:"billingByDoctor"`
		BillingControl    bool `json:"billingControl"`
		Dashboards        bool `json:"dashboards"`
		DoctorSchedules   bool `json:"doctorSchedules"`
		StaffRegistration bool `json:"staffRegistration"`
		SystemCost        bool `json:"systemCost"`
	} `json:"features"`
}

type ModuleShared struct {
	Settings bool `json:"settings"`
}

type Technical struct {
	DeploymentType      string         `json:"deploymentType"`
	DrSecondaryEnv      *string        `json:"drSecondaryEnv"`
	Environment         string         `json:"environment"`
	EstimatedPrice      EstimatedPrice `json:"estimatedPrice"`
	HasDisasterRecovery bool           `json:"hasDisasterRecovery"`
	Sizing              Sizing         `json:"sizing"`
}

type EstimatedPrice struct {
	Currency string  `json:"currency"`
	Monthly  float64 `json:"monthly"`
	Setup    float64 `json:"setup"`
}

type Sizing struct {
	AvgAssistants int `json:"avgAssistants"`
	AvgDoctors    int `json:"avgDoctors"`
	MaxPatients   int `json:"maxPatients"`
	MinPatients   int `json:"minPatients"`
}
