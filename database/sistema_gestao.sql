
-- Banco de Dados do Sistema de Gestão
-- Criado para testar todas as funcionalidades

CREATE DATABASE IF NOT EXISTS sistema_gestao;
USE sistema_gestao;

-- Tabela de Usuários
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    role ENUM('Administrador', 'Vendas', 'Separacao', 'Conferencia', 'Nota Fiscal') NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Categorias
CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    descricao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Produtos
CREATE TABLE produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    categoria_id INT NOT NULL,
    codigo_interno VARCHAR(20) UNIQUE NOT NULL,
    codigo_barras VARCHAR(50) UNIQUE NOT NULL,
    preco DECIMAL(10,2) NOT NULL,
    estoque INT NOT NULL DEFAULT 0,
    estoque_minimo INT DEFAULT 5,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

-- Tabela de Clientes
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    telefone VARCHAR(20),
    celular VARCHAR(20),
    cpf_cnpj VARCHAR(20),
    endereco TEXT,
    cidade VARCHAR(50),
    estado VARCHAR(2),
    cep VARCHAR(10),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Orçamentos
CREATE TABLE orcamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    usuario_id INT NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    status ENUM('Pendente', 'Separacao', 'Conferencia', 'Nota Fiscal', 'Finalizado') DEFAULT 'Pendente',
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabela de Itens do Orçamento
CREATE TABLE orcamento_itens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orcamento_id INT NOT NULL,
    produto_id INT NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    preco_total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (orcamento_id) REFERENCES orcamentos(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

-- Tabela de Vendas (conversão dos orçamentos)
CREATE TABLE vendas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orcamento_id INT NOT NULL,
    cliente_id INT NOT NULL,
    usuario_responsavel_id INT NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    status ENUM('Separacao', 'Conferencia', 'Nota Fiscal', 'Finalizado') DEFAULT 'Separacao',
    usuario_separacao_id INT,
    usuario_conferencia_id INT,
    usuario_nota_fiscal_id INT,
    data_separacao TIMESTAMP NULL,
    data_conferencia TIMESTAMP NULL,
    data_nota_fiscal TIMESTAMP NULL,
    data_finalizacao TIMESTAMP NULL,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (orcamento_id) REFERENCES orcamentos(id),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (usuario_responsavel_id) REFERENCES usuarios(id),
    FOREIGN KEY (usuario_separacao_id) REFERENCES usuarios(id),
    FOREIGN KEY (usuario_conferencia_id) REFERENCES usuarios(id),
    FOREIGN KEY (usuario_nota_fiscal_id) REFERENCES usuarios(id)
);

-- Tabela de Itens da Venda
CREATE TABLE venda_itens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venda_id INT NOT NULL,
    produto_id INT NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    preco_total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

-- Tabela de Movimentação de Estoque
CREATE TABLE estoque_movimentacao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT NOT NULL,
    tipo ENUM('Entrada', 'Saida', 'Ajuste') NOT NULL,
    quantidade INT NOT NULL,
    motivo VARCHAR(100),
    usuario_id INT NOT NULL,
    venda_id INT NULL,
    estoque_anterior INT NOT NULL,
    estoque_atual INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_id) REFERENCES produtos(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (venda_id) REFERENCES vendas(id)
);

-- Inserção de dados de teste

-- Inserindo categorias
INSERT INTO categorias (nome, descricao) VALUES
('Eletrônicos', 'Produtos eletrônicos em geral'),
('Roupas', 'Vestuário e acessórios'),
('Casa e Jardim', 'Produtos para casa e jardim'),
('Livros', 'Livros e materiais educativos'),
('Esportes', 'Artigos esportivos e fitness');

-- Inserindo usuários (senha: 123456 - deve ser criptografada em produção)
INSERT INTO usuarios (nome, email, senha, role) VALUES
('João Administrador', 'admin@empresa.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador'),
('Maria Vendas', 'vendas@empresa.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Vendas'),
('Pedro Separação', 'separacao@empresa.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Separacao'),
('Ana Conferência', 'conferencia@empresa.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Conferencia'),
('Carlos Nota Fiscal', 'notafiscal@empresa.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Nota Fiscal');

