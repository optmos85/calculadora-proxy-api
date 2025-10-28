// ARQUIVO: index.js (VERSÃO FINAL E CORRIGIDA)

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

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
const RFB_BASE_URL = 'https://jona-postcruciate-unsufferably.ngrok-free.dev'; // Sua URL do ngrok
const RFB_REGIME_GERAL_URL = `${RFB_BASE_URL}/calculadora/regime-geral`; // Caminho corrigido
const RFB_PEDAGIO_URL = `${RFB_BASE_URL}/calculadora/pedagio`; // << CAMINHO CORRIGIDO!

// --- ROTA PARA REGIME GERAL ---
app.post('/api/calcular', async (req, res) => {
  // (Esta rota continua igual e funcional)
  try {
    // Para o Regime Geral, a API da RFB espera um formato mais complexo.
    // Vamos criar um payload com dados fictícios, usando o valor que veio do site.
    const rfbPayload = {
      id: "3fa85f64-5717-4562-b3fc-2c963f66afa6", // ID de exemplo
      versao: "1.0",
      dataHoraEmissao: new Date().toISOString(),
      municipio: 3106200, // Código IBGE de Belo Horizonte (Exemplo)
      uf: "MG",
      itens: [
        {
          numero: 1,
          cst: "000",
          baseCalculo: req.body.valor, // Usando o valor do formulário
          cClassTrib: "000001" // Código de exemplo
        }
      ]
    };
    const response = await axios.post(RFB_REGIME_GERAL_URL, rfbPayload);
    // A resposta da RFB é complexa, vamos simplificá-la para o nosso frontend
    const total = response.data.total.tribCalc.IBSCBSTot;
    const simplifiedResponse = {
        valorCBS: total.gCBS.vCBS,
        aliquotaCBS: 0, // A API não retorna a alíquota diretamente neste objeto
        valorIBS: total.gIBS.vIBS,
        aliquotaIBS: 0, // A API não retorna a alíquota diretamente neste objeto
        valorTotal: req.body.valor + total.gCBS.vCBS + total.gIBS.vIBS
    };
    res.status(200).json(simplifiedResponse);
  } catch (error) {
    console.error('Erro ao comunicar com o componente RFB (Regime Geral):', error.message);
    res.status(502).json({ error: 'O serviço de cálculo está temporariamente indisponível.' });
  }
});

// --- ROTA CORRIGIDA PARA PEDÁGIO ---
app.post('/api/calcular-pedagio', async (req, res) => {
    console.log('Recebida requisição para /api/calcular-pedagio:', req.body);

    try {
        // A API da RFB para pedágio espera um formato complexo.
        // Vamos montar esse formato usando o valor do formulário e dados de exemplo.
        const rfbPayload = {
            dataHoraEmissao: new Date().toISOString(),
            codigoMunicipioOrigem: 3106200, // Código IBGE de Belo Horizonte (Exemplo)
            ufMunicipioOrigem: "MG",
            cst: "000",
            baseCalculo: req.body.valor, // Usando o valor do formulário de pedágio
            cClassTrib: "000002", // Código de exemplo para pedágio
            trechos: [
                {
                    numero: 1,
                    municipio: 3106200,
                    uf: "MG",
                    extensao: 100 // Extensão de exemplo em KM
                }
            ]
        };
        const response = await axios.post(RFB_PEDAGIO_URL, rfbPayload);
        // A resposta da RFB é complexa, vamos simplificar para o frontend
        const total = response.data.total;
        const simplifiedResponse = {
            valorCBS: total.cbsTotal.valorTributo,
            aliquotaCBS: 0, // A API não retorna a alíquota diretamente
            valorIBS: total.ibsEstadualTotal.valorTributo + total.ibsMunicipalTotal.valorTributo,
            aliquotaIBS: 0, // A API não retorna a alíquota diretamente
            valorTotal: req.body.valor + total.cbsTotal.valorTributo + total.ibsEstadualTotal.valorTributo + total.ibsMunicipalTotal.valorTributo
        };
        res.status(200).json(simplifiedResponse);
    } catch (error) {
        console.error('Erro ao comunicar com o componente RFB (Pedágio):', error.message);
        res.status(502).json({ error: 'O serviço de cálculo de pedágio está temporariamente indisponível.' });
    }
});

app.listen(PORT, () => {
  console.log(`API Proxy da calculadora rodando na porta ${PORT}`);
});