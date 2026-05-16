terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

locals {
  safe_clinic_name = lower(replace(var.clinic_name, "/[^a-zA-Z0-9]/", ""))
}

# 1. Resource Group
resource "azurerm_resource_group" "clinic_rg" {
  name     = "rg-${local.safe_clinic_name}-${var.clinic_id}"
  location = "East US"
}

# 2. Storage Account
resource "azurerm_storage_account" "clinic_storage" {
  name                     = "st${substr(local.safe_clinic_name, 0, 10)}${substr(replace(var.clinic_id, "-", ""), 0, 5)}"
  resource_group_name      = azurerm_resource_group.clinic_rg.name
  location                 = azurerm_resource_group.clinic_rg.location
  account_tier             = "Standard"
  account_replication_type = var.dr_enabled ? "GRS" : "LRS"

  tags = {
    Environment = var.environment
    ClinicID    = var.clinic_id
  }
}

output "storage_account_name" {
  value = azurerm_storage_account.clinic_storage.name
}
