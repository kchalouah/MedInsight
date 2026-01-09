-- Create patient_profiles table
CREATE TABLE IF NOT EXISTS patient_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    date_of_birth DATE,
    gender VARCHAR(20),
    blood_type VARCHAR(5),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    insurance_provider VARCHAR(100),
    insurance_number VARCHAR(50),
    CONSTRAINT fk_patient_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_patient_user_id ON patient_profiles(user_id);

COMMENT ON TABLE patient_profiles IS 'Patient-specific medical and insurance information';
COMMENT ON COLUMN patient_profiles.user_id IS 'Foreign key to users table (one-to-one relationship)';
