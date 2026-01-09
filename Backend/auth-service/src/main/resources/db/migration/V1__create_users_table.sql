-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keycloak_id VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    address_line VARCHAR(255),
    city VARCHAR(100),
    country VARCHAR(100),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_user_keycloak_id ON users(keycloak_id);

COMMENT ON TABLE users IS 'User accounts synchronized with Keycloak';
COMMENT ON COLUMN users.keycloak_id IS 'Unique identifier from Keycloak';
COMMENT ON COLUMN users.email IS 'User email address (unique)';
