import { GoogleGenerativeAI } from '@google/generative-ai';

export const generateListingInfo = async (base64Image: string, mimeType: string, hint?: string) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `Você é um especialista em leilões e copywriting.
Analise a imagem deste item que será leiloado.
Crie um título chamativo, uma descrição persuasiva de até 3 parágrafos focada em venda, e um preço inicial sugerido em Reais (BRL, retorne apenas o número float).
Contexto adicional do vendedor: ${hint || 'Nenhum'}.

Responda ESTRITAMENTE neste formato JSON (sem blocos de markdown de formatação, apenas o JSON puro):
{
    "title": "Relógio Antigo de Bolso",
    "description": "Uma verdadeira obra de arte...",
    "startingPrice": 150.00
}`;

    const imageParts = [{
        inlineData: { data: base64Image, mimeType }
    }];

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    
    try {
        return JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch (e) {
        console.error("Falha ao fazer parse do JSON", text);
        throw new Error("Resposta da IA inválida");
    }
}

