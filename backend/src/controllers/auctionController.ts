import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { io } from '../socket';
import { aiQueue } from '../queues/aiQueue';

export const createAuction = async (req: Request, res: Response) => {
  try {
    // Conversões e Tipagens explícitas para garantir que o TypeScript valide os dados pro Prisma
    const sellerId = req.body.sellerId as string;
    const title = req.body.title as string;
    const description = req.body.description as string;
    const startingPrice = Number(req.body.startingPrice);
    const endsAt = new Date(req.body.endsAt as string);
    
    // Obs: Em produção, sellerId vem do token JWT.
    const auction = await prisma.auction.create({
      data: {
        sellerId,
        title,
        description,
        startingPrice,
        currentPrice: startingPrice,
        endsAt,
      },
    });
    
    return res.status(201).json(auction);
  } catch (error: unknown) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao criar leilão' });
  }
};

export const getAuctions = async (req: Request, res: Response) => {
  try {
    const auctions = await prisma.auction.findMany({
      include: { seller: { select: { name: true, email: true } } },
      orderBy: { endsAt: 'asc' }
    });
    return res.status(200).json(auctions);
  } catch (error: unknown) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar leilões' });
  }
};

export const placeBid = async (req: Request, res: Response) => {
  // Garantindo ao TypeScript que auctionId é sempre string pura (corrige erro TS2322)
  const auctionId = req.params.id as string;
  const bidderId = req.body.bidderId as string;
  const amount = Number(req.body.amount);

  try {
    // 1. Busca o leilão atual
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId }
    });

    if (!auction) {
      return res.status(404).json({ error: 'Leilão não encontrado' });
    }
    
    if (auction.status !== 'ACTIVE' || new Date() > auction.endsAt) {
      return res.status(400).json({ error: 'Este leilão já foi encerrado' });
    }

    if (amount <= auction.currentPrice) {
      return res.status(400).json({ error: 'O lance deve ser maior que o preço atual' });
    }

    // 2. Anti-Sniper: Se faltam menos de 30 segundos, adiciona 30s extras
    const timeRemaining = auction.endsAt.getTime() - new Date().getTime();
    let newEndsAt = auction.endsAt;
    if (timeRemaining < 30000) {
      newEndsAt = new Date(new Date().getTime() + 30000);
    }

    // 3. Optimistic Locking: Tenta atualizar verificando se a 'version' ainda é a mesma
    const updatedAuction = await prisma.auction.update({
      where: { 
        id: auctionId, 
        version: auction.version // A mágica acontece aqui!
      },
      data: { 
        currentPrice: amount, 
        endsAt: newEndsAt, 
        version: { increment: 1 } 
      }
    });

    // 4. Registra o lance
    const bid = await prisma.bid.create({
      data: { auctionId, bidderId, amount },
      include: { bidder: { select: { name: true } } }
    });

    // 5. Emite via WebSocket
    if (io) {
      io.to(`auction_${auctionId}`).emit('newBid', { auction: updatedAuction, bid });
    }

    // 6. Joga na fila do BullMQ
    // (O TypeScript agora reconhecerá a propriedade bid.bidder devidamente mapeada)
    await aiQueue.add('generate-hype', { 
      auctionId, 
      currentBid: amount, 
      bidderName: bid.bidder.name 
    });

    return res.status(200).json({ success: true, bid, auction: updatedAuction });
  } catch (error: any) {
    // Mantido como 'any' local apenas para checar o código de erro nativo do Prisma
    if (error?.code === 'P2025') {
      return res.status(409).json({ 
        error: 'Conflito de concorrência: Um lance maior foi computado no mesmo milissegundo. Atualize e tente novamente.' 
      });
    }
    console.error(error);
    return res.status(500).json({ error: 'Erro interno ao processar o lance' });
  }
};
