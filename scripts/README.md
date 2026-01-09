# MedInsight Data Population Script

This script seeds the MedInsight platform with realistic mock data for testing and demonstration purposes.

## Requirements
- Python 3.9+
- `httpx`
- `faker`

## Setup
1. Install dependencies:
   ```bash
   pip install -r scripts/requirements.txt
   ```

2. Ensure the MedInsight platform is running (specifically Discovery, Gateway, Auth, and Appointment services).

3. Run the script:
   ```bash
   python scripts/populate_data.py
   ```

## What it does
1. **Registers Doctors**: Creates doctor accounts in Keycloak and Auth-Service with random specialties.
2. **Registers Patients**: Creates patient accounts with profile data.
3. **Logins**: Authenticates users against Keycloak to obtain JWT tokens.
4. **Appointments**: Schedules multiple appointments across different doctors and patients.
5. **Medical Records**: (Planned) Initializes clinical history and consultation notes.

## Configuration
You can adjust the URLs and credentials at the top of `scripts/populate_data.py` if your environment differs from the default Docker settings.
