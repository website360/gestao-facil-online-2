
<?php
/**
 * API REST para Gestão de Produtos
 * Sistema de Gestão
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';

class ProdutoAPI {
    private $conn;
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    /**
     * Lista todos os produtos
     */
    public function listar() {
        try {
            $query = "SELECT 
                        p.id,
                        p.nome,
                        p.codigo_interno,
                        p.codigo_barras,
                        p.preco,
                        p.estoque,
                        p.estoque_minimo,
                        c.nome as categoria,
                        p.ativo,
                        p.created_at,
                        p.updated_at
                      FROM produtos p 
                      JOIN categorias c ON p.categoria_id = c.id 
                      WHERE p.ativo = 1
                      ORDER BY p.nome";
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            
            $produtos = $stmt->fetchAll();
            
            return [
                'success' => true,
                'data' => $produtos,
                'total' => count($produtos)
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Erro ao listar produtos: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Busca produto por ID
     */
    public function buscarPorId($id) {
        try {
            $query = "SELECT 
                        p.id,
                        p.nome,
                        p.categoria_id,
                        p.codigo_interno,
                        p.codigo_barras,
                        p.preco,
                        p.estoque,
                        p.estoque_minimo,
                        c.nome as categoria,
                        p.ativo
                      FROM produtos p 
                      JOIN categorias c ON p.categoria_id = c.id 
                      WHERE p.id = ? AND p.ativo = 1";
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute([$id]);
            
            $produto = $stmt->fetch();
            
            if ($produto) {
                return [
                    'success' => true,
                    'data' => $produto
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Produto não encontrado'
                ];
            }
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Erro ao buscar produto: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Cria novo produto
     */
    public function criar($dados) {
        try {
            // Validações
            if (empty($dados['nome']) || empty($dados['categoria_id']) || 
                empty($dados['codigo_interno']) || empty($dados['preco'])) {
                return [
                    'success' => false,
                    'message' => 'Campos obrigatórios: nome, categoria_id, codigo_interno, preco'
                ];
            }
            
            // Verifica se código interno já existe
            $query_check = "SELECT id FROM produtos WHERE codigo_interno = ? AND ativo = 1";
            $stmt_check = $this->conn->prepare($query_check);
            $stmt_check->execute([$dados['codigo_interno']]);
            
            if ($stmt_check->fetch()) {
                return [
                    'success' => false,
                    'message' => 'Código interno já existe'
                ];
            }
            
            $query = "INSERT INTO produtos 
                      (nome, categoria_id, codigo_interno, codigo_barras, preco, estoque, estoque_minimo) 
                      VALUES (?, ?, ?, ?, ?, ?, ?)";
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute([
                $dados['nome'],
                $dados['categoria_id'],
                $dados['codigo_interno'],
                $dados['codigo_barras'] ?? '',
                $dados['preco'],
                $dados['estoque'] ?? 0,
                $dados['estoque_minimo'] ?? 5
            ]);
            
            $produto_id = $this->conn->lastInsertId();
            
            return [
                'success' => true,
                'message' => 'Produto criado com sucesso',
                'data' => ['id' => $produto_id]
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Erro ao criar produto: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Atualiza produto
     */
    public function atualizar($id, $dados) {
        try {
            $query = "UPDATE produtos SET 
                      nome = ?, 
                      categoria_id = ?, 
                      codigo_interno = ?, 
                      codigo_barras = ?, 
                      preco = ?, 
                      estoque = ?, 
                      estoque_minimo = ?,
                      updated_at = CURRENT_TIMESTAMP
                      WHERE id = ? AND ativo = 1";
            
            $stmt = $this->conn->prepare($query);
            $result = $stmt->execute([
                $dados['nome'],
                $dados['categoria_id'],
                $dados['codigo_interno'],
                $dados['codigo_barras'],
                $dados['preco'],
                $dados['estoque'],
                $dados['estoque_minimo'],
                $id
            ]);
            
            if ($result && $stmt->rowCount() > 0) {
                return [
                    'success' => true,
                    'message' => 'Produto atualizado com sucesso'
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Produto não encontrado ou nenhuma alteração feita'
                ];
            }
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Erro ao atualizar produto: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Remove produto (soft delete)
     */
    public function remover($id) {
        try {
            $query = "UPDATE produtos SET ativo = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
            $stmt = $this->conn->prepare($query);
            $result = $stmt->execute([$id]);
            
            if ($result && $stmt->rowCount() > 0) {
                return [
                    'success' => true,
                    'message' => 'Produto removido com sucesso'
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Produto não encontrado'
                ];
            }
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Erro ao remover produto: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Atualiza estoque do produto
     */
    public function atualizarEstoque($id, $quantidade, $tipo = 'ajuste', $motivo = '') {
        try {
            $this->conn->beginTransaction();
            
            // Busca estoque atual
            $query_estoque = "SELECT estoque FROM produtos WHERE id = ? AND ativo = 1";
            $stmt_estoque = $this->conn->prepare($query_estoque);
            $stmt_estoque->execute([$id]);
            $produto = $stmt_estoque->fetch();
            
            if (!$produto) {
                throw new Exception('Produto não encontrado');
            }
            
            $estoque_anterior = $produto['estoque'];
            $novo_estoque = 0;
            
            switch ($tipo) {
                case 'entrada':
                    $novo_estoque = $estoque_anterior + $quantidade;
                    break;
                case 'saida':
                    $novo_estoque = $estoque_anterior - $quantidade;
                    break;
                case 'ajuste':
                    $novo_estoque = $quantidade;
                    break;
            }
            
            if ($novo_estoque < 0) {
                throw new Exception('Estoque não pode ser negativo');
            }
            
            // Atualiza estoque
            $query_update = "UPDATE produtos SET estoque = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
            $stmt_update = $this->conn->prepare($query_update);
            $stmt_update->execute([$novo_estoque, $id]);
            
            // Registra movimentação
            $query_mov = "INSERT INTO estoque_movimentacao 
                          (produto_id, tipo, quantidade, motivo, usuario_id, estoque_anterior, estoque_atual) 
                          VALUES (?, ?, ?, ?, ?, ?, ?)";
            $stmt_mov = $this->conn->prepare($query_mov);
            $stmt_mov->execute([
                $id,
                ucfirst($tipo),
                abs($quantidade),
                $motivo,
                1, // ID do usuário - implementar autenticação
                $estoque_anterior,
                $novo_estoque
            ]);
            
            $this->conn->commit();
            
            return [
                'success' => true,
                'message' => 'Estoque atualizado com sucesso',
                'data' => [
                    'estoque_anterior' => $estoque_anterior,
                    'estoque_atual' => $novo_estoque
                ]
            ];
            
        } catch (Exception $e) {
            $this->conn->rollBack();
            return [
                'success' => false,
                'message' => 'Erro ao atualizar estoque: ' . $e->getMessage()
            ];
        }
    }
}

// Processa a requisição
$method = $_SERVER['REQUEST_METHOD'];
$api = new ProdutoAPI();

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $response = $api->buscarPorId($_GET['id']);
        } else {
            $response = $api->listar();
        }
        break;
        
    case 'POST':
        $dados = json_decode(file_get_contents('php://input'), true);
        if (isset($dados['acao']) && $dados['acao'] == 'atualizar_estoque') {
            $response = $api->atualizarEstoque(
                $dados['id'], 
                $dados['quantidade'], 
                $dados['tipo'] ?? 'ajuste', 
                $dados['motivo'] ?? ''
            );
        } else {
            $response = $api->criar($dados);
        }
        break;
        
    case 'PUT':
        if (isset($_GET['id'])) {
            $dados = json_decode(file_get_contents('php://input'), true);
            $response = $api->atualizar($_GET['id'], $dados);
        } else {
            $response = ['success' => false, 'message' => 'ID do produto é obrigatório'];
        }
        break;
        
    case 'DELETE':
        if (isset($_GET['id'])) {
            $response = $api->remover($_GET['id']);
        } else {
            $response = ['success' => false, 'message' => 'ID do produto é obrigatório'];
        }
        break;
        
    default:
        $response = ['success' => false, 'message' => 'Método não permitido'];
        break;
}

echo json_encode($response, JSON_UNESCAPED_UNICODE);
?>
