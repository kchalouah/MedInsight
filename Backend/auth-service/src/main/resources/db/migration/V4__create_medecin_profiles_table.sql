-- Create medecin_profiles table
CREATE TABLE IF NOT EXISTS medecin_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    specialization VARCHAR(100),
    license_number VARCHAR(50) UNIQUE,
    years_of_experience INTEGER,
    consultation_fee DECIMAL(10, 2),
    available BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_medecin_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_medecin_user_id ON medecin_profiles(user_id);
CREATE INDEX idx_medecin_license ON medecin_profiles(license_number);

COMMENT ON TABLE medecin_profiles IS 'Doctor-specific professional credentials and information';
COMMENT ON COLUMN medecin_profiles.user_id IS 'Foreign key to users table (one-to-one relationship)';
COMMENT ON COLUMN medecin_profiles.license_number IS 'Medical license number (unique)';
