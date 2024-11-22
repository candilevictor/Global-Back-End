// lighting.js

const express = require('express');
const router = express.Router();
const db = require('../db'); // Importa o banco de dados

// Função para calcular o consumo de energia em KWh
function calcularConsumoEnergia(intensity) {
  const potenciaLampada = 0.05; // Supomos que a lâmpada consome 0.05 KWh por unidade de intensidade (simplificação)
  return (intensity / 100) * potenciaLampada;
}

// Função para calcular economia de energia
function calcularEconomiaEnergia(intensityAntiga, intensityNova) {
  const consumoAntigo = calcularConsumoEnergia(intensityAntiga);
  const consumoNovo = calcularConsumoEnergia(intensityNova);
  return consumoAntigo - consumoNovo;
}

// Rota para obter o status e a intensidade da luz
router.get('/', (req, res) => {
  db.get('SELECT * FROM lighting ORDER BY id DESC LIMIT 1', (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao obter status de iluminação', error: err });
    }
    if (!row) {
      return res.status(404).json({ message: 'Nenhuma configuração de iluminação encontrada' });
    }
    const consumo = calcularConsumoEnergia(row.intensity);
    res.json({ ...row, consumoEnergia: consumo });
  });
});

// Rota para registrar uma nova alteração de intensidade e status da luz
router.put('/', (req, res) => {
  const { intensity, status } = req.body;

  // Verifica se o valor de intensidade é válido
  if (intensity < 0 || intensity > 100) {
    return res.status(400).json({ message: 'A intensidade da luz deve estar entre 0 e 100' });
  }

  // Obtém o valor atual de intensidade da luz (se necessário para calcular economia)
  db.get('SELECT * FROM lighting ORDER BY id DESC LIMIT 1', (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao obter os dados de iluminação', error: err });
    }
    // Se não encontrar nenhuma linha, podemos simplesmente inserir uma nova linha sem cálculo de economia
    const economia = row ? calcularEconomiaEnergia(row.intensity, intensity) : 0; // Se não existir, não calcula economia
    const consumoNovo = calcularConsumoEnergia(intensity);

    // Inserção de uma nova linha de iluminação com a nova intensidade e status
    db.run(
      'INSERT INTO lighting (username, intensity, status, consumoEnergia, economiaEnergia) VALUES (?, ?, ?, ?, ?)',
      ['admin', intensity, status, consumoNovo, economia],
      function (err) {
        if (err) {
          return res.status(500).json({ message: 'Erro ao inserir nova configuração de iluminação', error: err });
        }
        res.json({ message: 'Nova configuração de iluminação registrada com sucesso!', economia });
      }
    );
  });
});

// Rota para excluir um valor de intensidade
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  // Obtém o valor de intensidade da iluminação a ser excluída
  db.get('SELECT * FROM lighting WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao buscar dados', error: err });
    }
    if (!row) {
      return res.status(404).json({ message: 'Iluminação não encontrada' });
    }

    const economiaEnergia = row.consumoEnergia; // Consumo removido
    db.run('DELETE FROM lighting WHERE id = ?', [id], (err) => {
      if (err) {
        return res.status(500).json({ message: 'Erro ao excluir a iluminação', error: err });
      }
      res.json({ message: 'Iluminação excluída com sucesso!', economiaEnergia });
    });
  });
});

module.exports = router;
