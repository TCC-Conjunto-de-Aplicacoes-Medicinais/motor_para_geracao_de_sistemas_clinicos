terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  safe_clinic_name = lower(replace(var.clinic_name, "/[^a-zA-Z0-9]/", "-"))
  short_id         = substr(var.clinic_id, 0, 6)
  short_name       = substr(local.safe_clinic_name, 0, 14)
  name_prefix      = "pohinc-${local.safe_clinic_name}-${substr(var.clinic_id, 0, 8)}"
}

# 1. Zonas de Disponibilidade (Multi-AZ obrigatório para ALB)
data "aws_availability_zones" "available" {
  state = "available"
}

# 2. Rede Virtual Isolada por Clínica (VPC Single-Tenant - CONIC 2026)
resource "aws_vpc" "clinic_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${local.name_prefix}-vpc"
    ClinicID    = var.clinic_id
    ClinicName  = var.clinic_name
    Environment = var.environment
    ManagedBy   = "POHINC-MGS-Clinico"
  }
}

# 3. Internet Gateway
resource "aws_internet_gateway" "clinic_igw" {
  vpc_id = aws_vpc.clinic_vpc.id

  tags = {
    Name     = "${local.name_prefix}-igw"
    ClinicID = var.clinic_id
  }
}

# 4. Subnets Públicas Multi-AZ para o Application Load Balancer
resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.clinic_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name     = "${local.name_prefix}-subnet-pub-a"
    ClinicID = var.clinic_id
  }
}

resource "aws_subnet" "public_b" {
  vpc_id                  = aws_vpc.clinic_vpc.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = true

  tags = {
    Name     = "${local.name_prefix}-subnet-pub-b"
    ClinicID = var.clinic_id
  }
}

# 5. Tabela de Roteamento Pública
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.clinic_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.clinic_igw.id
  }

  tags = {
    Name     = "${local.name_prefix}-rt-pub"
    ClinicID = var.clinic_id
  }
}

resource "aws_route_table_association" "public_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "public_b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public_rt.id
}

# 6. Security Group do Application Load Balancer (ALB)
resource "aws_security_group" "alb_sg" {
  name        = "${local.name_prefix}-alb-sg"
  description = "Controle de acesso externo ao Load Balancer da clinica"
  vpc_id      = aws_vpc.clinic_vpc.id

  ingress {
    description = "Acesso HTTP Publico"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Trafego liberado para os containers internos"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name     = "${local.name_prefix}-alb-sg"
    ClinicID = var.clinic_id
  }
}

# 7. Security Group da Instância e Contêineres (Isolamento Estrito - ANVISA/LGPD)
resource "aws_security_group" "app_sg" {
  name        = "${local.name_prefix}-app-sg"
  description = "Regras de isolamento: somente o ALB pode acessar as portas de app"
  vpc_id      = aws_vpc.clinic_vpc.id

  ingress {
    description     = "Backend Go vindo exclusivamente do ALB"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  ingress {
    description     = "Frontend Next.js vindo exclusivamente do ALB"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  ingress {
    description = "SSH para administracao e auditoria"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "MariaDB restrito localmente (Single-Tenant isolado)"
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    self        = true
  }

  egress {
    description = "Saida para download de dependencias e imagens"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name     = "${local.name_prefix}-app-sg"
    ClinicID = var.clinic_id
  }
}

# 8. Application Load Balancer (ALB)
resource "aws_lb" "clinic_alb" {
  name               = "pohinc-alb-${local.short_name}-${local.short_id}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = [aws_subnet.public_a.id, aws_subnet.public_b.id]

  enable_deletion_protection = false

  tags = {
    Name     = "${local.name_prefix}-alb"
    ClinicID = var.clinic_id
  }
}

# 9. Target Group do Frontend Next.js
resource "aws_lb_target_group" "web_tg" {
  name                 = "pohinc-web-${local.short_name}-${local.short_id}"
  port                 = 3000
  protocol             = "HTTP"
  vpc_id               = aws_vpc.clinic_vpc.id
  target_type          = "instance"
  deregistration_delay = 10

  health_check {
    path                = "/"
    protocol            = "HTTP"
    port                = "3000"
    matcher             = "200,301,302,304"
    interval            = 15
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }

  tags = {
    Name     = "${local.name_prefix}-web-tg"
    ClinicID = var.clinic_id
  }
}

# 10. Target Group da API Go (Health Check em /health conforme o Artigo CONIC)
resource "aws_lb_target_group" "api_tg" {
  name                 = "pohinc-api-${local.short_name}-${local.short_id}"
  port                 = 8080
  protocol             = "HTTP"
  vpc_id               = aws_vpc.clinic_vpc.id
  target_type          = "instance"
  deregistration_delay = 10

  health_check {
    path                = "/health"
    protocol            = "HTTP"
    port                = "8080"
    matcher             = "200"
    interval            = 15
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }

  tags = {
    Name     = "${local.name_prefix}-api-tg"
    ClinicID = var.clinic_id
  }
}

# 11. Listener HTTP (Porta 80)
resource "aws_lb_listener" "http_listener" {
  load_balancer_arn = aws_lb.clinic_alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web_tg.arn
  }
}

# 12. Regra de Roteamento para a API Go (/api/* e /health)
resource "aws_lb_listener_rule" "api_rule" {
  listener_arn = aws_lb_listener.http_listener.arn
  priority     = 10

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api_tg.arn
  }

  condition {
    path_pattern {
      values = ["/api/*", "/health", "/login"]
    }
  }
}

# 13. AMI Oficial Ubuntu 22.04 LTS
data "aws_ami" "ubuntu" {
  most_recent = true

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  owners = ["099720109477"] # Canonical
}

