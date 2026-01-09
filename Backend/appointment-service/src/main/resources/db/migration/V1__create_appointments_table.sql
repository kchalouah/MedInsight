-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    appointment_date_time TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    reason VARCHAR(500),
    notes VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_appointment_patient ON appointments(patient_id);
CREATE INDEX idx_appointment_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointment_datetime ON appointments(appointment_date_time);
CREATE INDEX idx_appointment_status ON appointments(status);

-- Add comments
COMMENT ON TABLE appointments IS 'Medical appointments between patients and doctors';
COMMENT ON COLUMN appointments.patient_id IS 'Reference to patient user ID';
COMMENT ON COLUMN appointments.doctor_id IS 'Reference to doctor user ID';
COMMENT ON COLUMN appointments.status IS 'Appointment status: SCHEDULED, COMPLETED, CANCELLED, NO_SHOW';
