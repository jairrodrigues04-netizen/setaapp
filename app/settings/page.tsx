"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { BottomNav } from "@/components/bottom-nav";
import { User } from "lucide-react";
import Link from "next/link";
import { useStore } from "@/store/use-store";

export default function SettingsPage() {
  const user = useStore((state) => state.user);

  return (
    <main className="flex-1 pb-24">
      <header className="bg-card p-4 sm:p-6 border-b border-black/5 dark:border-white/5 sticky top-0 z-10 grid grid-cols-3 items-center">
        <div className="justify-self-start">
          <Link 
            href="/profile"
            className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center border border-black/10 dark:border-white/10 hover:opacity-80 transition-opacity overflow-hidden"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-foreground/60" />
            )}
          </Link>
        </div>
        <h1 className="text-xl font-bold tracking-tight justify-self-center">Ajustes</h1>
        <div className="justify-self-end"></div>
      </header>
      
      <div className="p-6 max-w-md mx-auto space-y-8">
        <ThemeToggle />
        
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-medium">Dados</h3>
          <div className="bg-card rounded-xl border border-black/10 dark:border-white/10 overflow-hidden">
            <button className="w-full text-left p-4 border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              Fazer Backup Manual
            </button>
            <button className="w-full text-left p-4 border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              Restaurar Backup
            </button>
            <button className="w-full text-left p-4 text-negative hover:bg-negative/10 transition-colors">
              Limpar Todos os Dados
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
