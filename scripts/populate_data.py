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
CLIENT_ID = "auth-service"

fake = Faker('fr_FR')
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MedInsightPopulator:
    def __init__(self):
        self.doctors = []
        self.patients = []

    async def get_token(self, client, username, password):
        data = {
            "grant_type": "password", 
            "client_id": CLIENT_ID, 
            "client_secret": "auth-service-secret",
            "username": username, 
            "password": password
        }
        try:
            resp = await client.post(KEYCLOAK_TOKEN_URL, data=data)
            if resp.status_code == 200: return f"Bearer {resp.json()['access_token']}"
            else: logger.warning(f"Token failed for {username}: {resp.status_code} - {resp.text}")
        except Exception: pass
        return None

    async def register_doctor(self, client):
        username = fake.user_name()
        password = "Password123!"
        payload = {
            "email": f"{username}@medinsight.com", 
            "password": password,
            "firstName": fake.first_name_male(), 
            "lastName": fake.last_name(),
            "specialization": random.choice(["Cardiology", "Dermatology", "Pediatrics", "Neurology"]),
            "licenseNumber": fake.bothify(text='??-#####-##'),
            "yearsOfExperience": random.randint(1, 40),
            "consultationFee": 50.0
        }
        try:
            resp = await client.post(f"{AUTH_SERVICE_URL}/register/medecin", json=payload)
            if resp.status_code == 201:
                logger.info(f"Registered Doctor: {username}")
                return {"username": f"{username}@medinsight.com", "password": password, "id": resp.json().get("id")}
            else:
                logger.warning(f"Failed to register doctor {username}: {resp.status_code} - {resp.text}")
        except Exception as e:
            logger.error(f"Error registering doctor {username}: {e}")
        return None

    async def register_patient(self, client):
        username = fake.user_name()
        password = "Password123!"
        payload = {
            "email": f"{username}@patient.com", 
            "password": password,
            "firstName": fake.first_name(), 
            "lastName": fake.last_name(),
            "dateOfBirth": fake.date_of_birth(minimum_age=18, maximum_age=90).isoformat(),
            "phoneNumber": "06" + fake.msisdn()[3:11] # French-like number
        }
        try:
            resp = await client.post(f"{AUTH_SERVICE_URL}/register/patient", json=payload)
            if resp.status_code == 201:
                logger.info(f"Registered Patient: {username}")
                return {"username": f"{username}@patient.com", "password": password, "id": resp.json().get("id")}
            else:
                logger.warning(f"Failed to register patient {username}: {resp.status_code} - {resp.text}")
        except Exception as e:
            logger.error(f"Error registering patient {username}: {e}")
        return None

    async def seed_medical_record(self, client, patient, doctor):
        # Clinical data update requires a DOCTOR/ADMIN role
        token = await self.get_token(client, doctor["username"], doctor["password"])
        if not token: 
            logger.error(f"Could not get token for doctor {doctor['username']}")
            return
        headers = {"Authorization": token}
        payload = {
            "bloodType": random.choice(["A+", "O+", "B-", "AB+"]),
            "allergies": ", ".join(random.sample(["Pollen", "Peanuts", "Pénicilline"], k=random.randint(0, 2))),
            "chronicConditions": ", ".join(random.sample(["Asthme", "Diabète", "Hypertension"], k=random.randint(0, 1))),
            "emergencyContactName": fake.name(),
            "emergencyContactPhone": "06" + fake.msisdn()[3:11]
        }
        try:
            resp = await client.put(f"{MEDICAL_RECORD_SERVICE_URL}/patient/{patient['id']}", json=payload, headers=headers)
            if resp.status_code == 200:
                logger.info(f"Initialized Medical Record for patient {patient['id']}")
            else:
                logger.warning(f"Failed to seed medical record for patient {patient['id']}: {resp.status_code} - {resp.text}")
        except Exception as e:
            logger.error(f"Error seeding medical record: {e}")

    async def create_appointment_and_note(self, client, patient, doctor):
        p_token = await self.get_token(client, patient["username"], patient["password"])
        d_token = await self.get_token(client, doctor["username"], doctor["password"])
        if not p_token or not d_token: return

        # Appointment creation (Patient/Admin)
        appt_payload = {
            "patientId": str(patient["id"]), 
            "doctorId": str(doctor["id"]),
            "appointmentDateTime": (datetime.now() + timedelta(days=random.randint(1, 30))).isoformat(), # MUST BE FUTURE
            "reason": "Checkup Annuel",
            "notes": "Patient stable."
        }
        try:
            resp = await client.post(APPOINTMENT_SERVICE_URL, json=appt_payload, headers={"Authorization": p_token})
            if resp.status_code == 201:
                appt_id = resp.json().get("id")
                # Note creation (Doctor)
                note_payload = {
                    "appointmentId": appt_id, 
                    "patientId": str(patient["id"]),
                    "noteContent": "Observation clinique: Tension normale, poids stable."
                }
                await client.post(f"{MEDICAL_RECORD_SERVICE_URL}/notes", json=note_payload, headers={"Authorization": d_token})
                logger.info(f"Appointment created and note added for {patient['username']}")
            else:
                 logger.warning(f"Failed to create appointment for {patient['username']}: {resp.status_code} - {resp.text}")
        except Exception as e:
            logger.error(f"Error in appointment flow: {e}")

    async def populate(self):
        async with httpx.AsyncClient(timeout=60.0) as client:
            logger.info("--- Seeding MedInsight ---")
            
            # 1. Register Doctors
            for _ in range(3): 
                doc = await self.register_doctor(client)
                if doc: self.doctors.append(doc)
            
            if not self.doctors:
                 logger.error("No doctors were registered. Aborting.")
                 return

            # 2. Register Patients and Seed Data
            for _ in range(5): 
                pat = await self.register_patient(client)
                if pat:
                    doc = random.choice(self.doctors)
                    await self.seed_medical_record(client, pat, doc)
                    await self.create_appointment_and_note(client, pat, doc)
            
            logger.info("--- Success! ---")

if __name__ == "__main__":
    asyncio.run(MedInsightPopulator().populate())