# 14. Bucket S3 para Arquivos, Exames e Bundle da Clínica
resource "aws_s3_bucket" "clinic_storage" {
  bucket        = substr("${local.safe_clinic_name}-s3-${var.clinic_id}", 0, 63)
  force_destroy = true

  tags = {
    Name        = "Storage da Clinica ${var.clinic_name}"
    Environment = var.environment
    ClinicID    = var.clinic_id
    ManagedBy   = "POHINC-MGS-Clinico"
  }
}

# 15. Upload do Bundle Pré-Compilado (Frontend Standalone + Backend Go Linux)
resource "aws_s3_object" "clinic_bundle" {
  bucket = aws_s3_bucket.clinic_storage.id
  key    = "clinic_bundle.tar.gz"
  source = "${path.module}/clinic_bundle.tar.gz"
  etag   = filemd5("${path.module}/clinic_bundle.tar.gz")
}

# 16. Instância Computacional Dedicada com Execução do Sistema Clínico Real
resource "aws_instance" "clinic_server" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.public_a.id
  vpc_security_group_ids      = [aws_security_group.app_sg.id]
  associate_public_ip_address = true
  depends_on                  = [aws_s3_object.clinic_bundle]

  root_block_device {
    volume_size           = 12
    volume_type           = "gp3"
    delete_on_termination = true
  }

  user_data = <<-EOF
              #!/bin/bash
              set -e

              # 0. FinOps Watchdog Fallback: Desliga a instância após 15 minutos caso o motor local seja encerrado
              shutdown -h +15 &

              # 1. Configurar 2GB de Swap para garantir que a t3.micro rode Docker tranquilamente
              fallocate -l 2G /swapfile
              chmod 600 /swapfile
              mkswap /swapfile
              swapon /swapfile
              echo '/swapfile none swap sw 0 0' >> /etc/fstab

              # 2. Instalar Docker, Docker Compose e AWS CLI
              apt-get update -y
              apt-get install -y docker.io docker-compose awscli
              systemctl enable docker
              systemctl start docker

              # 3. Criar diretório de execução e obter o bundle da clínica do S3
              mkdir -p /opt/clinic
              cd /opt/clinic

              export AWS_ACCESS_KEY_ID="${var.aws_access_key}"
              export AWS_SECRET_ACCESS_KEY="${var.aws_secret_key}"
              export AWS_DEFAULT_REGION="${var.aws_region}"

              for retry in 1 2 3 4 5 6 7 8 9 10 11 12; do
                if aws s3 cp s3://${aws_s3_bucket.clinic_storage.bucket}/clinic_bundle.tar.gz /opt/clinic/clinic_bundle.tar.gz --region ${var.aws_region}; then
                  break
                fi
                sleep 5
              done

              unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY

              # Descompactar frontend standalone e backend compilado
              tar -xzf /opt/clinic/clinic_bundle.tar.gz -C /opt/clinic
              chmod +x /opt/clinic/backend/clinic_backend

              # 4. Criar Docker Compose com MariaDB, Backend Go e Frontend Next.js Standalone
              cat << 'DOCKER_EOF' > /opt/clinic/docker-compose.yml
              version: '3.8'
              services:
                mariadb:
                  image: mariadb:10.11
                  container_name: clinic_mariadb
                  restart: always
                  environment:
                    MYSQL_ROOT_PASSWORD: rootpass_${var.clinic_id}
                    MYSQL_DATABASE: clinic_${var.clinic_id}
                    MYSQL_USER: clinic_user
                    MYSQL_PASSWORD: clinic_pass
                  ports:
                    - "3306:3306"
                  volumes:
                    - db_data:/var/lib/mysql

                backend:
                  image: alpine:3.19
                  container_name: clinic_backend
                  restart: always
                  working_dir: /app
                  volumes:
                    - ./backend:/app
                  environment:
                    PORT: "8080"
                    CLINIC_ID: "${var.clinic_id}"
                    CLINIC_NAME: "${var.clinic_name}"
                    DB_HOST: "mariadb"
                    DB_PORT: "3306"
                    DB_USER: "clinic_user"
                    DB_PASSWORD: "clinic_pass"
                    DB_NAME: "clinic_${var.clinic_id}"
                    CENTRAL_BUS_URL: "https://central.pohinc.com.br/api/exams"
                  ports:
                    - "8080:8080"
                  command: /app/clinic_backend
                  depends_on:
                    - mariadb

                frontend:
                  image: node:20-alpine
                  container_name: clinic_frontend
                  restart: always
                  working_dir: /app
                  volumes:
                    - ./frontend:/app
                  environment:
                    PORT: "3000"
                    HOSTNAME: "0.0.0.0"
                    NODE_ENV: "production"
                  ports:
                    - "3000:3000"
                  command: node server.js
                  depends_on:
                    - backend

              volumes:
                db_data:
              DOCKER_EOF

              # 5. Iniciar os serviços Docker da clínica
              docker-compose up -d
              EOF

  tags = {
    Name        = "${local.name_prefix}-ec2"
    ClinicID    = var.clinic_id
    ClinicName  = var.clinic_name
    Environment = var.environment
    ManagedBy   = "POHINC-MGS-Clinico"
  }
}

# 18. Associação da Instância EC2 aos Target Groups do ALB
resource "aws_lb_target_group_attachment" "web_attachment" {
  target_group_arn = aws_lb_target_group.web_tg.arn
  target_id        = aws_instance.clinic_server.id
  port             = 3000
}

resource "aws_lb_target_group_attachment" "api_attachment" {
  target_group_arn = aws_lb_target_group.api_tg.arn
  target_id        = aws_instance.clinic_server.id
  port             = 8080
}
