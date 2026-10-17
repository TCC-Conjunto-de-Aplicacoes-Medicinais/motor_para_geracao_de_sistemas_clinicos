terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0.1"
    }
  }
}

provider "docker" {
  # O Terraform descobrirá automaticamente o Docker daemon local (via socket ou variáveis de ambiente)
}

locals {
  safe_clinic_name = lower(replace(var.clinic_name, "/[^a-zA-Z0-9]/", "_"))
}

# 1. Rede Docker para comunicação dos containers
resource "docker_network" "clinic_net" {
  name = "${local.safe_clinic_name}_net_${var.clinic_id}"
}

# 2. MariaDB
resource "docker_image" "mariadb" {
  name         = "mariadb:10.11"
  keep_locally = true
}

resource "docker_container" "mariadb" {
  image = docker_image.mariadb.image_id
  name  = "${local.safe_clinic_name}_mariadb_${var.clinic_id}"
  
  env = [
    "MYSQL_ROOT_PASSWORD=rootpass",
    "MYSQL_DATABASE=clinic_${var.clinic_id}",
    "MYSQL_USER=clinic_user",
    "MYSQL_PASSWORD=clinic_pass"
  ]
  
  ports {
    internal = 3306
    external = 3306
  }

  networks_advanced {
    name    = docker_network.clinic_net.name
    aliases = ["mariadb"]
  }
}

# 3. Cassandra
resource "docker_image" "cassandra" {
  name         = "cassandra:latest"
  keep_locally = true
}

resource "docker_container" "cassandra" {
  image = docker_image.cassandra.image_id
  name  = "${local.safe_clinic_name}_cassandra_${var.clinic_id}"
  
  env = [
    "CASSANDRA_CLUSTER_NAME=ClinicCluster"
  ]

  ports {
    internal = 9042
    external = 9042
  }

  networks_advanced {
    name = docker_network.clinic_net.name
  }
}

# 4. Imagem do Frontend (Build via Dockerfile gerado pelo motor)
resource "docker_image" "frontend_build" {
  name = "clinica_${local.safe_clinic_name}_front:latest"
  triggers = {
    always_run = timestamp()
  }
  build {
    context = "${path.module}/frontend"
    build_args = {
      NEXT_PUBLIC_CLINIC_ID = var.clinic_id
    }
  }
}

# 5. Container do Frontend
resource "docker_container" "frontend" {
  image = docker_image.frontend_build.image_id
  name  = "${local.safe_clinic_name}_frontend_${var.clinic_id}"
  
  ports {
    internal = 3000
    external = 3001
  }

  networks_advanced {
    name = docker_network.clinic_net.name
  }
}
# 6. Imagem do Backend (Build via Dockerfile gerado pelo motor)
resource "docker_image" "backend_build" {
  name = "clinica_${local.safe_clinic_name}_back:latest"
  triggers = {
    always_run = timestamp()
  }
  build {
    context = "${path.module}/backend"
  }
}

# 7. Container do Backend
resource "docker_container" "backend" {
  image = docker_image.backend_build.image_id
  name  = "${local.safe_clinic_name}_backend_${var.clinic_id}"
  
  env = [
    "DB_USER=clinic_user",
    "DB_PASSWORD=clinic_pass",
    "DB_HOST=mariadb",
    "DB_PORT=3306",
    "DB_NAME=clinic_${var.clinic_id}",
    "CLINIC_NAME=${var.clinic_name}",
    "CLINIC_ID=${var.clinic_id}",
    "CENTRAL_BUS_URL=http://localhost:8002/api/exams"
  ]

  ports {
    internal = 8080
    external = 8081
  }

  networks_advanced {
    name = docker_network.clinic_net.name
  }

  depends_on = [docker_container.mariadb]
}

output "frontend_url" {
  value = "http://localhost:3001"
}
output "backend_url" {
  value = "http://localhost:8081"
}
output "mariadb_container" {
  value = docker_container.mariadb.name
}
output "cassandra_container" {
  value = docker_container.cassandra.name
}

