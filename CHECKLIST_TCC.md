# 📋 Checklist de Alinhamento Acadêmico — CONIC 2026
## Módulo 2: Motor de Geração e Orquestração IaC (MGS-Clínico)

> **Documento Base:** *Artigo CONIC SEMESP 2026 — Plataforma SaaS Open Health (POHINC)*  
> **Repositório:** `motor_para_geracao_de_sistemas_clinicos`  
> **Tecnologias Centrais:** Go 1.25, Docker, Terraform, AWS (VPC, IAM, ALB, EC2/Containers)

---

### 📌 1. Visão Geral do Módulo no Artigo
Conforme descrito nas Seções **3.2, 4.1, 5 (Figura 1) e 6.1** do artigo:
* **Papel:** Motor em Go que processa o payload JSON criptografado vindo do Módulo 1, realiza a "cirurgia de código" estática nos artefatos da clínica e executa os planos do Terraform para levantar infraestrutura isolada e dedicada na AWS.
* **Métricas Publicadas no Artigo:**
  - **Tempo de Convergência da Infraestrutura:** 3 minutos e 42 segundos (< 4 min) até HTTP 200 no health check da API provisionada.
  - **Recursos Provisionados na AWS:** Rede virtual (VPC, subnets), políticas de segurança (IAM/SGs), balanceadores de carga (ALB) e contêineres dedicados de banco de dados (MariaDB) e aplicação (Go/Next.js) por clínica parceira (*Single-Tenant por Instância*).

---

### 🎯 2. Status da Implementação — 100% Concluído ✅

#### 2.1. Endpoints e Orquestração do Motor
- [x] Servidor HTTP Go com endpoints `POST /generate`, `POST /generate-local`, `POST /destroy` e `GET /status`.
- [x] Descriptografia AES-GCM com derivação PBKDF2 em `internal/crypto/crypto.go`.
- [x] Algoritmo de "Cirurgia de Código" (`performCodeSurgery` e `backendCodeSurgery`) excluindo pastas não contratadas tanto em ambiente local quanto em nuvem.
- [x] Injeção dinâmica de `clinic.config.json` e `.env` no diretório alvo da clínica.
- [x] Provisionamento local via Docker funcional em `internal/terraform/local/main.tf`.

#### 2.2. Infraestrutura AWS no Terraform (`internal/terraform/aws/`)
- [x] **VPC e Subnets na AWS:**
  - Criados `aws_vpc` isolada por clínica, `aws_subnet` públicas multi-AZ (para ALB), `aws_internet_gateway` e `aws_route_table`.
- [x] **Políticas de Segurança e Controle de Acesso (Security Groups):**
  - Regras estritas de tráfego: apenas o ALB acessa os contêineres nas portas 3000 e 8080; o banco MariaDB fica estritamente isolado da internet pública (`self = true`), em total conformidade com a ANVISA e a LGPD.
- [x] **Application Load Balancer (ALB) e Target Groups:**
  - Configurado ALB com listener HTTP (porta 80), Target Groups para frontend (`/`) e backend (`/api/*` e `/health`), com *health check* ativo esperando HTTP 200.
- [x] **Provisionamento de Aplicação e MariaDB Dedicado por Clínica:**
  - Instância `t3.micro` super econômica provisionada com User Data executando Docker Compose (MariaDB 10.11 isolado, backend Go e frontend da clínica).
  - Configurado 2GB de swapfile na instância para garantir execução estável sem estouro de memória.
- [x] **Regra de Segurança de Produção & Proteção de Custos:**
  - Restrição no motor: se solicitante for `pohinc_test@gmail.com`, executa Terraform real na AWS. Demais contas entram em Modo Simulação Acadêmica sem custos.
  - Endpoint `POST /destroy` para desmontar 100% dos recursos (`terraform destroy -auto-approve`) sob demanda.

#### 2.3. Completude do Template Clínico (`internal/clinic_template`)
- [x] **Backend da Clínica (`clinic_template/back-end`):**
  - Adicionados modelos de dados: `Patient`, `MedicalRecord` e `Appointment`.
  - Adicionados handlers clínicos: `patient_handler.go`, `record_handler.go` e `appointment_handler.go`.
  - AutoMigrate no `main.go` para todas as tabelas clínicas.
  - Adicionado endpoint normativo `/health` para o health check do ALB.
- [x] **Integração com o Barramento Central (HL7 FHIR R4):**
  - Despachante assíncrono em `record_handler.go` enviando prontuários convertidos em `DiagnosticReport` HL7 FHIR R4 para o barramento centralizador (`sistema_centralizador_de_dados_clinicos_back`).
- [x] **Integração de IA Real no Frontend Clínico:**
  - Em `doctor/patients/[id]/page.tsx`, integrado com o microsserviço de IA de ECG (`POST http://localhost:8001/api/v1/ecg/analyze`) com fallback gracioso.
