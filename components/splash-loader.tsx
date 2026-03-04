"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function SplashLoader() {
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    // Sempre que a rota mudar, mostra o loader por um breve momento
    setTimeout(() => setLoading(true), 0);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 100); // 100ms de carregamento simulado

    return () => clearTimeout(timer);
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center animate-in fade-in duration-200">
      <div className="relative w-24 h-24 flex items-center justify-center">
        
        {/* Círculo Externo (Gira para a direita) */}
        <svg 
          className="absolute inset-0 w-full h-full animate-[spin_1.5s_linear_infinite] text-foreground" 
          viewBox="0 0 100 100"
        >
          {/* Linha circular */}
          <path 
            d="M 50 10 A 40 40 0 1 1 10 50" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="4" 
            strokeLinecap="round" 
          />
          {/* Ponta da Seta */}
          <polygon points="10,50 0,35 20,35" fill="currentColor" />
        </svg>

        {/* Círculo Interno (Gira para a esquerda) */}
        <svg 
          className="absolute inset-2 w-20 h-20 animate-[spin_1.5s_linear_infinite_reverse] text-foreground/40" 
          viewBox="0 0 100 100"
        >
          {/* Linha circular */}
          <path 
            d="M 50 90 A 40 40 0 1 1 90 50" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="4" 
            strokeLinecap="round" 
          />
          {/* Ponta da Seta */}
          <polygon points="90,50 100,65 80,65" fill="currentColor" />
        </svg>

        {/* Letra S no Centro */}
        <span className="text-4xl font-black text-foreground z-10">S</span>
      </div>
    </div>
  );
}
