terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  # As credenciais serão capturadas pelas variáveis de ambiente passadas pelo Go
}

# Criar nome seguro para o S3 (sem espaços, sem caracteres especiais, lowercase)
locals {
  safe_clinic_name = lower(replace(var.clinic_name, "/[^a-zA-Z0-9]/", "-"))
  bucket_name      = "${local.safe_clinic_name}-s3-${var.clinic_id}"
}

# 1. Bucket S3 para Arquivos da Clínica
resource "aws_s3_bucket" "clinic_storage" {
  bucket = local.bucket_name
  tags = {
    Name        = "Storage da Clínica ${var.clinic_name}"
    Environment = var.environment
    ClinicID    = var.clinic_id
  }
}

# 2. Instância EC2 (Exemplo Simulado)
# data "aws_ami" "ubuntu" {
#   most_recent = true
#   filter {
#     name   = "name"
#     values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
#   }
#   owners = ["099720109477"]
# }
# 
# resource "aws_instance" "app_server" {
#   ami           = data.aws_ami.ubuntu.id
#   instance_type = var.instance_type
#   
#   tags = {
#     Name     = "${local.safe_clinic_name}_${var.clinic_id}"
#     ClinicID = var.clinic_id
#   }
# }

output "s3_bucket_name" {
  value = aws_s3_bucket.clinic_storage.bucket
}
