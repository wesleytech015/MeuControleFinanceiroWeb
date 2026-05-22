-- =============================================
-- Banco: Meu Controle Financeiro Web (Aiven)
-- =============================================

CREATE DATABASE IF NOT EXISTS meu_controle_financeiro_web;
USE meu_controle_financeiro_web;

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Movimentações
CREATE TABLE IF NOT EXISTS movimentacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo ENUM('receita', 'despesa') NOT NULL,
    descricao VARCHAR(200) NOT NULL,
    valor DECIMAL(15,2) NOT NULL,
    categoria VARCHAR(100),
    forma_pagamento VARCHAR(50),
    data DATE NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela de Categorias
CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    tipo ENUM('receita', 'despesa') NOT NULL,
    UNIQUE KEY uk_categoria (nome, tipo)
);

-- Categorias iniciais
INSERT INTO categorias (nome, tipo) VALUES 
('Salário', 'receita'), ('Freelance', 'receita'),
('Alimentação', 'despesa'), ('Transporte', 'despesa'),
('Moradia', 'despesa'), ('Lazer', 'despesa'),
('Saúde', 'despesa'), ('Educação', 'despesa'),
('Vestuário', 'despesa'), ('Outros', 'despesa')
ON DUPLICATE KEY UPDATE nome = nome;

-- Para verificar
-- SHOW TABLES;
-- SELECT * FROM categorias;