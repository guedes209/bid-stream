import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { initSocket } from './socket';
import auctionRoutes from './routes/auctionRoutes';
import aiRoutes from './routes/aiRoutes';

dotenv.config();

const app = express();
const server = createServer(app); // Envolvemos o Express no servidor HTTP nativo
initSocket(server); // Acoplamos o Socket.io ao servidor HTTP

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Imagens em base64 precisam de payload maior

const PORT = process.env.PORT || 3001;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'BidStream API' });
});

app.use('/api/auctions', auctionRoutes);
app.use('/api/ai', aiRoutes);

// ATENÇÃO: Agora iniciamos o 'server' nativo em vez do 'app'
server.listen(PORT, () => {
  console.log(`Server rodando na porta ${PORT}`);
});
