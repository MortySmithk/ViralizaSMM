// Este código deve estar no arquivo /api/proxy.js

export default async function handler(req, res) {
  // URL da API real do fornecedor
  const apiUrl = 'https://worldsmm.com.br/api/v2';

  // Pega a chave da API das variáveis de ambiente da Vercel para segurança
  const apiKey = process.env.SMM_API_KEY;

  // VERIFICAÇÃO CRÍTICA: Checa se a chave da API foi carregada do ambiente.
  if (!apiKey) {
    console.error("ERRO GRAVE: A variável de ambiente SMM_API_KEY não foi encontrada.");
    return res.status(500).json({ error: 'Configuração do servidor incompleta: Chave da API ausente.' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const clientData = req.body;

    const formData = new URLSearchParams();
    formData.append('key', apiKey);
    for (const key in clientData) {
      formData.append(key, clientData[key]);
    }

    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const responseText = await apiResponse.text(); // Lê a resposta como texto primeiro para depuração

    if (!apiResponse.ok) {
      console.error(`Erro da API externa (${apiResponse.status}): ${responseText}`);
      return res.status(apiResponse.status).json({ error: `Erro da API externa: ${responseText}` });
    }

    try {
        const data = JSON.parse(responseText); // Tenta fazer o parse do JSON
        res.status(200).json(data);
    } catch (jsonError) {
        console.error("Erro ao fazer parse do JSON da API externa:", responseText);
        res.status(500).json({ error: 'A resposta da API externa não é um JSON válido.' });
    }

  } catch (error) {
    console.error('Erro no proxy da API:', error.message);
    res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
  }
}
