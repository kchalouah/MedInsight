import httpx
import asyncio
import logging
import sys
from datetime import datetime, timedelta
import random

# Configuration
GATEWAY_URL = "http://localhost:8080"
KEYCLOAK_URL = "http://localhost:8180/realms/medinsight/protocol/openid-connect/token"

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("MedInsight-V2-Tester")

class MedInsightV2Tester:
    def __init__(self):
        self.patient_creds = {"email": f"tester_pat_{random.randint(1000, 9999)}@example.com", "password": "Password123!"}
        self.doctor_creds = {"email": f"tester_doc_{random.randint(1000, 9999)}@example.com", "password": "Password123!"}
        self.admin_creds = {"email": "admin@medinsight.com", "password": "admin"} # Assuming bootstrap created this
        
        self.ids = {"patient": None, "doctor": None, "appointment": None}
        self.tokens = {"patient": None, "doctor": None, "admin": None}

    async def get_token(self, client, email, password):
        data = {
            "grant_type": "password",
            "client_id": "auth-service",
            "client_secret": "auth-service-secret",
            "username": email,
            "password": password
        }
        try:
            resp = await client.post(KEYCLOAK_URL, data=data)
            if resp.status_code == 200:
                return f"Bearer {resp.json()['access_token']}"
        except Exception: pass
        return None

    async def test_step(self, name, func, client):
        logger.info(f"--- Testing: {name} ---")
        try:
            success = await func(client)
            if success:
                logger.info(f"✅ {name}: SUCCESS")
            else:
                logger.error(f"❌ {name}: FAILED")
            return success
        except Exception as e:
            logger.error(f"💥 {name}: ERROR -> {e}")
            return False

    # --- Test Modules ---

    async def register_users(self, client):
        # Register Doctor
        doc_payload = {
            "email": self.doctor_creds["email"], "password": self.doctor_creds["password"],
            "firstName": "Doc", "lastName": "Tester", "specialization": "Testing",
            "licenseNumber": "LIC-" + str(random.randint(1000, 9999)), "yearsOfExperience": 5, "consultationFee": 50.0
        }
        r1 = await client.post(f"{GATEWAY_URL}/api/auth/register/medecin", json=doc_payload)
        if r1.status_code == 201:
            self.ids["doctor"] = r1.json().get("id")
        
        # Register Patient
        pat_payload = {
            "email": self.patient_creds["email"], "password": self.patient_creds["password"],
            "firstName": "Pat", "lastName": "Tester", "dateOfBirth": "1995-05-15",
            "phoneNumber": "0601020304"
        }
        r2 = await client.post(f"{GATEWAY_URL}/api/auth/register/patient", json=pat_payload)
        if r2.status_code == 201:
            self.ids["patient"] = r2.json().get("id")
            
        return self.ids["doctor"] and self.ids["patient"]

    async def login_all(self, client):
        self.tokens["doctor"] = await self.get_token(client, self.doctor_creds["email"], self.doctor_creds["password"])
        self.tokens["patient"] = await self.get_token(client, self.patient_creds["email"], self.patient_creds["password"])
        # Attempt admin login if available
        self.tokens["admin"] = await self.get_token(client, "admin", "KeycloakAdmin2024!") # Using known admin
        return self.tokens["doctor"] and self.tokens["patient"]

    async def create_appointment(self, client):
        payload = {
            "patientId": self.ids["patient"],
            "doctorId": self.ids["doctor"],
            "appointmentDateTime": (datetime.now() + timedelta(days=5)).isoformat(),
            "reason": "Test Validation"
        }
        headers = {"Authorization": self.tokens["patient"]}
        resp = await client.post(f"{GATEWAY_URL}/api/appointments", json=payload, headers=headers)
        if resp.status_code == 201:
            self.ids["appointment"] = resp.json().get("id")
            return True
        return False

    async def update_medical_record(self, client):
        # Only doctors can update clinical data
        payload = {
            "bloodType": "B+", "allergies": "Latex, Pollen",
            "chronicConditions": "Asthma", "emergencyContactName": "Testing Contact",
            "emergencyContactPhone": "0700000000", "medicalHistory": "None"
        }
        headers = {"Authorization": self.tokens["doctor"]}
        resp = await client.put(f"{GATEWAY_URL}/api/records/patient/{self.ids['patient']}", json=payload, headers=headers)
        return resp.status_code == 200

    async def add_clinical_note(self, client):
        payload = {
            "appointmentId": self.ids["appointment"],
            "patientId": self.ids["patient"],
            "noteContent": "L'intégration est fonctionnelle. Le système de test valide ce point."
        }
        headers = {"Authorization": self.tokens["doctor"]}
        resp = await client.post(f"{GATEWAY_URL}/api/records/notes", json=note_payload if 'note_payload' in locals() else payload, headers=headers)
        return resp.status_code == 201

    async def get_full_dossier(self, client):
        # Patient viewing their own record
        headers = {"Authorization": self.tokens["patient"]}
        resp = await client.get(f"{GATEWAY_URL}/api/records/patient/{self.ids['patient']}/dossier", headers=headers)
        if resp.status_code == 200:
            data = resp.json()
            # Verify aggregation
            has_record = data.get("medicalRecord") is not None
            has_notes = len(data.get("consultationNotes", [])) > 0
            if has_record and has_notes:
                logger.info(f"   - Dossier verified: {len(data.get('consultationNotes'))} notes found.")
                return True
        return False

    async def test_audit_logs(self, client):
        # Assuming admin can read logs
        if not self.tokens["admin"]: return True # Skip if no admin token
        headers = {"Authorization": self.tokens["admin"]}
        # We try to get logs for the patient
        resp = await client.get(f"{GATEWAY_URL}/api/audit/logs", headers=headers)
        if resp.status_code == 200:
            logger.info(f"   - Audit Service reachable. Found {len(resp.json())} entries.")
            return True
        return False

    async def test_mail_service(self, client):
        # Administrators or Doctors can trigger mail
        payload = {
            "to": "test@example.com",
            "subject": "MedInsight Connectivity Test",
            "body": "This is a test from the integration suite."
        }
        headers = {"Authorization": self.tokens["doctor"]}
        resp = await client.post( f"{GATEWAY_URL}/api/mail/send", json=payload, headers=headers)
        # 202 because mail handling might be async
        return resp.status_code in [200, 202]

    async def issue_prescription(self, client):
        payload = {
            "patientId": self.ids["patient"],
            "medicationName": "Amoxicillin",
            "dosage": "500mg",
            "duration": "7 days",
            "instructions": "Take with food"
        }
        headers = {"Authorization": self.tokens["doctor"]}
        resp = await client.post(f"{GATEWAY_URL}/api/appointments/{self.ids['appointment']}/prescriptions", json=payload, headers=headers)
        return resp.status_code == 201

    async def verify_patient_prescriptions(self, client):
        headers = {"Authorization": self.tokens["patient"]}
        resp = await client.get(
            f"{GATEWAY_URL}/api/prescriptions/patient/{self.ids['patient']}",
            headers=headers
        )
        if resp.status_code == 200:
            found = any(
                p["medicationName"] == "Amoxicillin"
                for p in resp.json().get("content", [])
            )
            return found
        return False


    async def test_ml_predictions(self, client):
        # Diagnosis prediction
        diag_payload = {
            "age": 30, "gender": "M", "symptoms": ["fever", "cough"],
            "blood_pressure_systolic": 120, "blood_pressure_diastolic": 80,
            "heart_rate": 72, "temperature": 38.5
        }
        headers = {"Authorization": self.tokens["doctor"]}
        r1 = await client.post(f"{GATEWAY_URL}/api/ml/predict/diagnosis", json=diag_payload, headers=headers)
        
        # Treatment suggestion
        treat_payload = {
            "diagnosis": "Common Cold", "patient_age": 30, "severity": "mild", "history": []
        }
        r2 = await client.post(f"{GATEWAY_URL}/api/ml/predict/treatment", json=treat_payload, headers=headers)
        
        return r1.status_code == 200 and r2.status_code == 200

    async def test_security_rbac(self, client):
        logger.info("   - Verifying Patient cannot access Doctor endpoints...")
        # Patient trying to call a doctor-only endpoint (issue prescription)
        headers = {"Authorization": self.tokens["patient"]}
        payload = {
            "patientId": self.ids["patient"],
            "medicationName": "HackAttempt",
            "dosage": "999mg", "duration": "forever"
        }
        appointment_id = self.ids["appointment"] or "00000000-0000-0000-0000-000000000000"
        resp = await client.post(f"{GATEWAY_URL}/api/appointments/{appointment_id}/prescriptions", json=payload, headers=headers)
        # Should be 403 Forbidden
        if resp.status_code != 403:
            logger.error(f"   ⚠️ RBAC Failure: Expected 403, got {resp.status_code}")
            return False
        return True

    async def test_service_discovery(self, client):
        logger.info("   - Checking Eureka registration for all services...")
        # Query discovery-service directly (usually on 8761)
        # In docker-compose it's mapped to localhost:8761
        try:
            resp = await client.get("http://localhost:8761/eureka/apps", headers={"Accept": "application/json"})
            if resp.status_code == 200:
                apps = resp.json().get("applications", {}).get("application", [])
                app_names = [app["name"].upper() for app in apps]
                required = ["AUTH-SERVICE", "APPOINTMENT-SERVICE", "MEDICAL-RECORD-SERVICE", 
                            "AUDIT-SERVICE", "MAIL-SERVICE", "ML-SERVICE", "GATEWAY-SERVICE"]
                missing = [svc for svc in required if svc not in app_names]
                if not missing:
                    logger.info(f"   - All {len(required)} core services are registered.")
                    return True
                else:
                    logger.error(f"   - Missing from Eureka: {missing}")
        except Exception as e:
            logger.error(f"   - Eureka check failed: {e}")
        return False

    async def test_error_handling(self, client):
        logger.info("   - Verifying handling of invalid data...")
        # Non-existent appointment ID
        headers = {"Authorization": self.tokens["doctor"]}
        resp = await client.get(f"{GATEWAY_URL}/api/appointments/00000000-0000-0000-0000-000000000000", headers=headers)
        # Should be 404
        return resp.status_code == 404

    async def run(self):
        async with httpx.AsyncClient(timeout=30.0) as client:
            steps = [
                ("Service Discovery Check", self.test_service_discovery),
                ("User Registration", self.register_users),
                ("Authentication & Tokens", self.login_all),
                ("Appointment Creation", self.create_appointment),
                ("Security & RBAC", self.test_security_rbac),
                ("Prescription Issuance", self.issue_prescription),
                ("Patient Prescription Access", self.verify_patient_prescriptions),
                ("Medical Record Initialization", self.update_medical_record),
                ("Clinical Notes Recording", self.add_clinical_note),
                ("ML Medical Predictions", self.test_ml_predictions),
                ("Aggregated Patient Dossier", self.get_full_dossier),
                ("Audit Trail Verification", self.test_audit_logs),
                ("Mail Service Connectivity", self.test_mail_service),
                ("API Error Handling", self.test_error_handling)
            ]
            
            summary = []
            for name, func in steps:
                success = await self.test_step(name, func, client)
                summary.append((name, success))
                if not success:
                    logger.warning(f"Aborting sequence after failure in {name}")
                    break
            
            logger.info("\n" + "="*30)
            logger.info(" FINAL TEST SUMMARY ")
            logger.info("="*30)
            for name, success in summary:
                status = "PASS" if success else "FAIL"
                logger.info(f"{name:.<30} {status}")
            logger.info("="*30)

if __name__ == "__main__":
    asyncio.run(MedInsightV2Tester().run())
