-- Markiss Ringside high-score table.
--
-- Run once on the VPS as the postgres superuser (idempotent, safe to re-run):
--   su postgres -c "psql -v ON_ERROR_STOP=1 -f 2026-09-28-create-scores.sql"
--
-- The game's API connects as the `markiss` role, which can only read the
-- table and add rows to it: no UPDATE, no DELETE, nothing outside this DB.

SELECT 'CREATE ROLE markiss LOGIN'
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'markiss') \gexec

SELECT 'CREATE DATABASE markiss OWNER postgres'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'markiss') \gexec

\connect markiss

REVOKE ALL ON DATABASE markiss FROM PUBLIC;
GRANT CONNECT ON DATABASE markiss TO markiss;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO markiss;

CREATE TABLE IF NOT EXISTS scores (
    id          bigserial   PRIMARY KEY,
    initials    char(3)     NOT NULL CHECK (initials ~ '^[A-Z0-9]{3}$'),
    points      integer     NOT NULL CHECK (points BETWEEN 0 AND 64500),
    grade       text        NOT NULL CHECK (grade IN ('try', 'ok', 'superb', 'perfect')),
    accuracy    smallint    NOT NULL CHECK (accuracy BETWEEN 0 AND 100),
    ip_hash     text        NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scores_board_idx ON scores (points DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS scores_ip_recent_idx ON scores (ip_hash, created_at);

GRANT SELECT, INSERT ON scores TO markiss;
GRANT USAGE ON SEQUENCE scores_id_seq TO markiss;
