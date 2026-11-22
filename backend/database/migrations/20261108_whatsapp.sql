-- Aplicar explicitamente no banco de demonstração existente. O deploy não executa DDL.
-- As tabelas existentes usuarios/movimentacoes devem usar InnoDB para transações atômicas.
CREATE TABLE IF NOT EXISTS whatsapp_links (
  usuario_id INT PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NULL,
  pending_phone VARCHAR(20) NULL,
  code_hash CHAR(64) UNIQUE NULL,
  code_expires DATETIME(3) NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS whatsapp_drafts (
  usuario_id INT PRIMARY KEY,
  payload JSON NOT NULL,
  confirmation_code CHAR(12) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS whatsapp_inbox (
  message_id VARCHAR(191) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  reply TEXT NULL,
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME(3) NULL,
  sending_until DATETIME(3) NULL
) ENGINE=InnoDB;
