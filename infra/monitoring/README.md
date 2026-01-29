# Monitoring Stack Setup

We use **Helm** to deploy the monitoring stack.

## Prerequisites
- `kubectl` configured to talk to your K3s cluster (via `~/.kube/config` on master or downloaded kubeconfig).
- `helm` installed.

## 1. Install Prometheus & Grafana
We use the `kube-prometheus-stack`.

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

kubectl create namespace monitoring

helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set grafana.adminPassword=admin
```

## 2. Install Loki & Promtail
We use `loki-stack` for log aggregation.

```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

helm install loki grafana/loki-stack \
  --namespace monitoring \
  --set promtail.enabled=true \
  --set loki.isDefault=false
```

## 3. Access Grafana
Port-forward Grafana to your local machine (ssh tunnel through EC2 if needed):

```bash
kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring
```
URL: `http://localhost:3000`
User: `admin`
Pass: `admin`

## 4. Configure Data Sources
- **Prometheus**: Already configured by the stack.
- **Loki**:
  1. Go to Configuration -> Data Sources -> Add data source.
  2. Select **Loki**.
  3. URL: `http://loki:3100`
  4. Save & Test.
