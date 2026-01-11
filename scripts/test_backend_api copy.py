import httpx
import asyncio
import logging
import sys
import random
from datetime import datetime, timedelta
from faker import Faker

# --- Configuration ---
GATEWAY_URL = "http://localhost:8080"
KEYCLOAK_URL = "http://localhost:8180/realms/medinsight/protocol/openid-connect/token"
ADMIN_USER = "admin"
ADMIN_PASS = "KeycloakAdmin2024!" # Ensure this matches your Keycloak config

# --- Setup Logging ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("MedInsight-Populator")

# --- Constants ---
SPECIALIZATIONS = [
    "Cardiologie", "Dermatologie", "Pédiatrie", "Médecine Générale", 
    "Neurologie", "Psychiatrie", "Ophtalmologie", "Gynécologie"
]

class MedInsightDataPopulator:
    def __init__(self):
        self.fake = Faker('fr_FR')
        self.client = httpx.AsyncClient(timeout=30.0)
        self.tokens = {"admin": None}
        self.users = {"doctors": [], "patients": []}
        self.appointments = []

    async def get_admin_token(self):
        """Login as super-admin to perform administrative tasks (like creating other admins)"""
        data = {
            "grant_type": "password",
            "client_id": "auth-service",
            "client_secret": "auth-service-secret",
            "username": ADMIN_USER,
            "password": ADMIN_PASS
        }
        try:
            resp = await self.client.post(KEYCLOAK_URL, data=data)
            if resp.status_code == 200:
                self.tokens["admin"] = resp.json()['access_token']
                return True
            else:
                logger.error(f"Failed to get admin token: {resp.status_code} - {resp.text}")
        except Exception as e:
            logger.error(f"Connection error during login: {e}")
        return False

    async def get_user_token(self, email, password):
        """Get token for a specific user to perform actions as them"""
        data = {
            "grant_type": "password",
            "client_id": "auth-service",
            "client_secret": "auth-service-secret",
            "username": email,
            "password": password
        }
        try:
            resp = await self.client.post(KEYCLOAK_URL, data=data)
            if resp.status_code == 200:
                return resp.json()['access_token']
        except Exception: pass
        return None

    async def create_doctors(self, count=5):
        """Create realistic doctor profiles"""
        logger.info(f"--- Creating {count} Doctors ---")
        for _ in range(count):
            spec = random.choice(SPECIALIZATIONS)
            first_name = self.fake.first_name()
            last_name = self.fake.last_name()
            email = f"dr.{last_name.lower()}.{random.randint(100,999)}@medinsight.tn"
            password = "password123"
            
            payload = {
                "email": email,
                "password": password,
                "firstName": first_name,
                "lastName": last_name,
                "phoneNumber": self.fake.phone_number().replace(" ", "")[:15],
                "addressLine": self.fake.street_address(),
                "city": self.fake.city(),
                "country": "Tunisie",
                "specialization": spec,
                "licenseNumber": f"TUN-{random.randint(10000, 99999)}",
                "yearsOfExperience": random.randint(2, 30),
                "consultationFee": float(random.choice([40, 50, 60, 70, 80]))
            }

            resp = await self.client.post(f"{GATEWAY_URL}/api/auth/register/medecin", json=payload)
            if resp.status_code == 201:
                user_id = resp.json().get("id")
                logger.info(f"✅ Created Doctor: Dr. {last_name} ({spec})")
                self.users["doctors"].append({
                    "id": user_id, 
                    "email": email, 
                    "password": password, 
                    "name": f"Dr. {first_name} {last_name}"
                })
            elif resp.status_code == 409:
                logger.warning(f"⚠️ Doctor {email} already exists.")
                # We can try to sign in if they exist to add them to our list?
                # For simplicity, we skip adding to our active list if we don't know the password/ID easily 
                # without an admin user lookup. 
                # BUT, let's create a known doctor for testing if list is empty.
            else:
                logger.error(f"❌ Failed to create doctor: {resp.text}")

    async def create_patients(self, count=10):
        """Create realistic patient profiles"""
        logger.info(f"--- Creating {count} Patients ---")
        for _ in range(count):
            first_name = self.fake.first_name()
            last_name = self.fake.last_name()
            email = f"{first_name.lower()}.{last_name.lower()}.{random.randint(100,999)}@example.com"
            password = "password123"
            
            payload = {
                "email": email,
                "password": password,
                "firstName": first_name,
                "lastName": last_name,
                "phoneNumber": self.fake.phone_number().replace(" ", "")[:15],
                "dateOfBirth": self.fake.date_of_birth(minimum_age=18, maximum_age=90).isoformat(),
                "addressLine": self.fake.street_address(),
                "city": self.fake.city(),
                "country": "Tunisie",
                "gender": random.choice(["MALE", "FEMALE"])
            }

            resp = await self.client.post(f"{GATEWAY_URL}/api/auth/register/patient", json=payload)
            if resp.status_code == 201:
                user_id = resp.json().get("id")
                logger.info(f"✅ Created Patient: {first_name} {last_name}")
                self.users["patients"].append({
                    "id": user_id, 
                    "email": email, 
                    "password": password,
                    "name": f"{first_name} {last_name}"
                })
            elif resp.status_code == 409:
                logger.warning(f"⚠️ Patient {email} already exists.")
            else:
                logger.error(f"❌ Failed to create patient: {resp.text}")

    async def create_admin_users(self):
        """Create platform admins if they don't exist"""
        logger.info("--- Creating Administrative Users ---")
        if not self.tokens["admin"]:
            logger.warning("Skipping admin creation (no admin token).")
            return

        admins = [
            {"email": "admin@medinsight.tn", "role": "GESTIONNAIRE", "firstName": "Admin", "lastName": "Principal"},
            {"email": "security@medinsight.tn", "role": "RESPONSABLE_SECURITE", "firstName": "Security", "lastName": "Officer"}
        ]
        
        headers = {"Authorization": f"Bearer {self.tokens['admin']}"}

        for admin in admins:
            payload = {
                "email": admin["email"],
                "password": "password123",
                "firstName": admin["firstName"],
                "lastName": admin["lastName"],
                "role": admin["role"]
            }
            resp = await self.client.post(f"{GATEWAY_URL}/api/admin/users", json=payload, headers=headers)
            if resp.status_code in [200, 201]:
                logger.info(f"✅ Created {admin['role']}: {admin['email']}")
            elif resp.status_code == 409:
                logger.info(f"ℹ️ {admin['role']} {admin['email']} already exists.")
            else:
                logger.error(f"❌ Failed to create {admin['email']}: {resp.text}")

    async def create_appointments_and_history(self):
        """Generate appointments (past & future) and fill medical history for past ones"""
        logger.info("--- Generating Appointments & Medical History ---")
        
        if not self.users["doctors"] or not self.users["patients"]:
            logger.warning("⚠️ Not enough doctors or patients to generate appointments.")
            return

        for patient in self.users["patients"]:
            # Each patient gets 1-3 appointments
            num_appts = random.randint(1, 3)
            
            # Login as patient to book
            pat_token = await self.get_user_token(patient["email"], patient["password"])
            if not pat_token: continue
            pat_headers = {"Authorization": f"Bearer {pat_token}"}

            for _ in range(num_appts):
                doctor = random.choice(self.users["doctors"])
                
                # Determine date (skewed towards past for history)
                is_past = random.choice([True, True, False]) # 66% chance of past
                if is_past:
                    appt_date = datetime.now() - timedelta(days=random.randint(1, 60))
                else:
                    appt_date = datetime.now() + timedelta(days=random.randint(1, 14))
                
                # Round to hour
                appt_date = appt_date.replace(minute=0, second=0, microsecond=0)
                if appt_date.hour < 9: appt_date = appt_date.replace(hour=9)
                if appt_date.hour > 17: appt_date = appt_date.replace(hour=17)

                payload = {
                    "patientId": patient["id"],
                    "doctorId": doctor["id"],
                    "appointmentDateTime": appt_date.isoformat(),
                    "reason": self.fake.sentence(nb_words=4)
                }

                # Book Appointment
                resp = await self.client.post(f"{GATEWAY_URL}/api/appointments", json=payload, headers=pat_headers)
                
                if resp.status_code == 201:
                    appt_id = resp.json().get("id")
                    
                    if is_past:
                        # Process Past Appointment (Complete, Note, Prescription)
                        await self.process_past_appointment(appt_id, doctor, patient, appt_date)
                        logger.info(f"   - Created PAST appointment for {patient['name']} with {doctor['name']}")
                    else:
                        logger.info(f"   - Created FUTURE appointment for {patient['name']} with {doctor['name']}")
                else:
                     logger.warning(f"   - Failed to book appointment: {resp.status_code}")

    async def process_past_appointment(self, appt_id, doctor, patient, date):
        """Simulate doctor completing a past appointment"""
        doc_token = await self.get_user_token(doctor["email"], doctor["password"])
        if not doc_token: return
        headers = {"Authorization": f"Bearer {doc_token}"}

        # 1. Update Status to COMPLETED
        await self.client.put(
            f"{GATEWAY_URL}/api/appointments/{appt_id}", 
            json={"status": "COMPLETED"}, 
            headers=headers
        )

        # 2. Add Consultation Note
        note_content = f"Consultation du {date.strftime('%d/%m/%Y')}. Patient présente: {self.fake.text(max_nb_chars=60)}. Constantes stables. Recommandations: Repos."
        await self.client.post(
            f"{GATEWAY_URL}/api/records/notes",
            json={
                "appointmentId": appt_id,
                "patientId": patient["id"],
                "noteContent": note_content
            },
            headers=headers
        )

        # 3. Issue Prescription (50% chance)
        if random.choice([True, False]):
            med = random.choice(["Amoxicilline", "Paracétamol", "Ibuprofène", "Oméprazole", "Metformine"])
            await self.client.post(
                f"{GATEWAY_URL}/api/appointments/{appt_id}/prescriptions",
                json={
                    "patientId": patient["id"],
                    "medicationName": med,
                    "dosage": f"{random.randint(100, 1000)}mg",
                    "duration": f"{random.randint(3, 14)} jours",
                    "instructions": random.choice(["Après les repas", "Le matin", "Le soir au coucher"])
                },
                headers=headers
            )

    async def initialize_medical_records(self):
        """Set base data (allergies, blood type) for patients"""
        logger.info("--- Initializing Medical Records ---")
        # Needs a doctor token to update records
        if not self.users["doctors"]: return
        doctor = self.users["doctors"][0]
        doc_token = await self.get_user_token(doctor["email"], doctor["password"])
        headers = {"Authorization": f"Bearer {doc_token}"}

        for patient in self.users["patients"]:
            if random.random() > 0.3: # 70% chance to have data
                payload = {
                    "bloodType": random.choice(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]),
                    "allergies": random.choice(["Aucune", "Pénicilline", "Pollen", "Arachides", "Latex", "Acariens"]),
                    "chronicConditions": random.choice(["Aucune", "Asthme", "Diabète", "Hypertension", "Aucune", "Aucune"]),
                    "emergencyContactName": self.fake.name(),
                    "emergencyContactPhone": self.fake.phone_number()[:10],
                    "medicalHistory": "Antécédents familiaux classiques."
                }
                
                await self.client.put(
                    f"{GATEWAY_URL}/api/records/patient/{patient['id']}",
                    json=payload,
                    headers=headers
                )
        logger.info("✅ Medical records initialized.")

    async def run(self):
        logger.info("🚀 Starting MedInsight V2 Data Populator 🚀")
        
        # 1. Login Admin
        if await self.get_admin_token():
            await self.create_admin_users()
        else:
            logger.warning("⚠️ Could not login as super-admin. Admin creation might be limited.")

        # 2. Create Core Users
        await self.create_doctors(5)
        await self.create_patients(10)

        # 3. Generate Activity
        await self.create_appointments_and_history()
        
        # 4. Initialize Records
        await self.initialize_medical_records()

        await self.client.aclose()
        logger.info("✨ Data Population Complete! ✨")
        logger.info("Login Credentials for testing:")
        if self.users["doctors"]:
            logger.info(f"   Doctor: {self.users['doctors'][0]['email']} / password123")
        if self.users["patients"]:
            logger.info(f"   Patient: {self.users['patients'][0]['email']} / password123")
        logger.info(f"   Admin: admin@medinsight.tn / password123")

if __name__ == "__main__":
    asyncio.run(MedInsightDataPopulator().run())
