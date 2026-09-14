import { Request, Response } from 'express';
import { generateListingInfo } from '../services/aiService';

export const generateSmartListing = async (req: Request, res: Response) => {
  try {
    const { base64Image, mimeType, hint } = req.body;
    
    if (!base64Image || !mimeType) {
      return res.status(400).json({ error: 'base64Image e mimeType são obrigatórios' });
    }

    const data = await generateListingInfo(base64Image, mimeType, hint);
    res.status(200).json(data);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Erro ao processar imagem na IA' });
  }
};
