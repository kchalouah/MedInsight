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
# Admin credentials for bootstrapping (Initial Keycloak Admin)
ADMIN_USER = "admin"
ADMIN_PASS = "KeycloakAdmin2024!"

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
    "Neurologie", "Psychiatrie", "Ophtalmologie", "Gynécologie", "Orthopédie", "Radiologie",
    "Endocrinologie", "Gastro-entérologie"
]

TUNISIAN_MALE_NAMES = [
    "Ahmed", "Mohamed", "Ibrahim", "Youssef", "Aziz", "Firas", "Karim", "Walid", "Sami", "Anis", 
    "Bilel", "Hamdi", "Omar", "Mehdi", "Amine", "Nizar", "Rafik", "Skander", "Hassen", "Mourad",
    "Seif", "Ayoub", "Malek", "Rayen", "Iyed"
]

TUNISIAN_FEMALE_NAMES = [
    "Ameni", "Fatma", "Mariem", "Sarra", "Emna", "Hela", "Noura", "Rym", "Salma", "Yasmine", 
    "Chaima", "Ines", "Siwar", "Khadija", "Lobna", "Meriem", "Zeineb", "Asma", "Mouna", "Dorra",
    "Farah", "Ghofrane", "Wiem", "Chiraz", "Rania"
]

TUNISIAN_LAST_NAMES = [
    "Trabelsi", "Gharbi", "Ben Ali", "Jaziri", "Bouazizi", "Hammami", "Dridi", "Mejri", "Saidi", 
    "Ayari", "Riahi", "Mebarki", "Ben Ahmed", "Chebbi", "Mansouri", "Abidi", "Sassi", "Louhichi", 
    "Bejaoui", "Triki", "Karray", "Zribi", "Elloumi", "Ben Amor", "Chaabane", "Haddad", "Guesmi"
]

CITIES = ["Tunis", "Sfax", "Sousse", "Bizerte", "Gabès", "Ariana", "Monastir", "Nabeul", "Kairouan", "Gafsa"]