-- Inserindo produtos
INSERT INTO produtos (nome, categoria_id, codigo_interno, codigo_barras, preco, estoque, estoque_minimo) VALUES
('Smartphone Samsung Galaxy A54', 1, 'SM001', '7891234567890', 899.90, 15, 5),
('Notebook Dell Inspiron 15', 1, 'NB001', '7891234567891', 2499.90, 8, 3),
('Camiseta Polo Masculina', 2, 'CP001', '7891234567892', 79.90, 25, 10),
('Tablet Apple iPad 9ª Geração', 1, 'TB001', '7891234567893', 1599.90, 12, 5),
('Tênis Nike Air Max', 5, 'TN001', '7891234567894', 299.90, 18, 8),
('Livro Aprendendo React', 4, 'LV001', '7891234567895', 89.90, 30, 10),
('Vaso Decorativo Cerâmica', 3, 'VD001', '7891234567896', 45.50, 3, 5),
('Mouse Gamer Logitech', 1, 'MG001', '7891234567897', 159.90, 22, 8);

-- Inserindo clientes
INSERT INTO clientes (nome, email, telefone, celular, cpf_cnpj, endereco, cidade, estado, cep) VALUES
('João Silva Santos', 'joao.silva@email.com', '(11) 3333-4444', '(11) 99999-9999', '123.456.789-00', 'Rua das Flores, 123', 'São Paulo', 'SP', '01234-567'),
('Maria Oliveira Costa', 'maria.oliveira@email.com', '(11) 2222-3333', '(11) 88888-8888', '987.654.321-00', 'Av. Paulista, 456', 'São Paulo', 'SP', '01310-100'),
('Pedro Rodrigues Lima', 'pedro.rodrigues@email.com', '(11) 1111-2222', '(11) 77777-7777', '456.789.123-00', 'Rua Augusta, 789', 'São Paulo', 'SP', '01305-000'),
('Ana Carolina Ferreira', 'ana.ferreira@email.com', '(11) 4444-5555', '(11) 66666-6666', '321.654.987-00', 'Rua Oscar Freire, 321', 'São Paulo', 'SP', '01426-001'),
('Carlos Eduardo Martins', 'carlos.martins@email.com', '(11) 5555-6666', '(11) 55555-5555', '789.123.456-00', 'Av. Faria Lima, 654', 'São Paulo', 'SP', '04538-132');

-- Inserindo um orçamento de exemplo
INSERT INTO orcamentos (cliente_id, usuario_id, valor_total, status, observacoes) VALUES
(1, 2, 1799.80, 'Pendente', 'Cliente interessado em smartphones');

-- Inserindo itens do orçamento
INSERT INTO orcamento_itens (orcamento_id, produto_id, quantidade, preco_unitario, preco_total) VALUES
(1, 1, 2, 899.90, 1799.80);

-- Índices para melhorar performance
CREATE INDEX idx_produtos_categoria ON produtos(categoria_id);
CREATE INDEX idx_produtos_codigo_interno ON produtos(codigo_interno);
CREATE INDEX idx_produtos_codigo_barras ON produtos(codigo_barras);
CREATE INDEX idx_orcamentos_cliente ON orcamentos(cliente_id);
CREATE INDEX idx_orcamentos_usuario ON orcamentos(usuario_id);
CREATE INDEX idx_orcamentos_status ON orcamentos(status);
CREATE INDEX idx_vendas_cliente ON vendas(cliente_id);
CREATE INDEX idx_vendas_status ON vendas(status);
CREATE INDEX idx_estoque_produto ON estoque_movimentacao(produto_id);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_clientes_cpf_cnpj ON clientes(cpf_cnpj);

-- Views úteis para relatórios

-- View para produtos com estoque baixo
CREATE VIEW v_produtos_estoque_baixo AS
SELECT 
    p.id,
    p.nome,
    c.nome as categoria,
    p.codigo_interno,
    p.estoque,
    p.estoque_minimo,
    p.preco
FROM produtos p
JOIN categorias c ON p.categoria_id = c.id
WHERE p.estoque <= p.estoque_minimo AND p.ativo = TRUE;

-- View para vendas em andamento
CREATE VIEW v_vendas_andamento AS
SELECT 
    v.id,
    v.status,
    c.nome as cliente_nome,
    u.nome as responsavel,
    v.valor_total,
    v.created_at,
    v.updated_at
FROM vendas v
JOIN clientes c ON v.cliente_id = c.id
JOIN usuarios u ON v.usuario_responsavel_id = u.id
WHERE v.status != 'Finalizado'
ORDER BY v.created_at DESC;

