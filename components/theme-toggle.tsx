"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setTimeout(() => setMounted(true), 0);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-medium">Aparência</h3>
      
      <div className="flex flex-col gap-3">
        <button
          onClick={() => setTheme("light")}
          className={`flex items-center justify-between p-4 rounded-xl border ${
            theme === "light" 
              ? "border-positive bg-positive/10" 
              : "border-black/10 dark:border-white/10 bg-card"
          }`}
        >
          <div className="flex items-center gap-3">
            <Sun className="w-5 h-5" />
            <span className="font-medium">Claro</span>
          </div>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            theme === "light" ? "border-positive" : "border-gray-400"
          }`}>
            {theme === "light" && <div className="w-2.5 h-2.5 rounded-full bg-positive" />}
          </div>
        </button>

        <button
          onClick={() => setTheme("dark")}
          className={`flex items-center justify-between p-4 rounded-xl border ${
            theme === "dark" 
              ? "border-positive bg-positive/10" 
              : "border-black/10 dark:border-white/10 bg-card"
          }`}
        >
          <div className="flex items-center gap-3">
            <Moon className="w-5 h-5" />
            <span className="font-medium">Escuro</span>
          </div>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            theme === "dark" ? "border-positive" : "border-gray-400"
          }`}>
            {theme === "dark" && <div className="w-2.5 h-2.5 rounded-full bg-positive" />}
          </div>
        </button>

        <button
          onClick={() => setTheme("system")}
          className={`flex items-center justify-between p-4 rounded-xl border ${
            theme === "system" 
              ? "border-positive bg-positive/10" 
              : "border-black/10 dark:border-white/10 bg-card"
          }`}
        >
          <div className="flex items-center gap-3">
            <Monitor className="w-5 h-5" />
            <span className="font-medium">Usar tema do sistema</span>
          </div>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            theme === "system" ? "border-positive" : "border-gray-400"
          }`}>
            {theme === "system" && <div className="w-2.5 h-2.5 rounded-full bg-positive" />}
          </div>
        </button>
      </div>
    </div>
  );
}
