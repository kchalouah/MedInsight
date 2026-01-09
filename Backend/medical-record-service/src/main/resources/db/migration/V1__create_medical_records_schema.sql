-- Create medical_records table
CREATE TABLE medical_records (
    id UUID PRIMARY KEY,
    patient_id UUID NOT NULL UNIQUE,
    blood_type VARCHAR(10),
    allergies TEXT,
    chronic_conditions TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    medical_history TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create consultation_notes table
CREATE TABLE consultation_notes (
    id UUID PRIMARY KEY,
    appointment_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    note_content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_record_patient ON medical_records(patient_id);
CREATE INDEX idx_note_appointment ON consultation_notes(appointment_id);
CREATE INDEX idx_note_patient ON consultation_notes(patient_id);

-- Add comments
COMMENT ON TABLE medical_records IS 'Permanent medical history and clinical data for patients';
COMMENT ON TABLE consultation_notes IS 'Specific clinical notes written by doctors during appointments';
