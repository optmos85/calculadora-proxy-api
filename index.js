// index.js - O coração da nossa API Proxy

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001; // Porta padrão para serviços de hospedagem

// Middleware para permitir que o seu site acesse esta API
const allowedOrigins = [
  'https://www.contabilidademaster.com.br', // Versão com WWW
  'https://contabilidademaster.com.br'      // Versão SEM WWW
];

app.use(cors({
  origin: function (origin, callback) {
    // Se a origem do pedido estiver na nossa lista, permita.
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Se não estiver, bloqueie.
      callback(new Error('Acesso não permitido pela política de CORS'));
    }
  }
}));

// Middleware para entender o formato JSON que o seu site enviará
app.use(express.json());

// O endereço onde o componente da Receita Federal está rodando (DENTRO deste servidor)
// Assumimos que ele rodará em localhost:8080 no mesmo ambiente que esta API
const RFB_CALCULATOR_URL = 'http://localhost:8080/calculadora-cbs-ibs/v1/calcular';

// A rota principal da nossa API
app.post('/api/calcular', async (req, res) => {
  console.log('Recebida requisição para cálculo:', req.body);

  // Validação básica dos dados recebidos do frontend
  if (!req.body || typeof req.body.valor !== 'number' || !req.body.regime) {
    return res.status(400).json({ error: 'Dados inválidos. É necessário enviar "valor" e "regime".' });
  }

  try {
    // 1. Repassa a requisição para a calculadora da RFB
    const response = await axios.post(RFB_CALCULATOR_URL, req.body);

    // 2. Retorna a resposta da calculadora da RFB para o seu site
    console.log('Cálculo realizado com sucesso:', response.data);
    res.status(200).json(response.data);

  } catch (error) {
    console.error('Erro ao comunicar com o componente da RFB:', error.message);
    // 3. Se algo der errado, informa ao seu site
    res.status(502).json({ error: 'O serviço de cálculo está temporariamente indisponível.' });
  }
});

app.listen(PORT, () => {
  console.log(`API Proxy da calculadora rodando na porta ${PORT}`);
});