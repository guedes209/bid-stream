"use client";

import React, { useState, useRef } from 'react';
import { Upload, Sparkles, AlertCircle, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function CreateAuctionPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startingPrice, setStartingPrice] = useState<number | ''>('');
  const [endsAt, setEndsAt] = useState('');

  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);

  React.useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      router.push('/login');
    } else {
      setCurrentUser(JSON.parse(stored));
    }
  }, [router]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeAI = async () => {
    if (!imagePreview) {
        setError('Por favor, faça o upload de uma imagem primeiro.');
        return;
    }
    
    setIsAnalyzing(true);
    setError('');
    
    try {
      const res = await fetch(`${API_URL}/api/ai/analyze-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: imagePreview,
          mimeType: 'image/jpeg',
          hint: 'Item de luxo exclusivo'
        })
      });

      if (!res.ok) throw new Error('Falha ao analisar a imagem pela API.');

      const data = await res.json();
      setTitle(data.title || '');
      setDescription(data.description || '');
      setStartingPrice(data.startingPrice || '');
    } catch (err: any) {
      setError(err.message || 'Erro inesperado ao falar com o Gemini Vision.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    try {
      const res = await fetch(`${API_URL}/api/auctions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: currentUser.id,
          title,
          description,
          imageUrl: imagePreview,
          startingPrice: Number(startingPrice),
          endsAt: new Date(endsAt).toISOString()
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao criar leilão');
      }

      router.push('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111111] py-12 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 border-b border-[#D4AF37]/30 pb-6">
          <button onClick={() => router.push('/')} className="mb-6 text-[#999] hover:text-[#111] uppercase tracking-widest text-[10px] font-bold flex items-center gap-2 transition-colors">
            <ArrowLeft size={14}/> Voltar ao Dashboard
          </button>
          <h2 className="text-sm font-bold tracking-widest text-[#D4AF37] uppercase mb-2">Curadoria VIP</h2>
          <h1 className="text-4xl font-[family-name:var(--font-playfair)] font-bold text-[#111111]">
            Anunciar Nova Peça
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Lado Esquerdo: Upload e IA */}
          <div className="flex flex-col gap-6">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`aspect-square w-full border-2 border-dashed ${imagePreview ? 'border-[#D4AF37]' : 'border-[#E5E5E5] hover:border-[#999]'} bg-white flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden group`}
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-contain p-4 mix-blend-multiply" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white font-semibold tracking-widest uppercase text-sm flex items-center gap-2"><Upload size={16}/> Trocar Foto</p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-[#999] gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#FAFAFA] flex items-center justify-center border border-[#E5E5E5]">
                    <ImageIcon size={24} className="text-[#666]" />
                  </div>
                  <p className="font-[family-name:var(--font-playfair)] text-lg">Clique para anexar a foto oficial</p>
                  <p className="text-xs uppercase tracking-widest text-[#A3A3A3]">Formatos suportados: JPG, PNG</p>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
            </div>

            <button 
              onClick={handleAnalyzeAI}
              type="button"
              disabled={!imagePreview || isAnalyzing}
              className="w-full bg-[#111111] disabled:bg-[#333] hover:bg-[#222] text-[#D4AF37] disabled:text-[#777] p-5 font-bold tracking-widest uppercase transition-colors rounded-sm flex items-center justify-center gap-3 shadow-lg"
            >
              {isAnalyzing ? (
                <><span className="w-4 h-4 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin"></span> Analisando Detalhes da Peça...</>
              ) : (
                <><Sparkles size={18} /> Gerar Copy com IA (Gemini Vision)</>
              )}
            </button>

            {error && (
              <p className="text-red-500 text-sm flex items-center gap-2 bg-red-50 p-4 border border-red-100">
                <AlertCircle size={16}/> {error}
              </p>
            )}
          </div>

          {/* Lado Direito: Formulário */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-white p-8 border border-[#E5E5E5] shadow-sm relative">
            {isAnalyzing && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-4">
                <Sparkles size={32} className="text-[#D4AF37] animate-pulse" />
                <div className="text-center animate-pulse text-[#111111] font-[family-name:var(--font-playfair)] text-xl">
                  A IA está escrevendo o anúncio perfeito...
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-[#999] text-[10px] uppercase tracking-widest font-bold mb-2">Título da Peça</label>
              <input 
                type="text" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className="w-full border-b-2 border-[#E5E5E5] focus:border-[#D4AF37] py-3 bg-transparent text-2xl font-[family-name:var(--font-playfair)] focus:outline-none transition-colors text-[#111]" 
                placeholder="Ex: Rolex Daytona Clássico"
              />
            </div>

            <div>
              <label className="block text-[#999] text-[10px] uppercase tracking-widest font-bold mb-2">História / Copywriting</label>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
                rows={8}
                className="w-full border border-[#E5E5E5] focus:border-[#D4AF37] p-5 bg-[#FAFAFA] text-base text-[#444] focus:outline-none transition-colors resize-none leading-relaxed" 
                placeholder="Conte a história e os detalhes que valorizam esta peça de luxo..."
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[#999] text-[10px] uppercase tracking-widest font-bold mb-2">Lance Inicial (R$)</label>
                <input 
                  type="number" 
                  value={startingPrice}
                  onChange={e => setStartingPrice(Number(e.target.value))}
                  required
                  className="w-full border-b-2 border-[#E5E5E5] focus:border-[#D4AF37] py-3 bg-transparent text-xl font-semibold text-[#111] focus:outline-none transition-colors" 
                />
              </div>
              <div>
                <label className="block text-[#999] text-[10px] uppercase tracking-widest font-bold mb-2">Data de Término</label>
                <input 
                  type="datetime-local" 
                  value={endsAt}
                  onChange={e => setEndsAt(e.target.value)}
                  required
                  className="w-full border-b-2 border-[#E5E5E5] focus:border-[#D4AF37] py-3 bg-transparent text-sm font-semibold text-[#111] focus:outline-none transition-colors" 
                />
              </div>
            </div>

            <button type="submit" className="mt-8 w-full bg-[#D4AF37] hover:bg-[#E5C158] text-[#111] p-5 font-bold tracking-widest uppercase transition-colors rounded-sm shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_20px_rgba(212,175,55,0.5)]">
              Aprovar e Publicar Leilão Oficial
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

