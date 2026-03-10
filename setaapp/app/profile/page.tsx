"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Key, LogOut, Car, PieChart, Settings, ChevronRight, User } from "lucide-react";
import { useStore } from "@/store/use-store";
import { auth, db } from "@/lib/firebase"; // Importamos o db
import { signOut } from "firebase/auth";
import { useRef, useState } from "react"; // Adicionamos useState
import { doc, updateDoc } from "firebase/firestore"; // Importamos funções do Firestore

export default function ProfilePage() {
  const router = useRouter();
  const user = useStore((state: any) => state.user);
  const setUser = useStore((state: any) => state.setUser);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false); // Estado para feedback visual

  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
      setUser(null);
      router.push("/login");
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user?.id) {
      setUploading(true);
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 300; // Tamanho ideal de avatar
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6); // Bem leve
          
          try {
            // SALVA NO FIRESTORE (Campo avatar conforme seu original)
            await updateDoc(doc(db as any, "users", user.id), { 
              avatar: compressedBase64 
            });

            // ATUALIZA O ZUSTAND
            setUser({ ...user, avatar: compressedBase64 });
            setUploading(false);
          } catch (error) {
            console.error(error);
            setUploading(false);
          }
        };
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <main className="flex-1 pb-24 bg-background min-h-screen">
      <header className="bg-card p-6 border-b border-black/5 dark:border-white/5 sticky top-0 z-10 flex items-center gap-4">
        <Link 
          href="/" 
          className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Meu Perfil</h1>
      </header>

      <div className="p-6 max-w-md mx-auto space-y-8">
        
        {/* Foto e Info do Usuário */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-black/5 dark:bg-white/10 border-4 border-card shadow-sm flex items-center justify-center overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className={`w-full h-full object-cover ${uploading ? 'opacity-50' : ''}`} />
              ) : (
                <User className="w-10 h-10 text-foreground/40" />
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={`absolute bottom-0 right-0 w-8 h-8 bg-foreground text-background rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform ${uploading ? 'animate-pulse' : ''}`}
            >
              <Camera className="w-4 h-4" />
            </button>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
            />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold">{user?.name || "Motorista Parceiro"}</h2>
            <p className="text-sm text-foreground/60">{user?.email || "motorista@difx.com.br"}</p>
          </div>
        </div>

        {/* Conta */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-foreground/50 uppercase tracking-wider px-2">Conta</h3>
          <div className="bg-card rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden shadow-sm">
            <button className="w-full flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center">
                  <Key className="w-4 h-4 text-foreground/70" />
                </div>
                <span className="font-medium">Trocar Senha</span>
              </div>
              <ChevronRight className="w-5 h-5 text-foreground/30" />
            </button>
          </div>
        </div>

        {/* Atalhos do App */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-foreground/50 uppercase tracking-wider px-2">Aplicativo</h3>
          <div className="bg-card rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden shadow-sm">
            <Link href="/vehicles" className="w-full flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center">
                  <Car className="w-4 h-4 text-foreground/70" />
                </div>
                <span className="font-medium">Veículos</span>
              </div>
              <ChevronRight className="w-5 h-5 text-foreground/30" />
            </Link>
            
            <Link href="/reports" className="w-full flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center">
                  <PieChart className="w-4 h-4 text-foreground/70" />
                </div>
                <span className="font-medium">Relatórios</span>
              </div>
              <ChevronRight className="w-5 h-5 text-foreground/30" />
            </Link>

            <Link href="/settings" className="w-full flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-foreground/70" />
                </div>
                <span className="font-medium">Ajustes</span>
              </div>
              <ChevronRight className="w-5 h-5 text-foreground/30" />
            </Link>
          </div>
        </div>

        {/* Sair */}
        <div className="pt-4">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-negative/20 text-negative font-bold hover:bg-negative/5 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sair do Aplicativo
          </button>
        </div>

      </div>
    </main>
  );
}