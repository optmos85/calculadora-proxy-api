// ARQUIVO: index.js (VERSÃO ATUALIZADA)

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Lista de origens permitidas (com e sem www)
const allowedOrigins = [
  'https://www.contabilidademaster.com.br',
  'https://contabilidademaster.com.br'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Acesso não permitido pela política de CORS'));
    }
  }
}));

app.use(express.json());

// --- ENDPOINTS DA CALCULADORA DA RECEITA FEDERAL ---
// ATENÇÃO: Verifique na documentação da RFB se estes caminhos estão corretos!
const RFB_BASE_URL = 'https://jona-postcruciate-unsufferably.ngrok-free.dev'; // Sua URL do ngrok
const RFB_REGIME_GERAL_URL = `${RFB_BASE_URL}/calculadora-cbs-ibs/v1/calcular`;
const RFB_PEDAGIO_URL = `${RFB_BASE_URL}/calculadora-cbs-ibs/v1/calcular-pedagio`; // << NOVO! Endpoint para Pedágio (suposição)

// --- ROTA PARA REGIME GERAL (JÁ EXISTENTE) ---
app.post('/api/calcular', async (req, res) => {
  console.log('Recebida requisição para /api/calcular:', req.body);
  if (!req.body || typeof req.body.valor !== 'number' || !req.body.regime) {
    return res.status(400).json({ error: 'Dados inválidos para Regime Geral.' });
  }
  try {
    const response = await axios.post(RFB_REGIME_GERAL_URL, req.body);
    console.log('Cálculo Regime Geral OK:', response.data);
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Erro ao comunicar com o componente RFB (Regime Geral):', error.message);
    res.status(502).json({ error: 'O serviço de cálculo está temporariamente indisponível.' });
  }
});

// --- NOVA ROTA PARA PEDÁGIO ---
app.post('/api/calcular-pedagio', async (req, res) => {
    console.log('Recebida requisição para /api/calcular-pedagio:', req.body);

    // Validação dos dados esperados para Pedágio
    if (!req.body || typeof req.body.valor !== 'number' || !req.body.categoriaVeiculo) {
        return res.status(400).json({ error: 'Dados inválidos. É necessário enviar "valor" e "categoriaVeiculo".' });
    }

    try {
        // Repassa a requisição para o endpoint de pedágio da calculadora da RFB
        const response = await axios.post(RFB_PEDAGIO_URL, req.body);
        console.log('Cálculo Pedágio OK:', response.data);
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Erro ao comunicar com o componente RFB (Pedágio):', error.message);
        res.status(502).json({ error: 'O serviço de cálculo de pedágio está temporariamente indisponível.' });
    }
});


app.listen(PORT, () => {
  console.log(`API Proxy da calculadora rodando na porta ${PORT}`);
});