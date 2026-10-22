package engine

import (
	"archive/tar"
	"compress/gzip"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"

	"github.com/motor-clinicas/internal/models"
)

// packageAWSBundle compacta o frontend Next.js standalone e o backend Go compilado para Linux em um .tar.gz
func packageAWSBundle(workDir string, payload *models.SystemPayload) error {
	log.Println("[Engine] 📦 Empacotando Frontend Standalone e Backend Go Linux para envio à AWS...")

	bundleTarPath := filepath.Join(workDir, "clinic_bundle.tar.gz")
	tarFile, err := os.Create(bundleTarPath)
	if err != nil {
		return fmt.Errorf("falha ao criar arquivo bundle: %v", err)
	}
	defer tarFile.Close()

	gw := gzip.NewWriter(tarFile)
	defer gw.Close()

	tw := tar.NewWriter(gw)
	defer tw.Close()

	// 1. Backend Go - Adicionar o binário estático Linux
	backendBinPath := filepath.Join("internal", "clinic_template", "back-end", "clinic_backend")
	if _, err := os.Stat(backendBinPath); os.IsNotExist(err) {
		return fmt.Errorf("binário Linux do backend não encontrado em %s", backendBinPath)
	}

	if err := addFileToTar(tw, backendBinPath, "backend/clinic_backend", 0755); err != nil {
		return fmt.Errorf("falha ao adicionar binário do backend ao bundle: %v", err)
	}

	// 2. Backend Go - Adicionar o arquivo de ambiente .env
	envContent := fmt.Sprintf(`DB_USER=clinic_user
DB_PASSWORD=clinic_pass
DB_HOST=mariadb
DB_PORT=3306
DB_NAME=clinic_%s
CLINIC_NAME=%s
CLINIC_ID=%s
PORT=8080
`, payload.ID, payload.Identity.ClinicName, payload.ID)

	if err := addBytesToTar(tw, []byte(envContent), "backend/.env", 0644); err != nil {
		return fmt.Errorf("falha ao adicionar .env do backend: %v", err)
	}

	// 3. Frontend Next.js Standalone (.next/standalone)
	standaloneDir := filepath.Join("internal", "clinic_template", ".next", "standalone")
	if _, err := os.Stat(standaloneDir); os.IsNotExist(err) {
		return fmt.Errorf("diretório standalone do frontend não encontrado em %s", standaloneDir)
	}

	err = filepath.Walk(standaloneDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		rel, err := filepath.Rel(standaloneDir, path)
		if err != nil {
			return err
		}
		if rel == "." || rel == filepath.Join("public", "clinic.config.json") || rel == "public/clinic.config.json" {
			return nil
		}

		tarHeaderName := filepath.ToSlash(filepath.Join("frontend", rel))

		if info.IsDir() {
			header := &tar.Header{
				Name:     tarHeaderName + "/",
				Mode:     0755,
				Typeflag: tar.TypeDir,
			}
			return tw.WriteHeader(header)
		}

		return addFileToTar(tw, path, tarHeaderName, 0644)
	})
	if err != nil {
		return fmt.Errorf("falha ao empacotar arquivos do frontend: %v", err)
	}

	// O standalone do Next não inclui os assets (.next/static) nem a pasta public: sem eles a página abre em branco (404 em JS/CSS).
	if err := addTreeToTar(tw, filepath.Join("internal", "clinic_template", ".next", "static"), "frontend/.next/static", ""); err != nil {
		return fmt.Errorf("falha ao empacotar assets estáticos do frontend: %v", err)
	}
	if err := addTreeToTar(tw, filepath.Join("internal", "clinic_template", "public"), "frontend/public", "clinic.config.json"); err != nil {
		return fmt.Errorf("falha ao empacotar pasta public do frontend: %v", err)
	}

	// 4. Injetar a configuração personalizada da clínica no frontend (public/clinic.config.json)
	configMap := make(map[string]interface{})
	payloadBytes, _ := json.Marshal(payload)
	_ = json.Unmarshal(payloadBytes, &configMap)
	configMap["backendUrl"] = "" // Mesmo host via ALB da AWS

	configBytes, _ := json.MarshalIndent(configMap, "", "  ")
	if err := addBytesToTar(tw, configBytes, "frontend/public/clinic.config.json", 0644); err != nil {
		return fmt.Errorf("falha ao injetar clinic.config.json no bundle: %v", err)
	}

	log.Printf("[Engine] ✅ Bundle da clínica gerado com sucesso em: %s", bundleTarPath)
	return nil
}

func addFileToTar(tw *tar.Writer, srcPath, tarName string, mode int64) error {
	file, err := os.Open(srcPath)
	if err != nil {
		return err
	}
	defer file.Close()

	info, err := file.Stat()
	if err != nil {
		return err
	}

	header, err := tar.FileInfoHeader(info, "")
	if err != nil {
		return err
	}
	header.Name = filepath.ToSlash(tarName)
	header.Mode = mode

	if err := tw.WriteHeader(header); err != nil {
		return err
	}

	_, err = io.Copy(tw, file)
	return err
}

func addBytesToTar(tw *tar.Writer, data []byte, tarName string, mode int64) error {
	header := &tar.Header{
		Name:     filepath.ToSlash(tarName),
		Mode:     mode,
		Size:     int64(len(data)),
		Typeflag: tar.TypeReg,
	}
	if err := tw.WriteHeader(header); err != nil {
		return err
	}
	_, err := tw.Write(data)
	return err
}

// addTreeToTar grava uma árvore de diretórios no tar, com o prefixo dst.
// skipName ignora um arquivo pelo nome (ex.: clinic.config.json, que é injetado depois).
func addTreeToTar(tw *tar.Writer, src, dst, skipName string) error {
	return filepath.Walk(src, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		rel, err := filepath.Rel(src, path)
		if err != nil {
			return err
		}
		if rel == "." {
			return nil
		}
		if !info.IsDir() && filepath.Base(path) == skipName && skipName != "" {
			return nil
		}
		name := filepath.ToSlash(filepath.Join(dst, rel))
		if info.IsDir() {
			return tw.WriteHeader(&tar.Header{Name: name + "/", Mode: 0755, Typeflag: tar.TypeDir})
		}
		return addFileToTar(tw, path, name, 0644)
	})
}
