variable "clinic_id" {
  type        = string
  description = "Identificador único da clínica"
}

variable "central_bus_key" {
  type        = string
  description = "Chave de sincronização com o centralizador (X-Clinic-Key)"
  sensitive   = true
  default     = ""
}

variable "clinic_name" {
  type        = string
  description = "Nome da clínica parceira"
}

variable "environment" {
  type        = string
  description = "Ambiente de execução (aws, local)"
  default     = "aws"
}

variable "instance_type" {
  type        = string
  description = "Tipo de instância EC2 (padrão t3.micro para máxima economia)"
  default     = "t3.micro"
}

variable "aws_region" {
  type        = string
  description = "Região AWS de provisionamento"
  default     = "us-east-1"
}

variable "dr_enabled" {
  type        = bool
  description = "Habilitar Disaster Recovery multi-região"
  default     = false
}

variable "module_doctor" {
  type        = bool
  description = "Módulo médico ativo"
  default     = true
}

variable "module_billing" {
  type        = bool
  description = "Módulo financeiro/faturamento ativo"
  default     = false
}

variable "aws_access_key" {
  type        = string
  description = "Access key AWS para download seguro do bundle no S3"
  default     = ""
  sensitive   = true
}

variable "aws_secret_key" {
  type        = string
  description = "Secret key AWS para download seguro do bundle no S3"
  default     = ""
  sensitive   = true
}

