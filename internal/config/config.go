package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port               string
	ObjKey             string
	AWSRegion          string
	AWSAccessKeyID     string
	AWSSecretAccessKey string
	AWSSessionToken    string
	AWSBucketName      string
}

// LoadConfig reads the .env file and populates the Config struct.
func LoadConfig() *Config {
	// Trying to load from .env file, ignore error if it doesn't exist (e.g. running in cloud environment)
	_ = godotenv.Load()

	return &Config{
		Port:               getEnv("PORT", "8080"),
		ObjKey:             getEnv("OBJ_KEY", ""),
		AWSRegion:          getEnv("AWS_REGION", "us-east-1"),
		AWSAccessKeyID:     getEnv("AWS_ACCESS_KEY_ID", ""),
		AWSSecretAccessKey: getEnv("AWS_SECRET_ACCESS_KEY", ""),
		AWSSessionToken:    getEnv("AWS_SESSION_TOKEN", ""),
		AWSBucketName:      getEnv("AWS_BUCKET_NAME", ""),
	}
}

func getEnv(key, defaultVal string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultVal
}
