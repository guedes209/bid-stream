"use client";

import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, TrendingUp, Gavel, User, AlertCircle, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';

const API_URL = 'http://localhost:3001';

interface Auction {
  id: string;
  title: string;
  description: string;
  currentPrice: number;
  startingPrice: number;
  endsAt: string;
  bids?: any[];
}

interface BidEvent {
  id: string;
  message: string;
  timestamp: Date;
  isAi: boolean;
}

interface ChartData {
  time: string;
  price: number;
}

export default function AuctionRoomPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [auction, setAuction] = useState<Auction | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [events, setEvents] = useState<BidEvent[]>([]);
  const [bidAmount, setBidAmount] = useState<string>('');
  
  const [fatalError, setFatalError] = useState<string>('');
  const [bidError, setBidError] = useState<string>('');
  
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      router.push('/login');
      return;
    }
    setCurrentUser(JSON.parse(stored));

    if (!id) return;

    let socket: Socket;

    const fetchAuctionData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auctions`);
        const data = await res.json();
        const currentAuction = data.find((a: any) => a.id === id);
        
        if (currentAuction) {
          setAuction(currentAuction);
          
          const historyBids = currentAuction.bids || [];
          
          const historyEvents = historyBids.map((b: any) => ({
            id: b.id,
            message: `Lance registrado: R$ ${b.amount.toLocaleString('pt-BR')} (${b.bidder.name})`,
            timestamp: new Date(b.createdAt),
            isAi: false
          })).reverse().slice(0, 20);

          const initialChart = [{ time: 'Início', price: currentAuction.startingPrice }];
          historyBids.forEach((b: any) => {
            initialChart.push({
              time: new Date(b.createdAt).toLocaleTimeString(),
              price: b.amount
            });
          });

          setEvents(historyEvents);
          setChartData(initialChart.slice(-20));
          
          socket = io(API_URL);
          socketRef.current = socket;
          socket.emit('joinAuction', currentAuction.id);
          
          const onNewBid = (payload: any) => {
            setAuction(payload.auction);
            
            setChartData(prev => [...prev.slice(-19), { 
              time: new Date().toLocaleTimeString(), 
              price: payload.auction.currentPrice 
            }]);
            
            setEvents(prev => {
              if (prev.some(ev => ev.id === payload.bid.id)) return prev;
              
              return [{
                id: payload.bid.id,
                message: `Lance registrado: R$ ${payload.bid.amount.toLocaleString('pt-BR')} (${payload.bid.bidder.name})`,
                timestamp: new Date(),
                isAi: false
              }, ...prev].slice(0, 20);
            });
          };

          const onAuctioneerMessage = (payload: any) => {
            setEvents(prev => {
              const aiId = `ai-${payload.timestamp}-${payload.message.substring(0,10)}`;
              if (prev.some(ev => ev.id === aiId)) return prev;

              return [{
                id: aiId,
                message: payload.message,
                timestamp: new Date(payload.timestamp),
                isAi: true
              }, ...prev].slice(0, 20);
            });
          };

          socket.on('newBid', onNewBid);
          socket.on('auctioneerMessage', onAuctioneerMessage);

        } else {
          setFatalError("Leilão não encontrado ou encerrado.");
        }
      } catch (err) {
        setFatalError("Erro ao conectar com a API Backend.");
      }
    };
    
    fetchAuctionData();

    return () => {
      if (socket) {
        socket.removeAllListeners('newBid');
        socket.removeAllListeners('auctioneerMessage');
        socket.disconnect();
      }
    };
  }, [id, router]);

  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setBidError('');
    if (!auction || !currentUser) return;
    
    const amount = Number(bidAmount);
    if (amount <= auction.currentPrice) {
      setBidError('O lance deve ser maior que o preço atual.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auctions/${auction.id}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bidderId: currentUser.id, amount: amount })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        setBidError(errData.error || 'Erro ao processar lance.');
        return;
      }
      setBidAmount('');
    } catch (err) {
      setBidError('Falha de conexão com o servidor.');
    }
  };

  if (fatalError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6] gap-6 px-4">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <p className="text-xl text-[#111111] font-[family-name:var(--font-playfair)]">{fatalError}</p>
        <button onClick={() => router.push('/')} className="text-[#D4AF37] uppercase tracking-widest font-bold underline flex items-center gap-2 hover:text-[#111] transition-colors">
           <ArrowLeft size={16}/> Voltar ao Dashboard
        </button>
      </div>
    );
  }

  if (!auction || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <p className="text-xl text-[#111111] font-[family-name:var(--font-playfair)] animate-pulse">Abrindo portas do Salão Principal...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
      <header className="mb-12 flex justify-between items-end border-b border-[#D4AF37]/30 pb-6 relative">
        <div>
          <button onClick={() => router.push('/')} className="mb-6 text-[#999] hover:text-[#111] uppercase tracking-widest text-[10px] font-bold flex items-center gap-2 transition-colors">
            <ArrowLeft size={14}/> Voltar à Coleção
          </button>
          <h2 className="text-sm font-bold tracking-widest text-[#D4AF37] uppercase mb-2">Lote Oficial</h2>
          <h1 className="text-3xl font-[family-name:var(--font-playfair)] font-bold text-[#111111] max-w-2xl line-clamp-1">
            {auction.title}
          </h1>
        </div>
        <div className="flex items-center gap-3 bg-[#111111] text-[#FAF9F6] px-5 py-2 rounded-sm shadow-md absolute right-0 bottom-6">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-pulse"></span>
          <span className="text-sm font-semibold uppercase tracking-widest">Live Now</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* === LADO ESQUERDO === */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          <div className="aspect-[4/3] bg-white border border-[#E5E5E5] p-8 flex items-center justify-center shadow-sm relative overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-[#F9F9F9]"></div>
            <img 
              src={auction.title.includes('Rolex') 
                ? 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=1000&auto=format&fit=crop' 
                : auction.title.includes('MacBook')
                ? 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1000&auto=format&fit=crop'
                : 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=1000&auto=format&fit=crop'
              }
              alt="Item do Leilão" 
              className="w-full h-full object-contain mix-blend-multiply drop-shadow-2xl z-10 hover:scale-105 transition-transform duration-700"
            />
          </div>

          <div>
            <h3 className="text-2xl font-[family-name:var(--font-playfair)] font-bold mb-4">{auction.title}</h3>
            <p className="text-[#666666] leading-relaxed text-base">{auction.description}</p>
          </div>

          {/* Painel Principal de Lances (Com mt-4 para ficar colado no texto) */}
          <div className="bg-[#111111] text-[#FAF9F6] p-8 rounded-sm shadow-2xl mt-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 blur-3xl rounded-full"></div>
            
            <div className="flex justify-between items-end mb-8 relative z-10">
              <div>
                <p className="text-[#A3A3A3] text-sm uppercase tracking-widest mb-1">Lance Vencedor</p>
                <p className="text-5xl font-light font-[family-name:var(--font-playfair)] text-[#D4AF37]">
                  R$ {auction.currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[#A3A3A3] text-sm uppercase tracking-widest mb-1 flex items-center gap-2 justify-end">
                  <Clock size={14} /> Fim Previsto
                </p>
                <p className="text-xl text-[#FAF9F6] font-medium tracking-wide">
                  {format(new Date(auction.endsAt), "HH:mm:ss")}
                </p>
              </div>
            </div>

            <form onSubmit={handleBid} className="flex gap-4 relative z-10">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999] font-semibold">R$</span>
                <input 
                  type="number" 
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={(auction.currentPrice + 100).toString()}
                  className="w-full bg-[#1A1A1A] border border-[#333] text-white px-12 py-4 rounded-sm focus:outline-none focus:border-[#D4AF37] transition-all text-xl placeholder:text-[#555]"
                />
              </div>
              <button type="submit" className="bg-[#D4AF37] hover:bg-[#E5C158] text-[#111111] px-10 py-4 font-bold tracking-widest uppercase transition-colors rounded-sm flex items-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:shadow-[0_0_25px_rgba(212,175,55,0.6)]">
                <Gavel size={20} /> Enviar Lance
              </button>
            </form>
            
            {bidError && (
              <p className="text-red-400 mt-4 flex items-center gap-2 relative z-10 text-sm bg-red-900/20 p-3 border border-red-900/50 animate-in fade-in slide-in-from-top-1">
                <AlertCircle size={16}/> {bidError}
              </p>
            )}
          </div>
        </div>

        {/* === LADO DIREITO: GRÁFICOS E CHAT === */}
        <div className="lg:col-span-5 relative h-[700px] lg:h-auto">
          {/* Truque Absolute: O Feed obedece cegamente a altura do lado esquerdo no Desktop */}
          <div className="lg:absolute lg:inset-0 flex flex-col gap-8 h-full w-full">
            <div className="bg-white border border-[#E5E5E5] p-6 shadow-sm shrink-0">
              <h3 className="text-xs font-bold tracking-widest text-[#999] uppercase mb-6 flex items-center gap-2">
                <TrendingUp size={14} className="text-[#D4AF37]" /> Curva de Preço (Real-Time)
              </h3>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#A3A3A3' }} axisLine={false} tickLine={false} />
                    <YAxis domain={['dataMin - 500', 'auto']} tick={{ fontSize: 10, fill: '#A3A3A3' }} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${(val/1000).toFixed(1)}k`} width={50} />
                    <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff' }} itemStyle={{ color: '#D4AF37' }} />
                    <Area type="stepAfter" dataKey="price" stroke="#D4AF37" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-[#E5E5E5] flex flex-col flex-1 min-h-0 shadow-sm">
              <div className="p-5 border-b border-[#E5E5E5] flex justify-between items-center bg-[#FAFAFA]">
                <h3 className="text-xs font-bold tracking-widest text-[#111111] uppercase">Activity Feed</h3>
                <span className="text-xs font-semibold text-[#666] flex items-center gap-2">
                  Logado como: {currentUser.name.split(' ')[0]} <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.6)]"></span>
                </span>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 min-h-0 flex flex-col gap-5 bg-[#FDFDFC] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-[#F9F9F9] [&::-webkit-scrollbar-thumb]:bg-[#D4AF37]">
                {events.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center opacity-50 flex-col gap-2">
                    <Clock size={24} className="text-[#D4AF37]" />
                    <p className="text-center text-[#999] text-sm italic font-[family-name:var(--font-playfair)]">Aguardando a abertura dos lances...</p>
                  </div>
                ) : (
                  events.map((ev, index) => (
                    <div key={ev.id} className={`flex flex-col ${ev.isAi ? 'items-end' : 'items-start'} animate-in slide-in-from-top-2 fade-in duration-300`}>
                      <div className={`px-4 py-3 max-w-[85%] rounded-sm ${ev.isAi ? 'bg-[#111111] text-[#D4AF37] shadow-lg border border-[#333]' : index === 0 ? 'bg-white border-l-2 border-[#D4AF37] text-[#111] shadow-md font-semibold' : 'bg-white text-[#333] border border-[#E5E5E5] shadow-sm'}`}>
                        <p className={`text-sm ${ev.isAi ? 'font-medium font-[family-name:var(--font-playfair)] text-base' : ''}`}>{ev.message}</p>
                      </div>
                      <span className="text-[10px] text-[#A3A3A3] mt-1.5 uppercase tracking-wider flex items-center gap-1 font-semibold">
                        {ev.isAi ? '🎙️ Leiloeiro (IA)' : <><User size={10}/> Participante</>} • {format(new Date(ev.timestamp), 'HH:mm:ss')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
