"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { useStore } from "@/store/use-store";

export default function NewGoalPage() {
  const router = useRouter();
  const setDailyGoal = useStore((state) => state.setDailyGoal);
  const currentGoal = useStore((state) => state.dailyGoal);
  
  const [amount, setAmount] = useState(currentGoal > 0 ? currentGoal.toFixed(2) : "");
  const [error, setError] = useState("");

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value) {
      value = (parseInt(value) / 100).toFixed(2);
      setAmount(value);
    } else {
      setAmount("");
    }
  };

  const handleSave = () => {
    setError("");
    let numAmount = parseFloat(amount.replace(",", "."));
    if (isNaN(numAmount)) {
      numAmount = 0;
    }
    if (numAmount < 0) {
      setError("Por favor, insira um valor válido para a meta.");
      return;
    }

    setDailyGoal(numAmount);
    router.push("/");
  };

  return (
    <main className="flex-1 pb-24 bg-background min-h-screen">
      <header className="bg-card p-6 border-b border-black/5 dark:border-white/5 sticky top-0 z-10 flex items-center gap-4">
        <Link 
          href="/transactions/new" 
          className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Meta Diária</h1>
      </header>

      <div className="p-6 max-w-md mx-auto space-y-8">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground/60">Valor da Meta</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-positive">
              R$
            </span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={handleAmountChange}
              className="w-full bg-card border-2 border-positive/20 focus:border-positive text-positive rounded-2xl py-4 pl-14 pr-4 text-3xl font-bold outline-none transition-colors"
            />
          </div>
          <p className="text-xs text-foreground/50 pt-2">
            Esta meta será vinculada à data de hoje e aparecerá no seu painel inicial.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-negative/10 border border-negative/20 text-negative px-4 py-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <div className="pt-2 space-y-3">
          <button 
            onClick={handleSave}
            className="w-full bg-positive text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md"
          >
            <Check className="w-5 h-5" />
            Salvar Meta
          </button>
          
          {currentGoal > 0 && (
            <button 
              onClick={() => {
                setDailyGoal(0);
                router.push("/");
              }}
              className="w-full bg-card border-2 border-negative/20 text-negative py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-negative/5 transition-colors"
            >
              Remover Meta
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