-- View para orçamentos pendentes
CREATE VIEW v_orcamentos_pendentes AS
SELECT 
    o.id,
    c.nome as cliente_nome,
    u.nome as vendedor,
    o.valor_total,
    o.created_at,
    COUNT(oi.id) as total_itens
FROM orcamentos o
JOIN clientes c ON o.cliente_id = c.id
JOIN usuarios u ON o.usuario_id = u.id
JOIN orcamento_itens oi ON o.id = oi.orcamento_id
WHERE o.status = 'Pendente'
GROUP BY o.id, c.nome, u.nome, o.valor_total, o.created_at
ORDER BY o.created_at DESC;

-- Trigger para atualizar estoque quando uma venda é criada
DELIMITER //
CREATE TRIGGER tr_baixa_estoque_venda
AFTER INSERT ON venda_itens
FOR EACH ROW
BEGIN
    DECLARE estoque_anterior INT;
    
    -- Busca o estoque atual
    SELECT estoque INTO estoque_anterior FROM produtos WHERE id = NEW.produto_id;
    
    -- Atualiza o estoque
    UPDATE produtos 
    SET estoque = estoque - NEW.quantidade 
    WHERE id = NEW.produto_id;
    
    -- Registra a movimentação
    INSERT INTO estoque_movimentacao (
        produto_id, 
        tipo, 
        quantidade, 
        motivo, 
        usuario_id, 
        venda_id,
        estoque_anterior,
        estoque_atual
    ) VALUES (
        NEW.produto_id,
        'Saida',
        NEW.quantidade,
        'Venda realizada',
        1, -- Usuário sistema
        (SELECT venda_id FROM venda_itens WHERE id = NEW.id),
        estoque_anterior,
        estoque_anterior - NEW.quantidade
    );
END//
DELIMITER ;

-- Função para calcular total de vendas por período
DELIMITER //
CREATE FUNCTION f_total_vendas_periodo(data_inicio DATE, data_fim DATE)
RETURNS DECIMAL(10,2)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE total DECIMAL(10,2) DEFAULT 0;
    
    SELECT COALESCE(SUM(valor_total), 0) INTO total
    FROM vendas 
    WHERE DATE(created_at) BETWEEN data_inicio AND data_fim
    AND status = 'Finalizado';
    
    RETURN total;
END//
DELIMITER ;

-- Procedure para relatório de vendas por vendedor
DELIMITER //
CREATE PROCEDURE sp_relatorio_vendas_vendedor(
    IN p_data_inicio DATE,
    IN p_data_fim DATE
)
BEGIN
    SELECT 
        u.nome as vendedor,
        COUNT(v.id) as total_vendas,
        SUM(v.valor_total) as valor_total,
        AVG(v.valor_total) as ticket_medio
    FROM vendas v
    JOIN usuarios u ON v.usuario_responsavel_id = u.id
    WHERE DATE(v.created_at) BETWEEN p_data_inicio AND p_data_fim
    GROUP BY u.id, u.nome
    ORDER BY valor_total DESC;
END//
DELIMITER ;

-- Inserir dados de exemplo para testar o sistema completo
INSERT INTO vendas (orcamento_id, cliente_id, usuario_responsavel_id, valor_total, status, usuario_separacao_id, data_separacao) VALUES
(1, 1, 2, 1799.80, 'Separacao', 3, NOW());

INSERT INTO venda_itens (venda_id, produto_id, quantidade, preco_unitario, preco_total) VALUES
(1, 1, 2, 899.90, 1799.80);

-- Comentários finais
/*
Este banco de dados foi criado para suportar todo o sistema de gestão com as seguintes funcionalidades:

1. Gestão de Usuários com diferentes roles/permissões
2. Gestão de Produtos com controle de estoque
3. Gestão de Clientes
4. Gestão de Categorias
5. Sistema de Orçamentos
6. Sistema de Vendas com workflow (Separação → Conferência → Nota Fiscal → Finalizado)
7. Controle automático de estoque
8. Histórico de movimentações
9. Views para relatórios
10. Triggers para automação
11. Stored Procedures para relatórios complexos

Para usar este banco:
1. Execute este script em seu MySQL
2. Configure a conexão PHP com os dados do banco
3. Implemente a autenticação de usuários
4. Crie as APIs REST para integrar com o frontend React

Senhas dos usuários de teste: 123456 (criptografadas com bcrypt)
*/
