import httpx
import asyncio
import random
from faker import Faker
import logging
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:8080" # Gateway
AUTH_SERVICE_URL = f"{BASE_URL}/api/auth"
APPOINTMENT_SERVICE_URL = f"{BASE_URL}/api/appointments"
MEDICAL_RECORD_SERVICE_URL = f"{BASE_URL}/api/records"

# Keycloak Config
KEYCLOAK_TOKEN_URL = "http://localhost:8180/realms/medinsight/protocol/openid-connect/token"
CLIENT_ID = "medinsight-client"

fake = Faker('fr_FR')
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MedInsightPopulator:
    def __init__(self):
        self.doctors = []
        self.patients = []

    async def get_token(self, client, username, password):
        data = {"grant_type": "password", "client_id": CLIENT_ID, "username": username, "password": password}
        try:
            resp = await client.post(KEYCLOAK_TOKEN_URL, data=data)
            if resp.status_code == 200: return f"Bearer {resp.json()['access_token']}"
        except Exception: pass
        return None

    async def register_doctor(self, client):
        username = fake.user_name()
        password = "Password123!"
        payload = {
            "username": username, "email": f"{username}@medinsight.com", "password": password,
            "firstName": fake.first_name_male(), "lastName": fake.last_name(),
            "specialty": random.choice(["Cardiology", "Dermatology", "Pediatrics", "Neurology"]),
            "licenseNumber": fake.bothify(text='??-#####-##')
        }
        resp = await client.post(f"{AUTH_SERVICE_URL}/register/medecin", json=payload)
        if resp.status_code == 201:
            logger.info(f"Registered Doctor: {username}")
            return {"username": username, "password": password, "id": resp.json().get("id")}
        return None

    async def register_patient(self, client):
        username = fake.user_name()
        password = "Password123!"
        payload = {
            "username": username, "email": f"{username}@patient.com", "password": password,
            "firstName": fake.first_name(), "lastName": fake.last_name(),
            "dateOfBirth": fake.date_of_birth(minimum_age=18, maximum_age=90).isoformat(),
            "phoneNumber": fake.phone_number()
        }
        resp = await client.post(f"{AUTH_SERVICE_URL}/register/patient", json=payload)
        if resp.status_code == 201:
            logger.info(f"Registered Patient: {username}")
            return {"username": username, "password": password, "id": resp.json().get("id")}
        return None

    async def seed_medical_record(self, client, patient):
        token = await self.get_token(client, patient["username"], patient["password"])
        if not token: return
        headers = {"Authorization": token}
        payload = {
            "bloodType": random.choice(["A+", "O+", "B-", "AB+"]),
            "allergies": random.sample(["Pollen", "Peanuts", "Penicillin", "Dust"], k=random.randint(0, 2)),
            "chronicConditions": random.sample(["Asthma", "Diabetes", "Hypertension"], k=random.randint(0, 1)),
            "emergencyContactName": fake.name(),
            "emergencyContactPhone": fake.phone_number()
        }
        resp = await client.put(f"{MEDICAL_RECORD_SERVICE_URL}/patient/{patient['id']}", json=payload, headers=headers)
        if resp.status_code == 200:
            logger.info(f"Initialized Medical Record for {patient['username']}")

    async def create_appointment_and_note(self, client, patient, doctor):
        p_token = await self.get_token(client, patient["username"], patient["password"])
        d_token = await self.get_token(client, doctor["username"], doctor["password"])
        if not p_token or not d_token: return

        # 1. Create Appointment (Patient)
        appt_payload = {
            "patientId": str(patient["id"]), "doctorId": str(doctor["id"]),
            "dateTime": (datetime.now() - timedelta(days=2)).isoformat(), # Past appointment
            "status": "COMPLETED", "reason": "Checkup"
        }
        resp = await client.post(f"{BASE_URL}/api/appointments", json=appt_payload, headers={"Authorization": p_token})
        if resp.status_code == 201:
            appt_id = resp.json().get("id")
            # 2. Add Note (Doctor)
            note_payload = {"appointmentId": appt_id, "content": "Patient in good health. Slightly high BP."}
            await client.post(f"{MEDICAL_RECORD_SERVICE_URL}/patient/{patient['id']}/notes", json=note_payload, headers={"Authorization": d_token})
            logger.info(f"Added Consultation Note for {patient['username']} by Dr. {doctor['username']}")

    async def populate(self):
        async with httpx.AsyncClient(timeout=60.0) as client:
            logger.info("--- Seeding MedInsight ---")
            for _ in range(2): 
                doc = await self.register_doctor(client)
                if doc: self.doctors.append(doc)
            for _ in range(3): 
                pat = await self.register_patient(client)
                if pat: self.patients.append(pat)
            
            for pat in self.patients:
                await self.seed_medical_record(client, pat)
                await self.create_appointment_and_note(client, pat, random.choice(self.doctors))
            logger.info("--- Success! ---")

if __name__ == "__main__":
    asyncio.run(MedInsightPopulator().populate())