class MedInsightDataPopulator:
    def __init__(self):
        self.fake = Faker('fr_FR')
        self.client = httpx.AsyncClient(timeout=30.0)
        self.tokens = {"admin": None}
        self.users = {"doctors": [], "patients": []}
        self.appointments = []

    def get_tunisian_name(self, gender=None):
        if gender == "MALE":
            first = random.choice(TUNISIAN_MALE_NAMES)
        elif gender == "FEMALE":
            first = random.choice(TUNISIAN_FEMALE_NAMES)
        else:
            first = random.choice(TUNISIAN_MALE_NAMES + TUNISIAN_FEMALE_NAMES)
        last = random.choice(TUNISIAN_LAST_NAMES)
        return first, last

    async def get_admin_token(self):
        """Login as super-admin to perform administrative tasks"""
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
        """Get token for a specific user"""
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
        except Exception: 
            pass
        return None

    async def create_doctors(self, count=8):
        """Create realistic doctor profiles"""
        logger.info(f"--- Creating {count} Doctors ---")
        for _ in range(count):
            spec = random.choice(SPECIALIZATIONS)
            first_name, last_name = self.get_tunisian_name() 
            email = f"dr.{first_name.lower()}.{last_name.lower()}.{random.randint(100,999)}@medinsight.tn"
            password = "password123"
            
            payload = {
                "email": email,
                "password": password,
                "firstName": first_name,
                "lastName": last_name,
                "phoneNumber": "+216" + str(random.randint(20, 99)) + str(random.randint(100000, 999999)),
                "addressLine": self.fake.street_address(),
                "city": random.choice(CITIES),
                "country": "Tunisie",
                "specialization": spec,
                "licenseNumber": f"TUN-{random.randint(10000, 99999)}",
                "yearsOfExperience": random.randint(2, 35),
                "consultationFee": float(random.choice([40, 50, 60, 70, 80, 90, 100, 120]))
            }

            try:
                resp = await self.client.post(f"{GATEWAY_URL}/api/auth/register/medecin", json=payload)
                if resp.status_code in [201, 200]:
                    data = resp.json()
                    user_id = data.get("id") if data else None
                    logger.info(f"✅ Created Doctor: Dr. {first_name} {last_name} ({spec})")
                    self.users["doctors"].append({
                        "id": user_id, 
                        "email": email, 
                        "password": password, 
                        "name": f"Dr. {first_name} {last_name}"
                    })
                elif resp.status_code == 409:
                    logger.warning(f"⚠️ Doctor {email} already exists.")
                    # Try to get token anyway to add to list if needed
                    self.users["doctors"].append({"email": email, "password": password, "name": f"Dr. {first_name} {last_name}"}) 
                else:
                    logger.error(f"❌ Failed to create doctor: {resp.text}")
            except Exception as e:
                logger.error(f"Error creating doctor: {e}")

    async def create_patients(self, count=15):
        """Create realistic patient profiles"""
        logger.info(f"--- Creating {count} Patients ---")
        for _ in range(count):
            gender_code = random.choice(["MALE", "FEMALE"])
            first_name, last_name = self.get_tunisian_name(gender_code)
            email = f"{first_name.lower()}.{last_name.lower()}.{random.randint(100,999)}@example.com"
            password = "password123"
            
            payload = {
                "email": email,
                "password": password,
                "firstName": first_name,
                "lastName": last_name,
                "phoneNumber": "+216" + str(random.randint(20, 99)) + str(random.randint(100000, 999999)),
                "dateOfBirth": self.fake.date_of_birth(minimum_age=18, maximum_age=80).isoformat(),
                "addressLine": self.fake.street_address(),
                "city": random.choice(CITIES),
                "country": "Tunisie",
                "gender": gender_code
            }

            try:
                resp = await self.client.post(f"{GATEWAY_URL}/api/auth/register/patient", json=payload)
                if resp.status_code in [201, 200]:
                    data = resp.json()
                    user_id = data.get("id") if data else None
                    logger.info(f"✅ Created Patient: {first_name} {last_name}")
                    self.users["patients"].append({
                        "id": user_id, 
                        "email": email, 
                        "password": password, 
                        "name": f"{first_name} {last_name}"
                    })
                elif resp.status_code == 409:
                    logger.warning(f"⚠️ Patient {email} already exists.")
                    self.users["patients"].append({"email": email, "password": password, "name": f"{first_name} {last_name}"})
                else:
                    logger.error(f"❌ Failed to create patient: {resp.text}")
            except Exception as e:
                logger.error(f"Error creating patient: {e}")

    async def create_admin_users(self):
        """Create platform admins (Security & Gestionnaire)"""
        logger.info("--- Creating Administrative Users ---")
        if not self.tokens["admin"]:
            logger.warning("Skipping admin creation (no admin token).")
            return

        admins = [
            {"email": "admin@medinsight.tn", "role": "ADMIN", "firstName": "Super", "lastName": "Admin"},
            {"email": "gestion@medinsight.tn", "role": "GESTIONNAIRE", "firstName": "Sami", "lastName": "Gestion"},
            {"email": "security@medinsight.tn", "role": "RESPONSABLE_SECURITE", "firstName": "Securité", "lastName": "Officer"}
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
            # Admin endpoint is typically /api/admin/users - requires ADMIN role
            resp = await self.client.post(f"{GATEWAY_URL}/api/admin/users", json=payload, headers=headers)
            if resp.status_code in [200, 201]:
                logger.info(f"✅ Created {admin['role']}: {admin['email']}")
            elif resp.status_code == 409:
                logger.info(f"ℹ️ {admin['role']} {admin['email']} already exists.")
            elif resp.status_code == 403: # Admin token might not work if not assigned properly in bootstrap
                logger.warning(f"⚠️ Access denied creating {admin['email']}. Check Admin permissions.")
            else:
                logger.error(f"❌ Failed to create {admin['email']}: {resp.text}")

    async def create_appointments_and_history(self):
        """Generate appointments (past & future) and fill medical history for past ones"""
        logger.info("--- Generating Appointments & Medical History ---")
        
        # Need to re-fetch IDs if they were null during creation (e.g. if we just have email/pass)
        # For simplicity, we assume creation worked or we can login to get self-ID.
        
        valid_patients = []
        for p in self.users["patients"]:
            if "id" not in p or not p["id"]:
                # Try login to get ID
                token = await self.get_user_token(p["email"], p["password"])
                if token:
                    # In a real app we'd decode JWT to get ID or call /me endpoint
                    # Here we skip if we don't have the ID from creation response
                    continue
            valid_patients.append(p)
            
        valid_doctors = [d for d in self.users["doctors"] if "id" in d and d["id"]]
        
        if not valid_doctors or not valid_patients:
            logger.warning("⚠️ Not enough valid doctors or patients (with IDs) to generate appointments.")
            return

        for patient in valid_patients:
            # Each patient gets 2-5 appointments
            num_appts = random.randint(2, 5)
            
            # Login as patient to book
            pat_token = await self.get_user_token(patient["email"], patient["password"])
            if not pat_token: continue
            pat_headers = {"Authorization": f"Bearer {pat_token}"}

            for _ in range(num_appts):
                doctor = random.choice(valid_doctors)
                
                # Determine date (skewed towards past for history)
                is_past = random.choice([True, True, True, False]) # 75% chance of past
                if is_past:
                    appt_date = datetime.now() - timedelta(days=random.randint(1, 120))
                else:
                    appt_date = datetime.now() + timedelta(days=random.randint(1, 30))
                
                # Round to hour
                appt_date = appt_date.replace(minute=0, second=0, microsecond=0)
                if appt_date.hour < 9: appt_date = appt_date.replace(hour=9)
                if appt_date.hour > 17: appt_date = appt_date.replace(hour=17)

                payload = {
                    "patientId": patient["id"],
                    "doctorId": doctor["id"],
                    "appointmentDateTime": appt_date.isoformat(),
                    "reason": self.fake.sentence(nb_words=6)
                }

                # Book Appointment
                resp = await self.client.post(f"{GATEWAY_URL}/api/appointments", json=payload, headers=pat_headers)
                
                if resp.status_code in [201, 200]:
                    data = resp.json()
                    appt_id = data.get("id")
                    
                    if is_past and appt_id:
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
        symptoms = self.fake.sentence(nb_words=10)
        diagnosis = self.fake.sentence(nb_words=5)
        note_content = f"Consultation du {date.strftime('%d/%m/%Y')}.\nMotif: {symptoms}\nExamen clinique: Constantes stables, pas de fièvre.\nDiagnostic: {diagnosis}\nRecommandations: Repos et hydratation."
        
        await self.client.post(
            f"{GATEWAY_URL}/api/records/notes",
            json={
                "appointmentId": appt_id,
                "patientId": patient["id"],
                "noteContent": note_content
            },
            headers=headers
        )

        # 3. Issue Prescription (60% chance)
        if random.random() < 0.6:
            meds = [
                ("Amoxicilline", "1g", "6 jours", "Matin et soir"),
                ("Paracétamol", "1g", "5 jours", "En cas de douleur, max 3x/jour"),
                ("Ibuprofène", "400mg", "3 jours", "Au milieu du repas"),
                ("Oméprazole", "20mg", "1 mois", "Le matin à jeun"),
                ("Metformine", "1000mg", "3 mois", "Au milieu du repas")
            ]
            med = random.choice(meds)
            
            await self.client.post(
                f"{GATEWAY_URL}/api/appointments/{appt_id}/prescriptions",
                json={
                    "patientId": patient["id"],
                    "medicationName": med[0],
                    "dosage": med[1],
                    "duration": med[2],
                    "instructions": med[3]
                },
                headers=headers
            )

    async def initialize_medical_records(self):
        """Set base data (allergies, blood type) for patients"""
        logger.info("--- Initializing Medical Records ---")
        
        valid_doctors = [d for d in self.users["doctors"] if "id" in d and d["id"]]
        if not valid_doctors: return
        
        doctor = valid_doctors[0]
        doc_token = await self.get_user_token(doctor["email"], doctor["password"])
        headers = {"Authorization": f"Bearer {doc_token}"}

        for patient in self.users["patients"]:
            if "id" not in patient or not patient["id"]: continue
            
            if random.random() > 0.2: # 80% chance to have data
                payload = {
                    "bloodType": random.choice(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]),
                    "allergies": random.choice(["Aucune", "Pénicilline", "Pollen", "Arachides", "Latex", "Acariens", "Sulfamides"]),
                    "chronicConditions": self.fake.sentence(nb_words=3),
                    "emergencyContactName": self.fake.name(),
                    "emergencyContactPhone": "+216" + str(random.randint(20, 99)) + str(random.randint(100000, 999999)),
                    "medicalHistory": "Antécédents: " + self.fake.sentence(nb_words=10)
                }
                
                await self.client.put(
                    f"{GATEWAY_URL}/api/records/patient/{patient['id']}",
                    json=payload,
                    headers=headers
                )
        logger.info("✅ Medical records initialized.")

    async def run(self):
        logger.info("🚀 Starting MedInsight V2 Data Populator 🚀")
        
        if await self.get_admin_token():
            await self.create_admin_users()
        else:
            logger.warning("⚠️ Could not login as super-admin (admin/KeycloakAdmin2024!). Is Keycloak running?")

        # Create Users
        await self.create_doctors(8)
        await self.create_patients(15)

        # Generate Activity
        await self.create_appointments_and_history()
        
        # Initialize Records
        await self.initialize_medical_records()

        await self.client.aclose()
        logger.info("✨ Data Population Complete! ✨")
        logger.info("Login Credentials for testing:")
        logger.info(f"   Admin (Dashboard): admin@medinsight.tn / password123")
        logger.info(f"   Gestionnaire: gestion@medinsight.tn / password123")
        logger.info(f"   Security: security@medinsight.tn / password123")
        if self.users["doctors"]:
            logger.info(f"   Doctor: {self.users['doctors'][0]['email']} / password123")
        if self.users["patients"]:
            logger.info(f"   Patient: {self.users['patients'][0]['email']} / password123")

if __name__ == "__main__":
    asyncio.run(MedInsightDataPopulator().run())
