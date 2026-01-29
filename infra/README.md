# MedInsight AWS Deployment (K3s on EC2)

This folder contains the Infrastructure as Code (Terraform) and Kubernetes manifests to deploy MedInsight on AWS using K3s.

## Prerequisites
- [Terraform](https://www.terraform.io/) installed.
- AWS Credentials (Access Key, Secret Key, Session Token).
- [Helm](https://helm.sh/) installed (for monitoring).

## 1. Provision Infrastructure
Navigate to `infra/terraform`:
```bash
cd infra/terraform
terraform init
terraform apply -auto-approve
```

**Key Outputs:**
- `k3s_server_ip`: Public IP of the K3s Master.
- `k3s_agent_ips`: Public IPs of the Agents.

**Note which endpoint is the master!**

## 2. GitHub Secrets Setup
Go to your GitHub Repository -> Settings -> Secrets and Variables -> Actions -> New Repository Secret.

Add the following secrets:
- `EC2_HOST`: The `k3s_server_ip` from the Terraform output.
- `EC2_USER`: `ubuntu`
- `EC2_SSH_KEY`: The content of your private SSH key (PEM) associated with the `ssh_key_name` defined in credentials.

## 3. Deployment
The deployment is automated via GitHub Actions (`.github/workflows/deploy.yml`).
You can trigger it manually from the "Actions" tab or it triggers on push to `main` modifying `infra/k8s`.

## 4. Monitoring Stack
To install Prometheus, Grafana, and Loki, refer to [infra/monitoring/README.md](./monitoring/README.md).

## 5. Troubleshooting / Common Pitfalls
- **Security Groups**: Ensure port 6443 (API), 80, 443, and 30000-32767 are open.
- **K3s Token**: The user_data uses a fixed token `medinsight-secret-token`. If you change it, update both user_data scripts.
- **Frontend URLs**: The frontend is built with `NEXT_PUBLIC` variables. If accessing via a new domain/IP, you might need to rebuild the image or use a text replacement strategy if baked in. For now, add the Server IP to your local hosts file mapped to `medinsight.local`.
