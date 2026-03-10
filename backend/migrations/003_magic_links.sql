-- Migration 003: Magic Link auth (reemplaza OTP / Twilio)
-- Agrega email a users, crea magic_tokens

-- Email como nuevo identificador principal del usuario
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Constraint único por email (solo si la columna se acaba de crear)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'users' AND indexname = 'idx_users_email'
  ) THEN
    CREATE UNIQUE INDEX idx_users_email ON users (email) WHERE email IS NOT NULL;
  END IF;
END$$;

-- Tabla de tokens de magic link (reemplaza otp_attempts)
CREATE TABLE IF NOT EXISTS magic_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL,
  token_hash  TEXT NOT NULL UNIQUE,   -- SHA-256 del token crudo (64 hex chars)
  expires_at  TIMESTAMPTZ NOT NULL,   -- NOW() + 15 min
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_magic_email_created
  ON magic_tokens (email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_magic_hash_active
  ON magic_tokens (token_hash)
  WHERE used = FALSE;

-- Limpiar tokens viejos de más de 24h (se ejecuta en cada arrange via cron futuro)
-- Por ahora el handler DELETE antes de INSERT.
