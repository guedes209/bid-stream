import { GoogleGenerativeAI } from '@google/generative-ai';

export const generateListingInfo = async (base64Image: string, mimeType: string, hint?: string) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    
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

    try {
        const imageParts = [{
            inlineData: { data: base64Image, mimeType }
        }];

        // Tempo máximo de tolerância para gerar o lote: 15 segundos
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('TIMEOUT_API')), 15000)
        );

        const result = await Promise.race([
            model.generateContent([prompt, ...imageParts]),
            timeoutPromise
        ]) as any;

        const text = result.response.text();
        return JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch (e: any) {
        console.error("[AI Fallback] Erro ou lentidão ao conectar com Gemini para Listing:", e.message);
        return {
            title: "Lote Exclusivo (Auto-Generated)",
            description: "Devido a uma alta demanda temporária nos servidores da IA, esta descrição padrão foi acionada para não bloquear a criação do seu leilão. " + (hint || ""),
            startingPrice: 5000.00
        };
    }
}

export const generateHypeMessage = async (currentBid: number, bidderName: string) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    const prompt = `Você é um leiloeiro virtual carismático, empolgado e enérgico (mas seja super conciso, use no máximo 1 frase curta). 
Um lance acabou de ser feito por ${bidderName} no valor de R$${currentBid}. 
Crie uma frase de "hype" para animar o chat e instigar outras pessoas a cobrirem o lance. 
Exemplos de tom: "Incrível! ${bidderName} jogou duro com R$${currentBid}! Alguém cobre?", "Wow! R$${currentBid} na mesa! Dou-lhe uma..."

Responda APENAS com a frase final que será enviada no chat, sem aspas, sem formatação e sem explicações.`;

    try {
        // Em tempo real, a paciência é zero: Tolerância máxima de 2.5 segundos!
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('TIMEOUT_API')), 10000)
        );

        const result = await Promise.race([
            model.generateContent(prompt),
            timeoutPromise
        ]) as any;
        
        return result.response.text().trim();
    } catch (e: any) {
        console.error(`[AI Fallback] API lenta ou offline (${e.message}), acionando fallback rápido!`);
        
        const fallbacks = [
            `Incrível! ${bidderName} jogou duro com R$ ${currentBid.toLocaleString('pt-BR')}! Alguém tem coragem de cobrir?`,
            `Wow! R$ ${currentBid.toLocaleString('pt-BR')} na mesa por ${bidderName}! Dou-lhe uma...`,
            `A temperatura subiu! ${bidderName} não está para brincadeira com R$ ${currentBid.toLocaleString('pt-BR')}!`,
            `Temos um novo líder! ${bidderName} cravou R$ ${currentBid.toLocaleString('pt-BR')}. Quem dá mais?`
        ];
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
};
