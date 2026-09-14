/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpar tabelas para evitar duplicação em caso de execuções múltiplas
  await prisma.bid.deleteMany();
  await prisma.auction.deleteMany();
  await prisma.user.deleteMany();

  // 1. Criar Usuários
  const user1 = await prisma.user.create({
    data: {
      name: 'Alice Guimarães',
      email: 'alice@exemplo.com',
      password: 'password123', // Em prod usaríamos bcrypt
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Bruno Silva',
      email: 'bruno@exemplo.com',
      password: 'password123',
    },
  });

  const user3 = await prisma.user.create({
    data: {
      name: 'Carlos Magnata',
      email: 'carlos@exemplo.com',
      password: 'password123',
    },
  });

  // 2. Criar Leilões
  await prisma.auction.create({
    data: {
      sellerId: user3.id,
      title: 'Rolex Daytona Cosmograph (Platinum)',
      description: 'A peça mais procurada do universo da alta relojoaria. Referência 116506 em Platina maciça, mostrador Ice Blue exclusivíssimo.',
      startingPrice: 65000,
      currentPrice: 65000,
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // + 1 Dia
    },
  });

  await prisma.auction.create({
    data: {
      sellerId: user1.id,
      title: 'Quadro A Noite Estrelada (Réplica Premium)',
      description: 'Uma belíssima reprodução pintada a óleo de uma das obras mais famosas do mundo. Tela 80x60cm.',
      startingPrice: 1500,
      currentPrice: 1500,
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 2), // + 2 horas
    },
  });

  await prisma.auction.create({
    data: {
      sellerId: user2.id,
      title: 'MacBook Pro M3 Max 64GB',
      description: 'Apenas retirado da caixa para testes. Estado impecável, garantia Apple Care+ ativa.',
      startingPrice: 22000,
      currentPrice: 22000,
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 5), // + 5 horas
    },
  });

  console.log('✅ Banco de dados populado com 3 usuários e 3 leilões com sucesso!');
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

