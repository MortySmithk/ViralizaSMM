// Este código deve estar no arquivo /api/proxy.js

export default async function handler(req, res) {
  // URL da API real do fornecedor
  const apiUrl = 'https://worldsmm.com.br/api/v2';

  // Verifica se o método da requisição é POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // Pega a chave da API das variáveis de ambiente da Vercel para segurança
    const apiKey = process.env.SMM_API_KEY;

    if (!apiKey) {
      throw new Error('A chave da API não foi configurada no servidor.');
    }

    // O corpo da requisição do frontend (ex: { action: 'services' })
    // já vem como um objeto no Vercel.
    const clientData = req.body;

    // Adiciona a chave da API aos dados que serão enviados
    const formData = new URLSearchParams();
    formData.append('key', apiKey);
    for (const key in clientData) {
      formData.append(key, clientData[key]);
    }

    // Faz a chamada para a API real
    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    // Se a resposta da API não for bem-sucedida, repassa o erro
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      return res.status(apiResponse.status).json({ error: `Erro da API externa: ${errorText}` });
    }

    // Repassa a resposta bem-sucedida da API para o frontend
    const data = await apiResponse.json();
    res.status(200).json(data);

  } catch (error) {
    console.error('Erro no proxy da API:', error);
    res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
  }
}
