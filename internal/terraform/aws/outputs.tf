output "alb_dns_name" {
  description = "Nome DNS do Application Load Balancer na AWS"
  value       = aws_lb.clinic_alb.dns_name
}

output "clinic_url" {
  description = "URL publica para acesso ao frontend da clinica"
  value       = "http://${aws_lb.clinic_alb.dns_name}"
}

output "api_health_check_url" {
  description = "URL do Health Check da API Go da clinica (validacao < 4 min)"
  value       = "http://${aws_lb.clinic_alb.dns_name}/health"
}

output "instance_public_ip" {
  description = "Endereco IP publico da instancia EC2"
  value       = aws_instance.clinic_server.public_ip
}

output "vpc_id" {
  description = "ID da VPC dedicada da clinica"
  value       = aws_vpc.clinic_vpc.id
}

output "s3_bucket_name" {
  description = "Nome do bucket S3 isolado da clinica"
  value       = aws_s3_bucket.clinic_storage.bucket
}

output "clinic_id" {
  description = "Identificador da clinica"
  value       = var.clinic_id
}

output "clinic_name" {
  description = "Nome fantasia da clinica"
  value       = var.clinic_name
}
