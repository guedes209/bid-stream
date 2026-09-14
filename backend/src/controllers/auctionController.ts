import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { io } from '../socket';
import { aiQueue } from '../queues/aiQueue';

export const createAuction = async (req: Request, res: Response) => {
  try {
    const sellerId = req.body.sellerId as string;
    const title = req.body.title as string;
    const description = req.body.description as string;
    const startingPrice = Number(req.body.startingPrice);
    const endsAt = new Date(req.body.endsAt as string);
    
    // O banco validará a existência do SellerId via FK nativamente. Zero hacks.
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
  } catch (error: any) {
    if (error?.code === 'P2003') {
       return res.status(400).json({ error: 'Usuário vendedor não existe (Autenticação inválida).' });
    }
    console.error(error);
    return res.status(500).json({ error: 'Erro ao criar leilão' });
  }
};

export const getAuctions = async (req: Request, res: Response) => {
  try {
    const auctions = await prisma.auction.findMany({
      include: { 
        seller: { select: { name: true, email: true } },
        bids: {
          include: { bidder: { select: { name: true } } },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { endsAt: 'asc' }
    });
    return res.status(200).json(auctions);
  } catch (error: unknown) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar leilões' });
  }
};

export const placeBid = async (req: Request, res: Response) => {
  const auctionId = req.params.id as string;
  const bidderId = req.body.bidderId as string;
  const amount = Number(req.body.amount);

  try {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId }
    });

    if (!auction) return res.status(404).json({ error: 'Leilão não encontrado' });
    if (auction.status !== 'ACTIVE' || new Date() > auction.endsAt) return res.status(400).json({ error: 'Este leilão já foi encerrado' });
    if (amount <= auction.currentPrice) return res.status(400).json({ error: 'O lance deve ser obrigatoriamente maior que o preço atual.' });

    const timeRemaining = auction.endsAt.getTime() - new Date().getTime();
    let newEndsAt = auction.endsAt;
    if (timeRemaining < 30000) {
      newEndsAt = new Date(new Date().getTime() + 30000);
    }

    const updatedAuction = await prisma.auction.update({
      where: { id: auctionId, version: auction.version },
      data: { currentPrice: amount, endsAt: newEndsAt, version: { increment: 1 } }
    });

    // Se o Bidder não existir no banco, vai falhar com P2003 e cair no catch
    const bid = await prisma.bid.create({
      data: { auctionId, bidderId, amount },
      include: { bidder: { select: { name: true } } }
    });

    if (io) {
      io.to(`auction_${auctionId}`).emit('newBid', { auction: updatedAuction, bid });
    }

    await aiQueue.add('generate-hype', { 
      auctionId, 
      currentBid: amount, 
      bidderName: bid.bidder.name 
    });

    return res.status(200).json({ success: true, bid, auction: updatedAuction });
  } catch (error: any) {
    if (error?.code === 'P2025') return res.status(409).json({ error: 'Conflito de concorrência: Um lance maior foi computado no mesmo milissegundo. Atualize e tente novamente.' });
    if (error?.code === 'P2003') return res.status(400).json({ error: 'Usuário comprador não encontrado (Sessão inválida).' });
    
    console.error(error);
    return res.status(500).json({ error: 'Erro interno ao processar o lance' });
  }
};
