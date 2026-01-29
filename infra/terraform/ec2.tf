resource "aws_instance" "k3s_server" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type_server
  subnet_id              = tolist(data.aws_subnets.default.ids)[0]
  vpc_security_group_ids = [aws_security_group.k3s_sg.id]
  key_name               = var.ssh_key_name

  tags = {
    Name = "medinsight-k3s-server"
  }

  user_data = <<-EOF
              #!/bin/bash
              apt-get update
              apt-get install -y curl
              curl -sfL https://get.k3s.io | K3S_TOKEN=medinsight-secret-token sh -s - server \
                --node-external-ip $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4) \
                --tls-san $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4) \
                --write-kubeconfig-mode 644
              EOF
}

resource "aws_instance" "k3s_agent" {
  count                  = 1 # Start with 1 worker to save resources
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type_agent
  subnet_id              = tolist(data.aws_subnets.default.ids)[0]
  vpc_security_group_ids = [aws_security_group.k3s_sg.id]
  key_name               = var.ssh_key_name

  tags = {
    Name = "medinsight-k3s-agent-${count.index + 1}"
  }

  depends_on = [aws_instance.k3s_server]

  user_data = <<-EOF
              #!/bin/bash
              apt-get update
              apt-get install -y curl
              # Wait for master to be ready (dumb sleep or retry loop)
              sleep 60
              curl -sfL https://get.k3s.io | K3S_URL=https://${aws_instance.k3s_server.private_ip}:6443 K3S_TOKEN=medinsight-secret-token sh -
              EOF
}
