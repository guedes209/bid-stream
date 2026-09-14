import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const createAuction = async (req: Request, res: Response) => {
  try {
    const { sellerId, title, description, startingPrice, endsAt } = req.body;
    
    // Obs: Em produção, sellerId vem do token JWT.
    const auction = await prisma.auction.create({
      data: {
        sellerId,
        title,
        description,
        startingPrice,
        currentPrice: startingPrice,
        endsAt: new Date(endsAt),
      },
    });
    
    res.status(201).json(auction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar leilão' });
  }
};

export const getAuctions = async (req: Request, res: Response) => {
  try {
    const auctions = await prisma.auction.findMany({
      include: { seller: { select: { name: true, email: true } } },
      orderBy: { endsAt: 'asc' }
    });
    res.status(200).json(auctions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar leilões' });
  }
};
