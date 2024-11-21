const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();

// Função para gerar token JWT
const gerarToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'segredo', { expiresIn: '1h' });
};

// Rota de login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Verifica se o usuário existe
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Erro no banco de dados' });
    }

    if (!row) {
      return res.status(400).json({ message: 'Usuário não encontrado' });
    }

    // Compara as senhas
    bcrypt.compare(password, row.password, (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Erro ao comparar a senha' });
      }

      if (result) {
        // Criação de token JWT
        const token = gerarToken(row.id);
        res.json({ message: 'Login bem-sucedido!', token, userId: row.id });
      } else {
        res.status(400).json({ message: 'Senha incorreta' });
      }
    });
  });
});

// Rota para registro de novo usuário
router.post('/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Nome de usuário e senha são obrigatórios' });
  }

  // Verifica se o nome de usuário já existe
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao verificar o usuário' });
    }

    if (row) {
      return res.status(400).json({ message: 'Nome de usuário já existe' });
    }

    // Criptografa a senha
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        return res.status(500).json({ message: 'Erro ao criar a senha criptografada' });
      }

      // Insere o novo usuário no banco de dados
      db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], function(err) {
        if (err) {
          return res.status(500).json({ message: 'Erro ao salvar o usuário' });
        }
        res.status(201).json({ message: 'Usuário registrado com sucesso!' });
      });
    });
  });
});

module.exports = router;
