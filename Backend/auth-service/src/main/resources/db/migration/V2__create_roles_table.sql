-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

COMMENT ON TABLE roles IS 'System roles synchronized with Keycloak realm roles';
COMMENT ON COLUMN roles.name IS 'Role name (enum: ADMIN, MEDECIN, PATIENT, GESTIONNAIRE, RESPONSABLE_SECURITE)';
