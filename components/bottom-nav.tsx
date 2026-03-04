import Link from "next/link";
import { Home, Settings, Car, PieChart } from "lucide-react";

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-black/5 dark:border-white/5 pb-safe">
      <div className="flex items-center justify-around p-3">
        <Link href="/" className="flex flex-col items-center gap-1 p-2 text-foreground/60 hover:text-foreground">
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium">Início</span>
        </Link>
        <Link href="/vehicles" className="flex flex-col items-center gap-1 p-2 text-foreground/60 hover:text-foreground">
          <Car className="w-6 h-6" />
          <span className="text-[10px] font-medium">Veículos</span>
        </Link>
        <Link href="/reports" className="flex flex-col items-center gap-1 p-2 text-foreground/60 hover:text-foreground">
          <PieChart className="w-6 h-6" />
          <span className="text-[10px] font-medium">Relatórios</span>
        </Link>
        <Link href="/settings" className="flex flex-col items-center gap-1 p-2 text-foreground/60 hover:text-foreground">
          <Settings className="w-6 h-6" />
          <span className="text-[10px] font-medium">Ajustes</span>
        </Link>
      </div>
    </nav>
  );
}
