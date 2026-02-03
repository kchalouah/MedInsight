# MedInsight Kubernetes Deployment Guide

## 📋 Overview
This guide ensures **consistent, repeatable deployments** of MedInsight across environments (Minikube and AWS EKS) with proper secret management.

---

## 🔐 Secret Management Strategy

### Secret Files
All sensitive credentials are stored in `infra/k8s/secrets.yaml` with base64-encoded values:
- **`db-credentials`**: PostgreSQL credentials
- **`keycloak-secrets`**: Keycloak admin and client secrets
- **`oauth-secrets`**: Google/GitHub OAuth credentials
- **`smtp-secrets`**: Email service credentials

### Configuration Files
Non-sensitive configuration is stored in `infra/k8s/configmap.yaml`:
- Service URLs (Eureka, Keycloak)
- Database host/port
- Spring profiles

---

## 🚀 Deployment Sequence

### 1️⃣ **Clean Deployment (Fresh Start)**

Use this for initial setup or when resetting the environment:

```powershell
# Delete everything (preserves namespace)
kubectl delete all --all -n medinsight
kubectl delete pvc --all -n medinsight
kubectl delete secret --all -n medinsight
kubectl delete configmap --all -n medinsight
kubectl delete job --all -n medinsight

# Apply secrets and config
kubectl apply -f infra/k8s/secrets.yaml
kubectl apply -f infra/k8s/configmap.yaml

# Deploy infrastructure (Postgres, Keycloak, Discovery)
kubectl apply -f infra/k8s/base.yaml

# Wait for infrastructure to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n medinsight --timeout=120s
kubectl wait --for=condition=ready pod -l app=keycloak -n medinsight --timeout=300s

# Bootstrap Keycloak (realm, roles, OAuth)
kubectl apply -f infra/k8s/bootstrap-job.yaml
kubectl wait --for=condition=complete job/keycloak-bootstrap -n medinsight --timeout=300s

# Deploy backend microservices
kubectl apply -f infra/k8s/backend-services.yaml

# Deploy frontend and ingress
kubectl apply -f infra/k8s/frontend.yaml
kubectl apply -f infra/k8s/ingress.yaml

# Verify deployment
kubectl get pods -n medinsight
```

---

### 2️⃣ **Update Deployment (Existing Environment)**

Use this when updating code or configuration without resetting data:

```powershell
# Update secrets/config if changed
kubectl apply -f infra/k8s/secrets.yaml
kubectl apply -f infra/k8s/configmap.yaml

# Update services
kubectl apply -f infra/k8s/backend-services.yaml
kubectl apply -f infra/k8s/frontend.yaml

# Force restart to pick up new config
kubectl rollout restart deployment -n medinsight
```

---

## ⚠️ Critical: Password Consistency

### The Problem
If Postgres is initialized with one password but services try to connect with a different password, you'll get:
```
FATAL: password authentication failed for user "medinsight"
```

### The Solution
**Always delete the Postgres PVC when changing credentials:**

```powershell
kubectl delete statefulset postgres -n medinsight
kubectl delete pvc postgres-data-postgres-0 -n medinsight
kubectl apply -f infra/k8s/base.yaml
```

This forces Postgres to reinitialize with the new password from `db-credentials` secret.

---

## 🔧 Troubleshooting

### Keycloak CrashLoopBackOff
**Symptoms**: Keycloak restarts repeatedly
**Cause**: Database connection failure or insufficient startup time
**Fix**:
```powershell
# Check logs
kubectl logs -l app=keycloak -n medinsight --tail=100

# If password error, reset Postgres (see above)
# If timeout, increase initialDelaySeconds in base.yaml (currently 180s)
```

### Bootstrap Job Fails
**Symptoms**: `CreateContainerConfigError` or job never completes
**Causes**:
1. Missing secrets (check `kubectl get secrets -n medinsight`)
2. Keycloak not ready
**Fix**:
```powershell
# Delete and recreate job
kubectl delete job keycloak-bootstrap -n medinsight
kubectl apply -f infra/k8s/bootstrap-job.yaml

# Check job logs
kubectl logs job/keycloak-bootstrap -n medinsight
```

### Microservices 500 Errors
**Symptoms**: API calls return HTTP 500
**Causes**:
1. Database connection failure (wrong password)
2. Keycloak JWT validation failure
**Fix**:
```powershell
# Check service logs
kubectl logs -l app=auth-service -n medinsight --tail=100

# Verify environment variables
kubectl exec deployment/auth-service -n medinsight -- env | grep -E "DB_HOST|POSTGRES|KEYCLOAK"
```

---

## 🌐 AWS EKS Deployment

### Prerequisites
1. EKS cluster provisioned
2. `kubectl` configured for EKS context
3. Secrets updated with production values in `secrets.yaml`

### Deployment Steps
```bash
# Switch to EKS context
kubectl config use-context <eks-cluster-name>

# Create namespace
kubectl create namespace medinsight

# Follow Clean Deployment sequence above
# (Same commands work for both Minikube and EKS)
```

### Production Considerations
1. **Use AWS Secrets Manager** instead of K8s secrets for production
2. **Use RDS** instead of in-cluster Postgres
3. **Use ALB Ingress Controller** for load balancing
4. **Enable pod autoscaling** (HPA)
5. **Configure persistent volumes** with EBS

---

## ✅ Verification Checklist

After deployment, verify:
- [ ] All pods are `Running` and `Ready`
- [ ] Keycloak accessible at `http://medinsight.local/auth`
- [ ] Bootstrap job `Completed`
- [ ] Backend services respond to health checks
- [ ] Frontend accessible via Ingress
- [ ] OAuth login works (Google/GitHub)
- [ ] Database connections successful (check logs)

```powershell
# Quick health check
kubectl get pods -n medinsight
kubectl get ingress -n medinsight
curl http://medinsight.local/auth/realms/medinsight
```

---

## 📝 Maintenance

### Updating Secrets
```powershell
# Edit secrets.yaml with new base64-encoded values
# Apply changes
kubectl apply -f infra/k8s/secrets.yaml

# Restart affected services
kubectl rollout restart deployment auth-service -n medinsight
```

### Viewing Secret Values
```powershell
# Decode a secret
kubectl get secret db-credentials -n medinsight -o jsonpath="{.data.POSTGRES_PASSWORD}" | base64 -d
```

### Backup Database
```powershell
kubectl exec postgres-0 -n medinsight -- pg_dump -U medinsight medinsight > backup.sql
```

---

## 🎯 Key Takeaways

1. **Always apply secrets BEFORE infrastructure**
2. **Delete Postgres PVC when changing DB credentials**
3. **Wait for Keycloak readiness before running bootstrap job**
4. **Use the same deployment sequence for Minikube and AWS**
5. **Check logs immediately if pods aren't Ready**
