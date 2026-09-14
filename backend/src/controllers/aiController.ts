import { Request, Response } from 'express';
import { generateListingInfo } from '../services/aiService';

export const analyzeImage = async (req: Request, res: Response) => {
    try {
        const { image, mimeType, hint } = req.body;
        
        if (!image) {
            return res.status(400).json({ error: 'Nenhuma imagem Base64 fornecida.' });
        }

        // Limpa o prefixo padrão do frontend caso exista (ex: data:image/png;base64,iVBORw0KGgo...)
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        const actualMimeType = mimeType || 'image/jpeg';
        
        console.log(`[AI Controller] Analisando imagem (${actualMimeType}) para rascunho de leilão...`);
        
        const listingData = await generateListingInfo(base64Data, actualMimeType, hint);

        return res.status(200).json(listingData);
    } catch (error: any) {
        console.error('[AI Controller] Falha ao processar análise visual:', error);
        return res.status(500).json({ error: 'Erro interno ao tentar analisar a imagem do lote.' });
    }
};
