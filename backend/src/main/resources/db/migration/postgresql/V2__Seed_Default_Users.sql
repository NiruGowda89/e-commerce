-- V2__Seed_Default_Users.sql
-- Seeds default USER, ADMIN, and SUPER_ADMIN accounts (PostgreSQL)

INSERT INTO users (name, email, phone, password, role, active, created_at, updated_at)
SELECT 'Default User', 'user@karunada.com', '8888888888',
       '$2a$10$AzCDr2w6mp5ZlN75heooQ.yxKp07gVL6FcrQ7Zxi5inqZUHNJEGy6',
       'USER', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'user@karunada.com');

INSERT INTO users (name, email, phone, password, role, active, created_at, updated_at)
SELECT 'Admin', 'admin@karunada.com', '9999999999',
       '$2a$10$48NUVkmfMxv5G7MT2zHaRuQsCQJDPBLL5VCJAtUAmd.ltHMUlqkDS',
       'ADMIN', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@karunada.com');

INSERT INTO users (name, email, phone, password, role, active, created_at, updated_at)
SELECT 'Super Admin', 'superadmin@karunada.com', '7777777777',
       '$2a$10$FwPhNyieDL5uwg1xAsNTl.Xk1dEaA/uf8EI5kOY9ae.NCz5fyWqzC',
       'SUPER_ADMIN', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'superadmin@karunada.com');
