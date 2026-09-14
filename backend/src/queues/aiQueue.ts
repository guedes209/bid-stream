import { Queue, Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { io } from '../socket';
import { generateHypeMessage } from '../services/aiService';

const QUEUE_NAME = 'ai-auctioneer-queue';

// Fila: onde o servidor HTTP joga as tarefas para não ficar esperando
export const aiQueue = new Queue(QUEUE_NAME, {
    connection: redisConnection
});

// Worker: o processo em background que fica lendo a fila e executando o trabalho pesado
export const aiWorker = new Worker(QUEUE_NAME, async (job: Job) => {
    const { auctionId, currentBid, bidderName } = job.data;
    
    console.log(`[BullMQ] Processando AI Bot para o lance de ${bidderName}...`);
    
    try {
        // Pede para o Gemini criar a frase criativa
        const aiMessage = await generateHypeMessage(currentBid, bidderName);

        // Dispara para o WebSocket
        if (io) {
            io.to(`auction_${auctionId}`).emit('auctioneerMessage', {
                message: aiMessage,
                timestamp: new Date()
            });
        }
    } catch (error) {
        console.error('[BullMQ] Erro ao gerar fala da IA:', error);
        throw error;
    }
    
    return { success: true };
}, { connection: redisConnection });

aiWorker.on('completed', (job) => {
    console.log(`[BullMQ] Job ${job.id} finalizado e mensagem do Bot disparada!`);
});

aiWorker.on('failed', (job, err) => {
    console.error(`[BullMQ] Falha no Job:`, err);
});
