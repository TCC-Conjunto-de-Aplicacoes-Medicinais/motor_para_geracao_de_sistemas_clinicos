package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"

	"golang.org/x/crypto/pbkdf2"
)

// EncryptedPayload represents the structure received from the frontend
type EncryptedPayload struct {
	Nonce   string `json:"n"`
	Payload string `json:"p"`
	Tag     string `json:"t"`
	Version int    `json:"v"`
}

// DeriveKey creates a 32-byte AES-256 key from three independent sources via PBKDF2.
// It is identical to deriveCompositeKey in the web project's vault.go.
func DeriveKey(email, cnpj, objKey string) []byte {
	composite := fmt.Sprintf("%s|%s|%s", email, cnpj, objKey)
	salt := sha256.Sum256([]byte(fmt.Sprintf("oh_%s_%s", cnpj, objKey[:8])))
	return pbkdf2.Key([]byte(composite), salt[:], 100000, 32, sha256.New)
}

// DecryptAESGCM decrypts the base64 encoded payload using the given 32-byte key
// and base64 encoded nonce.
func DecryptAESGCM(key []byte, b64Payload string, b64Nonce string) ([]byte, error) {
	if len(key) != 32 {
		return nil, errors.New("a chave deve ter 32 bytes para AES-256")
	}

	ciphertext, err := base64.StdEncoding.DecodeString(b64Payload)
	if err != nil {
		return nil, fmt.Errorf("falha ao decodificar payload base64: %v", err)
	}

	nonce, err := base64.StdEncoding.DecodeString(b64Nonce)
	if err != nil {
		return nil, fmt.Errorf("falha ao decodificar nonce base64: %v", err)
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, fmt.Errorf("falha ao criar cipher: %v", err)
	}

	aesgcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("falha ao criar GCM: %v", err)
	}

	if len(nonce) != aesgcm.NonceSize() {
		return nil, fmt.Errorf("tamanho do nonce invalido: esperado %d, obtido %d", aesgcm.NonceSize(), len(nonce))
	}

	// Decrypt the ciphertext
	plaintext, err := aesgcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return nil, fmt.Errorf("falha ao descriptografar payload: %v", err)
	}

	return plaintext, nil
}
