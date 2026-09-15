"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin ? { email, password } : { name, email, password };

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Erro na autenticação');
        return;
      }
      
      // Em produção, isso seria um HttpOnly Cookie + NextAuth. 
      // Para portfólio rápido, o localStorage funciona perfeitamente como sessão.
      localStorage.setItem('user', JSON.stringify(data.user || data));
      router.push('/');
    } catch (err) {
      setError('Falha ao conectar com o servidor.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex">
      {/* Lado do Formulário */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 relative">
        <div className="absolute top-12 left-12">
          <h2 className="text-sm font-bold tracking-widest text-[#D4AF37] uppercase mb-2">Aeterna</h2>
        </div>
        
        <div className="w-full max-w-md bg-white p-12 shadow-2xl border border-[#E5E5E5] animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-[family-name:var(--font-playfair)] font-bold text-[#111111]">
              {isLogin ? 'Acesse o Salão' : 'Torne-se Membro'}
            </h1>
            <p className="text-[#666] text-sm mt-3">
              {isLogin ? 'Bem-vindo de volta à nossa casa de leilões exclusiva.' : 'Junte-se ao seleto grupo de colecionadores.'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 mb-6 text-sm flex items-center gap-3 border border-red-100 font-medium">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {!isLogin && (
              <div>
                <label className="block text-xs uppercase tracking-widest text-[#666] mb-2 font-semibold">Nome Completo</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-[#FAF9F6] border border-[#E5E5E5] px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-colors" />
              </div>
            )}
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#666] mb-2 font-semibold">E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-[#FAF9F6] border border-[#E5E5E5] px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-colors" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#666] mb-2 font-semibold">Senha</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-[#FAF9F6] border border-[#E5E5E5] px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-colors" />
            </div>
            
            <button type="submit" className="w-full bg-[#111111] text-[#D4AF37] py-4 uppercase tracking-widest font-bold mt-2 hover:bg-[#222] transition-colors shadow-lg">
              {isLogin ? 'Entrar' : 'Registrar'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-sm text-[#999] hover:text-[#111] transition-colors">
              {isLogin ? 'Não possui uma conta? Registre-se' : 'Já é membro? Faça login'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Lado da Imagem Decorativa (Apenas Desktop) */}
      <div className="hidden lg:block flex-1 bg-[url('https://images.unsplash.com/photo-1549488344-c1fa970104f9?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center border-l border-[#D4AF37]/30 relative">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <p className="font-[family-name:var(--font-playfair)] text-4xl italic leading-relaxed">
            "A verdadeira arte de colecionar não reside no objeto, mas na história que ele carrega."
          </p>
        </div>
      </div>
    </div>
  );
}

