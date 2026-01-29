variable "aws_region" {
  description = "AWS region"
  default     = "us-east-1"
}

variable "aws_access_key" {
  description = "AWS Access Key ID"
  type        = string
  sensitive   = true
}

variable "aws_secret_key" {
  description = "AWS Secret Access Key"
  type        = string
  sensitive   = true
}

variable "aws_session_token" {
  description = "AWS Session Token (for Academy)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "ssh_key_name" {
  description = "Name of the SSH key pair in AWS"
  type        = string
  default     = "vockey" # Common default in Academy
}

variable "instance_type_server" {
  description = "EC2 instance type for k3s server"
  default     = "t3.medium"
}

variable "instance_type_agent" {
  description = "EC2 instance type for k3s agent"
  default     = "t3.small"
}

variable "ami_id" {
  description = "Ubuntu 22.04 LTS AMI ID (us-east-1)"
  default     = "ami-0c7217cdde317cfec" # Check if this is current, or use data source
}
