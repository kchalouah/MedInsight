-- Create prescriptions table
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY,
    appointment_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(255) NOT NULL,
    duration VARCHAR(255) NOT NULL,
    instructions TEXT,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX idx_prescription_appointment ON prescriptions(appointment_id);
CREATE INDEX idx_prescription_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescription_doctor ON prescriptions(doctor_id);

-- Add comments
COMMENT ON TABLE prescriptions IS 'Table storing medical prescriptions issued during appointments';
COMMENT ON COLUMN prescriptions.medication_name IS 'Name of the prescribed medication';
COMMENT ON COLUMN prescriptions.dosage IS 'Medication dosage instructions';
COMMENT ON COLUMN prescriptions.duration IS 'Duration for which the medication is prescribed';
