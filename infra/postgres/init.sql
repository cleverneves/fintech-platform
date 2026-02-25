-- =============================================================================
-- Fintech Platform — Criação dos bancos por serviço
-- Executado automaticamente pelo PostgreSQL no primeiro boot
-- =============================================================================

CREATE DATABASE fintech_auth;
CREATE DATABASE fintech_accounts;
CREATE DATABASE fintech_wallets;
CREATE DATABASE fintech_exchange;

GRANT ALL PRIVILEGES ON DATABASE fintech_auth     TO fintech;
GRANT ALL PRIVILEGES ON DATABASE fintech_accounts TO fintech;
GRANT ALL PRIVILEGES ON DATABASE fintech_wallets  TO fintech;
GRANT ALL PRIVILEGES ON DATABASE fintech_exchange TO fintech;