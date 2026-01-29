output "k3s_server_ip" {
  description = "Public IP of K3s Server"
  value       = aws_instance.k3s_server.public_ip
}

output "k3s_agent_ips" {
  description = "Public IPs of K3s Agents"
  value       = aws_instance.k3s_agent[*].public_ip
}
