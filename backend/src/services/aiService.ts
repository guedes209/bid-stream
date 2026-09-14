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

export const generateHypeMessage = async (currentBid: number, bidderName: string) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Você é um leiloeiro virtual carismático, empolgado e enérgico (mas seja super conciso, use no máximo 1 frase curta). 
Um lance acabou de ser feito por ${bidderName} no valor de R$${currentBid}. 
Crie uma frase de "hype" para animar o chat e instigar outras pessoas a cobrirem o lance. 
Exemplos de tom: "Incrível! ${bidderName} jogou duro com R$${currentBid}! Alguém cobre?", "Wow! R$${currentBid} na mesa! Dou-lhe uma..."

Responda APENAS com a frase final que será enviada no chat, sem aspas, sem formatação e sem explicações.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
};
