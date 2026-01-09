-- Insert initial roles
INSERT INTO roles (name, description) VALUES
    ('ADMIN', 'System administrator with full access'),
    ('MEDECIN', 'Medical doctor providing healthcare services'),
    ('PATIENT', 'Patient receiving healthcare services'),
    ('GESTIONNAIRE', 'Manager handling administrative tasks'),
    ('RESPONSABLE_SECURITE', 'Security officer managing system security')
ON CONFLICT (name) DO NOTHING;

COMMENT ON TABLE roles IS 'System roles must match Keycloak realm roles';
