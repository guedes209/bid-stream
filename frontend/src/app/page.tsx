"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Gavel, User, LogOut, Plus } from 'lucide-react';
import { format } from 'date-fns';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Auction {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  currentPrice: number;
  endsAt: string;
}

export default function DashboardPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(storedUser));

    // Buscar os leilões do banco populado
    fetch(`${API_URL}/api/auctions`)
      .then(res => res.json())
      .then(data => setAuctions(data))
      .catch(err => console.error(err));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) return null; // Evita "flash" da tela enquanto redireciona

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-12 pb-24 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-[#E5E5E5] pb-6 mb-12 gap-4">
          <div>
            <h2 className="text-sm font-bold tracking-widest text-[#D4AF37] uppercase mb-2">Private Collection</h2>
            <h1 className="text-4xl font-[family-name:var(--font-playfair)] font-bold text-[#111111]">
              Salão de Leilões
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button 
              onClick={() => router.push('/create')} 
              className="bg-[#D4AF37] hover:bg-[#E5C158] text-[#111] px-6 py-3 uppercase tracking-widest text-xs font-bold transition-colors shadow-sm flex items-center gap-2"
            >
              <Plus size={16}/> Anunciar Peça
            </button>
            <div className="flex items-center gap-6 bg-white border border-[#E5E5E5] px-6 py-3 shadow-sm">
              <span className="text-[#666] flex items-center gap-2 text-sm font-medium">
                <User size={16} className="text-[#D4AF37]" /> Bem-vindo, {user.name.split(' ')[0]}
              </span>
              <div className="w-[1px] h-4 bg-[#E5E5E5]"></div>
              <button onClick={handleLogout} className="text-xs uppercase tracking-widest font-bold text-[#999] hover:text-[#111] transition-colors flex items-center gap-1">
                <LogOut size={14}/> Sair
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {auctions.map((auction, idx) => (
            <div key={auction.id} className="bg-white border border-[#E5E5E5] shadow-sm hover:shadow-2xl transition-all duration-500 group flex flex-col h-full animate-in fade-in slide-in-from-bottom-8" style={{ animationDelay: `${idx * 100}ms` }}>
              <div className="aspect-[4/3] bg-[#F9F9F9] border-b border-[#E5E5E5] p-8 flex items-center justify-center overflow-hidden relative">
                {/* Badge Status */}
                <div className="absolute top-4 right-4 bg-[#111] text-[#D4AF37] text-[10px] uppercase tracking-widest font-bold px-3 py-1 shadow-md">
                  Lote #{idx + 1}
                </div>
                
                {/* Imagens Dinâmicas com base no título */}
                <img 
                  src={auction.imageUrl || (auction.title.includes('Rolex') 
                    ? 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=600&auto=format&fit=crop' 
                    : auction.title.includes('MacBook')
                    ? 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=600&auto=format&fit=crop'
                    : 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=600&auto=format&fit=crop')
                  }
                  alt={auction.title}
                  className="object-contain w-full h-full mix-blend-multiply group-hover:scale-110 transition-transform duration-700"
                />
              </div>
              
              <div className="p-8 flex flex-col flex-1">
                <h3 className="font-[family-name:var(--font-playfair)] font-bold text-2xl mb-3 line-clamp-1">{auction.title}</h3>
                <p className="text-[#666] text-sm line-clamp-2 leading-relaxed flex-1">{auction.description}</p>
                
                <div className="flex justify-between items-end pt-8 mt-6 border-t border-[#F0F0F0] mb-8">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[#999] mb-1">Lance Atual</p>
                    <p className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#D4AF37]">
                      R$ {auction.currentPrice.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-[#999] mb-1 flex items-center gap-1 justify-end"><Clock size={10}/> Fim em</p>
                    <p className="text-sm font-medium text-[#111]">{format(new Date(auction.endsAt), "dd/MM 'às' HH:mm")}</p>
                  </div>
                </div>

                <button 
                  onClick={() => router.push(`/auction/${auction.id}`)}
                  className="w-full bg-[#111] text-[#FAF9F6] py-4 uppercase tracking-widest text-xs font-bold hover:bg-[#D4AF37] hover:text-[#111] transition-colors flex items-center justify-center gap-2"
                >
                  <Gavel size={16}/> Ingressar no Leilão
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {auctions.length === 0 && (
          <div className="text-center py-32 border border-[#E5E5E5] bg-white">
            <p className="text-[#999] text-lg font-[family-name:var(--font-playfair)] italic">O salão de leilões está vazio no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
