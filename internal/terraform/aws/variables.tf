variable "clinic_id" {
  type = string
}

variable "clinic_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "instance_type" {
  type = string
}

variable "dr_enabled" {
  type = bool
  default = false
}

variable "module_doctor" {
  type = bool
  default = false
}

variable "module_billing" {
  type = bool
  default = false
}
