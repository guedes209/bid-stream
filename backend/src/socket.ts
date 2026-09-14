import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

export let io: Server;

export const initSocket = (server: HttpServer) => {
    io = new Server(server, {
        cors: {
            origin: '*', // Em produção, alteraremos para a URL exata do Frontend
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket: Socket) => {
        console.log(`[Socket] Cliente conectado: ${socket.id}`);

        // O cliente envia esse evento ao entrar na página de um leilão específico
        socket.on('joinAuction', (auctionId: string) => {
            socket.join(`auction_${auctionId}`);
            console.log(`[Socket] Cliente ${socket.id} entrou na sala do leilão: ${auctionId}`);
        });

        socket.on('disconnect', () => {
            console.log(`[Socket] Cliente desconectado: ${socket.id}`);
        });
    });

    return io;
};

