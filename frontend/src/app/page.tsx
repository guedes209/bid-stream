"use client";

import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, TrendingUp, Gavel, User, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const API_URL = 'http://localhost:3001';

interface Auction {
  id: string;
  title: string;
  description: string;
  currentPrice: number;
  startingPrice: number;
  endsAt: string;
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

export default function AuctionPage() {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [events, setEvents] = useState<BidEvent[]>([]);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [error, setError] = useState<string>('');
  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll do chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  // Buscar o leilão inicial
  useEffect(() => {
    const fetchAuction = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auctions`);
        const data = await res.json();
        
        if (data && data.length > 0) {
          const currentAuction = data[0];
          setAuction(currentAuction);
          setChartData([{ time: new Date().toLocaleTimeString(), price: currentAuction.startingPrice }]);
          
          // Conectar WebSocket
          const socket = io(API_URL);
          socketRef.current = socket;
          
          socket.emit('joinAuction', currentAuction.id);
          
          // Quando houver um novo lance registrado...
          socket.on('newBid', (payload) => {
            setAuction(payload.auction);
            setChartData(prev => [...prev.slice(-10), { 
              time: new Date().toLocaleTimeString(), 
              price: payload.auction.currentPrice 
            }]);
            setEvents(prev => [...prev, {
              id: Math.random().toString(),
              message: `Lance registrado de R$ ${payload.bid.amount.toLocaleString('pt-BR')}`,
              timestamp: new Date(),
              isAi: false
            }]);
          });

          // Quando a IA do BullMQ gerar um Hype...
          socket.on('auctioneerMessage', (payload) => {
            setEvents(prev => [...prev, {
              id: Math.random().toString(),
              message: payload.message,
              timestamp: new Date(payload.timestamp),
              isAi: true
            }]);
          });

        } else {
          setError("Nenhum leilão ativo encontrado no Banco de Dados.");
        }
      } catch (err) {
        console.error(err);
        setError("Erro ao conectar com a API Backend (Verifique se o backend está rodando).");
      }
    };
    fetchAuction();

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!auction) return;
    
    const amount = Number(bidAmount);
    if (amount <= auction.currentPrice) {
      setError('O lance deve ser obrigatoriamente maior que o preço atual.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auctions/${auction.id}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bidderId: 'visitante-vip-007', // Em produção, extraído da sessão de Login
          amount: amount 
        })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || 'Erro ao processar lance de alta concorrência.');
      }
      setBidAmount('');
    } catch (err) {
      setError('Falha de conexão ao enviar lance para a API.');
    }
  };

  const createSeedAuction = async () => {
    await fetch(`${API_URL}/api/auctions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sellerId: "vendedor-rolex-123",
        title: "Rolex Daytona Cosmograph (Platinum)",
        description: "A peça mais procurada do universo da alta relojoaria. Referência 116506 em Platina maciça, mostrador Ice Blue exclusivíssimo e bezel de cerâmica Cerachrom marrom. Estado impecável, caixa original, certificado e lacres intactos. Uma relíquia que raramente aparece em leilões abertos.",
        startingPrice: 65000,
        endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString() // Acaba amanhã
      })
    });
    window.location.reload();
  };

  if (!auction) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6] gap-6">
        <p className="text-xl text-[#111111] font-[family-name:var(--font-playfair)]">{error || "Preparando o salão principal..."}</p>
        {error.includes("Nenhum leilão") && (
          <button 
            onClick={createSeedAuction}
            className="bg-[#111] text-[#D4AF37] px-8 py-3 uppercase tracking-widest text-sm hover:bg-[#222] transition-colors"
          >
            Iniciar Primeiro Leilão Teste (Rolex Daytona)
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <header className="mb-12 flex justify-between items-end border-b border-[#D4AF37]/30 pb-6">
        <div>
          <h2 className="text-sm font-bold tracking-widest text-[#D4AF37] uppercase mb-2">Aeterna Fine Auctions</h2>
          <h1 className="text-4xl font-[family-name:var(--font-playfair)] font-bold text-[#111111]">
            Lote Exclusivo • #402
          </h1>
        </div>
        <div className="flex items-center gap-3 bg-[#111111] text-[#FAF9F6] px-5 py-2 rounded-sm shadow-md">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-pulse"></span>
          <span className="text-sm font-semibold uppercase tracking-widest">Live Now</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* === LADO ESQUERDO: ITEM E LANCE === */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          
          <div className="aspect-[4/3] bg-white border border-[#E5E5E5] p-8 flex items-center justify-center shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-[#F9F9F9]"></div>
            <img 
              src="https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=1000&auto=format&fit=crop" 
              alt="Rolex Daytona Platinum" 
              className="w-full h-full object-contain mix-blend-multiply drop-shadow-2xl z-10 hover:scale-105 transition-transform duration-700"
            />
          </div>

          <div>
            <h3 className="text-3xl font-[family-name:var(--font-playfair)] font-bold mb-4">{auction.title}</h3>
            <p className="text-[#666666] leading-relaxed text-lg">{auction.description}</p>
          </div>

          {/* Painel Principal de Lances */}
          <div className="bg-[#111111] text-[#FAF9F6] p-8 rounded-sm shadow-2xl mt-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 blur-3xl rounded-full"></div>
            
            <div className="flex justify-between items-end mb-8 relative z-10">
              <div>
                <p className="text-[#A3A3A3] text-sm uppercase tracking-widest mb-1">Lance Mais Alto</p>
                <p className="text-5xl font-light font-[family-name:var(--font-playfair)] text-[#D4AF37]">
                  R$ {auction.currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[#A3A3A3] text-sm uppercase tracking-widest mb-1 flex items-center gap-2 justify-end">
                  <Clock size={14} /> Fim Previsto
                </p>
                <p className="text-xl text-[#FAF9F6] font-medium tracking-wide">
                  {format(new Date(auction.endsAt), "dd/MM 'às' HH:mm")}
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
                  placeholder={(auction.currentPrice + 500).toString()}
                  className="w-full bg-[#1A1A1A] border border-[#333] text-white px-12 py-4 rounded-sm focus:outline-none focus:border-[#D4AF37] transition-all text-xl placeholder:text-[#555]"
                />
              </div>
              <button type="submit" className="bg-[#D4AF37] hover:bg-[#E5C158] text-[#111111] px-10 py-4 font-bold tracking-widest uppercase transition-colors rounded-sm flex items-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:shadow-[0_0_25px_rgba(212,175,55,0.6)]">
                <Gavel size={20} /> Enviar Lance
              </button>
            </form>
            {error && <p className="text-red-400 mt-4 flex items-center gap-2 relative z-10 text-sm bg-red-900/20 p-2 border border-red-900/50"><AlertCircle size={16}/> {error}</p>}
          </div>
        </div>

        {/* === LADO DIREITO: GRÁFICOS E CHAT === */}
        <div className="lg:col-span-5 flex flex-col gap-8 h-full">
          
          {/* Gráfico Financeiro */}
          <div className="bg-white border border-[#E5E5E5] p-6 shadow-sm">
            <h3 className="text-xs font-bold tracking-widest text-[#999] uppercase mb-6 flex items-center gap-2">
              <TrendingUp size={14} className="text-[#D4AF37]" /> Dinâmica de Valorização (Real-Time)
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
                  <YAxis domain={['dataMin - 1000', 'auto']} tick={{ fontSize: 10, fill: '#A3A3A3' }} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${(val/1000).toFixed(1)}k`} width={50} />
                  <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff' }} itemStyle={{ color: '#D4AF37' }} />
                  <Area type="stepAfter" dataKey="price" stroke="#D4AF37" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chat / IA Feed */}
          <div className="bg-white border border-[#E5E5E5] flex flex-col flex-1 shadow-sm min-h-[450px]">
            <div className="p-5 border-b border-[#E5E5E5] flex justify-between items-center bg-[#FAFAFA]">
              <h3 className="text-xs font-bold tracking-widest text-[#111111] uppercase">Activity Feed</h3>
              <span className="text-xs font-semibold text-[#666] flex items-center gap-2">
                Conectado <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.6)]"></span>
              </span>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-5 bg-[#FDFDFC]">
              {events.length === 0 ? (
                <div className="flex-1 flex items-center justify-center opacity-50 flex-col gap-2">
                  <Clock size={24} className="text-[#D4AF37]" />
                  <p className="text-center text-[#999] text-sm italic font-[family-name:var(--font-playfair)]">Aguardando a abertura dos lances...</p>
                </div>
              ) : (
                events.map(ev => (
                  <div key={ev.id} className={`flex flex-col ${ev.isAi ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 fade-in duration-300`}>
                    <div className={`px-4 py-3 max-w-[85%] rounded-sm ${ev.isAi ? 'bg-[#111111] text-[#D4AF37] shadow-lg border border-[#333]' : 'bg-white text-[#333] border border-[#E5E5E5] shadow-sm'}`}>
                      <p className={`text-sm ${ev.isAi ? 'font-medium font-[family-name:var(--font-playfair)] text-base' : ''}`}>{ev.message}</p>
                    </div>
                    <span className="text-[10px] text-[#A3A3A3] mt-1.5 uppercase tracking-wider flex items-center gap-1 font-semibold">
                      {ev.isAi ? '🎙️ Leiloeiro (IA)' : <><User size={10}/> Participante</>} • {format(new Date(ev.timestamp), 'HH:mm:ss')}
                    </span>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
