-- Usuario de prueba: admin / admin123
-- (password hasheado con bcrypt, se genera desde el Worker en el primer deploy)
-- Este seed inserta un usuario temporal que deberás reemplazar luego

INSERT OR IGNORE INTO users (id, username, password_hash, name, role, status)
VALUES (
  'usr_admin_001',
  'admin',
  '$2a$10$PLACEHOLDER_HASH',
  'Administrador',
  'Admin',
  'Active'
);
