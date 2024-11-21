// db.js

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

// Banco de dados SQLite
const db = new sqlite3.Database('./lighting.db', (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite.');
  }
});

// Criação de tabelas
db.serialize(() => {
  // Criação da tabela de usuários
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )
  `);

  // Criação da tabela de iluminação
  db.run(`
    CREATE TABLE IF NOT EXISTS lighting (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      intensity INTEGER,
      status BOOLEAN,
      consumoEnergia REAL,
      economiaEnergia REAL DEFAULT 0  -- Coluna para armazenar economia de energia
    )
  `);

  // Função para calcular o consumo de energia com base na intensidade
  function calcularConsumoEnergia(intensity) {
    const potenciaLampada = 0.05; // Supondo que a lâmpada consome 0.05 KWh por unidade de intensidade (simplificação)
    return (intensity / 100) * potenciaLampada;
  }

  // Inserção inicial de um usuário com senha criptografada
  bcrypt.hash('12345', 10, (err, hashedPassword) => {
    if (err) {
      console.error('Erro ao criar senha criptografada:', err);
      return;
    }
    db.run('INSERT OR IGNORE INTO users (username, password) VALUES ("admin", ?)', [hashedPassword]);
  });

  // Inserção inicial de configuração de iluminação com cálculo de consumo
  const initialIntensity = 50;
  const initialStatus = false;
  const initialConsumoEnergia = calcularConsumoEnergia(initialIntensity); // Calculando o consumo de energia com base na intensidade inicial

  // Inserção de uma nova linha de iluminação
  db.run(
    'INSERT INTO lighting (intensity, status, consumoEnergia) VALUES (?, ?, ?)',
    [initialIntensity, initialStatus, initialConsumoEnergia],
    function (err) {
      if (err) {
        console.error('Erro ao inserir nova linha de iluminação:', err.message);
        return;
      }
      console.log('Nova linha inserida com ID:', this.lastID); // Exibe o ID da nova linha
    }
  );
});

module.exports = db;
