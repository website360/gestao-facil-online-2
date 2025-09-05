
<?php
/**
 * Configuração de Conexão com Banco de Dados
 * Sistema de Gestão - MySQL Database Configuration
 */

class Database {
    private $host = 'localhost';
    private $db_name = 'sistema_gestao';
    private $username = 'root'; // Altere conforme sua configuração
    private $password = '';     // Altere conforme sua configuração
    private $charset = 'utf8mb4';
    public $conn;

    /**
     * Conexão com o banco de dados
     */
    public function getConnection() {
        $this->conn = null;

        try {
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=" . $this->charset;
            
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];

            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
            
        } catch(PDOException $exception) {
            echo "Erro de conexão: " . $exception->getMessage();
        }

        return $this->conn;
    }

    /**
     * Testa a conexão com o banco
     */
    public function testConnection() {
        try {
            $conn = $this->getConnection();
            if ($conn) {
                echo "✅ Conexão com banco de dados estabelecida com sucesso!<br>";
                echo "📊 Banco: " . $this->db_name . "<br>";
                echo "🖥️  Host: " . $this->host . "<br>";
                return true;
            }
        } catch (Exception $e) {
            echo "❌ Erro ao conectar com o banco: " . $e->getMessage();
            return false;
        }
    }

    /**
     * Executa consulta de verificação das tabelas
     */
    public function checkTables() {
        try {
            $conn = $this->getConnection();
            $query = "SHOW TABLES";
            $stmt = $conn->prepare($query);
            $stmt->execute();
            
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            echo "<h3>📋 Tabelas encontradas no banco:</h3>";
            echo "<ul>";
            foreach ($tables as $table) {
                echo "<li>✅ " . $table . "</li>";
            }
            echo "</ul>";
            
            return $tables;
        } catch (Exception $e) {
            echo "❌ Erro ao verificar tabelas: " . $e->getMessage();
            return false;
        }
    }

    /**
     * Verifica se há dados nas tabelas principais
     */
    public function checkData() {
        try {
            $conn = $this->getConnection();
            
            $tables_to_check = [
                'usuarios' => 'Usuários',
                'categorias' => 'Categorias', 
                'produtos' => 'Produtos',
                'clientes' => 'Clientes',
                'orcamentos' => 'Orçamentos'
            ];
            
            echo "<h3>📊 Dados nas tabelas:</h3>";
            echo "<ul>";
            
            foreach ($tables_to_check as $table => $label) {
                $query = "SELECT COUNT(*) as total FROM " . $table;
                $stmt = $conn->prepare($query);
                $stmt->execute();
                $result = $stmt->fetch();
                
                echo "<li>" . $label . ": <strong>" . $result['total'] . "</strong> registro(s)</li>";
            }
            echo "</ul>";
            
        } catch (Exception $e) {
            echo "❌ Erro ao verificar dados: " . $e->getMessage();
        }
    }
}

// Exemplo de uso para testar a conexão
if (basename(__FILE__) == basename($_SERVER["SCRIPT_FILENAME"])) {
    echo "<h2>🔧 Teste de Conexão - Sistema de Gestão</h2>";
    
    $database = new Database();
    
    // Testa conexão
    if ($database->testConnection()) {
        // Verifica tabelas
        $database->checkTables();
        
        // Verifica dados
        $database->checkData();
        
        echo "<br><h3>✅ Sistema pronto para uso!</h3>";
        echo "<p>Agora você pode:</p>";
        echo "<ul>";
        echo "<li>Implementar as APIs REST para cada módulo</li>";
        echo "<li>Configurar autenticação de usuários</li>";
        echo "<li>Integrar o frontend React com o backend PHP</li>";
        echo "<li>Testar o fluxo completo de orçamentos → vendas</li>";
        echo "</ul>";
    }
}
?>
