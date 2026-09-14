import { Queue, Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { io } from '../socket';

const QUEUE_NAME = 'ai-auctioneer-queue';

// Fila: onde o servidor HTTP joga as tarefas para não ficar esperando
export const aiQueue = new Queue(QUEUE_NAME, {
    connection: redisConnection
});

// Worker: o processo em background que fica lendo a fila e executando o trabalho pesado
export const aiWorker = new Worker(QUEUE_NAME, async (job: Job) => {
    const { auctionId, currentBid, bidderName } = job.data;
    
    console.log(`[BullMQ] Processando AI Bot para o lance no leilão ${auctionId}...`);
    
    // Na Task 3.5 vamos acionar a generateListingInfo (Gemini) aqui dentro!
    const fakeAIMessage = `Wow! Recebemos um lance incrível de R$${currentBid} do(a) ${bidderName}. Quem dá mais?`;

    // Emite a mensagem direto para quem está conectado na sala, sem depender de requisição HTTP
    if (io) {
        io.to(`auction_${auctionId}`).emit('auctioneerMessage', {
            message: fakeAIMessage,
            timestamp: new Date()
        });
    }
    
    return { success: true };
}, { connection: redisConnection });

aiWorker.on('completed', (job) => {
    console.log(`[BullMQ] Job ${job.id} finalizado e mensagem disparada!`);
});

aiWorker.on('failed', (job, err) => {
    console.error(`[BullMQ] Falha no Job:`, err);
});

