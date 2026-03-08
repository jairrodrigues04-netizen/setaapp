"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Plus, Target, X, Edit2, ChevronDown } from "lucide-react";
import { useStore } from "@/store/use-store";

export default function NewTransactionPage() {
  const router = useRouter();
  const addTransaction = useStore((state) => state.addTransaction);
  const vehicles = useStore((state) => state.vehicles);
  const dailyGoal = useStore((state) => state.dailyGoal);
  const transactions = useStore((state) => state.transactions);
  const categories = useStore((state) => state.categories);
  const addCategory = useStore((state) => state.addCategory);
  const updateCategory = useStore((state) => state.updateCategory);
  const deleteCategory = useStore((state) => state.deleteCategory);
  const activeVehicle = vehicles.find(v => v.isActive);

  const [type, setType] = useState<"income" | "expense">("income");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("uber");
  const [description, setDescription] = useState("");
  const [km, setKm] = useState("");
  const [hours, setHours] = useState("");
  // Get today's date in local timezone for the default input value
  const getLocalTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState(getLocalTodayString());
  const [error, setError] = useState("");

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const activeCategories = categories.filter(c => c.type === type);

  // Handle numeric input formatting
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value) {
      value = (parseInt(value) / 100).toFixed(2);
      setAmount(value);
    } else {
      setAmount("");
    }
  };

  // Calculate today's net profit for the goal progress
  const today = new Date().toDateString();
  const todaysTransactions = transactions.filter(t => new Date(t.date).toDateString() === today);
  const totalIncome = todaysTransactions.filter(t => t.type === "income").reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = todaysTransactions.filter(t => t.type === "expense").reduce((acc, t) => acc + t.amount, 0);
  const netProfit = totalIncome - totalExpense;
  const goalProgress = dailyGoal > 0 ? Math.min((netProfit / dailyGoal) * 100, 100) : 0;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleSave = () => {
    setError("");
    const numAmount = parseFloat(amount.replace(",", "."));
    if (!numAmount || numAmount <= 0) {
      setError("Por favor, insira um valor válido.");
      return;
    }

    if (!category) {
      setError("Por favor, selecione uma categoria.");
      return;
    }

    if (!date) {
      setError("Por favor, selecione uma data.");
      return;
    }

    if (type === "income") {
      if (!km) {
        setError("Por favor, preencha a quilometragem.");
        return;
      }
      if (!hours) {
        setError("Por favor, preencha as horas trabalhadas.");
        return;
      }
    }

    // Create a date object from the selected date string (YYYY-MM-DD)
    // We add the current time to it so it's not always midnight
    const now = new Date();
    const [year, month, day] = date.split('-').map(Number);
    const transactionDate = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());

    addTransaction({
      type,
      amount: numAmount,
      category,
      description,
      date: transactionDate.toISOString(),
      vehicleId: activeVehicle?.id,
      km: type === "income" && km ? parseFloat(km) : undefined,
      hours: type === "income" && hours ? parseFloat(hours) : undefined,
    });

    router.push("/");
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
        <h1 className="text-2xl font-bold tracking-tight">Novo Lançamento</h1>
      </header>

      <div className="p-6 max-w-md mx-auto space-y-8">
        
        {/* Meta Diária */}
        <Link href="/goals/new" className="block bg-card p-5 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-foreground/60">
              Meta Diária ({formatCurrency(dailyGoal > 0 ? Math.max(0, netProfit) : 0)} / {formatCurrency(dailyGoal || 0)})
            </span>
            <span className="text-sm font-bold">{goalProgress.toFixed(0)}%</span>
          </div>
          <div className="h-2 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-positive rounded-full transition-all duration-500" style={{ width: `${goalProgress}%` }}></div>
          </div>
        </Link>

        {/* Type Toggle */}
        <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-xl">
          <button
            onClick={() => { 
              setType("income"); 
              const firstIncome = categories.find(c => c.type === "income");
              setCategory(firstIncome?.id || ""); 
            }}
            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${
              type === "income" 
                ? "bg-card text-positive shadow-sm" 
                : "text-foreground/60 hover:text-foreground"
            }`}
          >
            GANHO
          </button>
          <button
            onClick={() => { 
              setType("expense"); 
              const firstExpense = categories.find(c => c.type === "expense");
              setCategory(firstExpense?.id || ""); 
            }}
            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${
              type === "expense" 
                ? "bg-card text-negative shadow-sm" 
                : "text-foreground/60 hover:text-foreground"
            }`}
          >
            DESPESA
          </button>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground/60">Valor</label>
          <div className="relative">
            <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold ${
              type === "income" ? "text-positive" : "text-negative"
            }`}>
              R$
            </span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={handleAmountChange}
              className={`w-full bg-card border-2 rounded-2xl py-4 pl-14 pr-4 text-3xl font-bold outline-none transition-colors ${
                type === "income" 
                  ? "border-positive/20 focus:border-positive text-positive" 
                  : "border-negative/20 focus:border-negative text-negative"
              }`}
            />
          </div>
        </div>

        {/* Category Dropdown */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground/60">Categoria</label>
          <button
            onClick={() => setShowCategoryModal(true)}
            className="w-full bg-card border border-black/10 dark:border-white/10 rounded-xl p-4 font-medium flex items-center justify-between outline-none focus:border-foreground transition-colors"
          >
            <span>{activeCategories.find(c => c.id === category)?.label || "Selecione uma categoria"}</span>
            <ChevronDown className="w-5 h-5 text-foreground/60" />
          </button>
        </div>

        {/* Date Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground/60">Data</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-card border border-black/10 dark:border-white/10 rounded-xl p-4 font-medium outline-none focus:border-foreground transition-colors"
          />
        </div>

        {/* KM and Hours (Only for Income) */}
        {type === "income" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/60">KM Rodados</label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="Ex: 120.5"
                value={km}
                onChange={(e) => setKm(e.target.value)}
                className="w-full bg-card border border-black/10 dark:border-white/10 rounded-xl p-4 font-medium outline-none focus:border-foreground transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/60">Horas Trabalhadas</label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="Ex: 8.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full bg-card border border-black/10 dark:border-white/10 rounded-xl p-4 font-medium outline-none focus:border-foreground transition-colors"
              />
            </div>
          </div>
        )}

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground/60">Observação <span className="text-xs opacity-70">(Opcional)</span></label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Corrida para o aeroporto"
            className="w-full bg-card border border-black/10 dark:border-white/10 rounded-xl p-4 font-medium outline-none focus:border-foreground transition-colors"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-negative/10 border border-negative/20 text-negative px-4 py-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {/* Save Button */}
        <div className="pt-2">
          <button 
            onClick={handleSave}
            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-white shadow-md transition-opacity hover:opacity-90 ${
            type === "income" ? "bg-positive" : "bg-negative"
          }`}>
            <Check className="w-5 h-5" />
            Salvar {type === "income" ? "Ganho" : "Despesa"}
          </button>
        </div>

      </div>

      {/* Modal de Categorias */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-sm rounded-3xl p-6 space-y-6 shadow-xl border border-black/10 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Gerenciar Categorias</h3>
              <button onClick={() => { setShowCategoryModal(false); setEditingCategoryId(null); }} className="p-2 bg-black/5 dark:bg-white/10 rounded-full hover:opacity-80 transition-opacity">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Adicionar Nova */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nova categoria..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 bg-background border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 font-medium outline-none focus:border-foreground transition-colors"
              />
              <button 
                onClick={() => {
                  if (newCategoryName.trim()) {
                    addCategory({ label: newCategoryName.trim(), type });
                    setNewCategoryName("");
                  }
                }}
                className="bg-foreground text-background px-4 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Lista de Categorias */}
            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
              {activeCategories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-background rounded-xl border border-black/5 dark:border-white/5">
                  {editingCategoryId === cat.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editCategoryName}
                        onChange={(e) => setEditCategoryName(e.target.value)}
                        className="flex-1 bg-card border border-black/10 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm font-medium outline-none focus:border-foreground"
                        autoFocus
                      />
                      <button 
                        onClick={() => {
                          if (editCategoryName.trim()) {
                            updateCategory(cat.id, { label: editCategoryName.trim() });
                          }
                          setEditingCategoryId(null);
                        }}
                        className="p-1.5 bg-positive/10 text-positive rounded-lg hover:bg-positive/20"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button 
                        onClick={() => {
                          setCategory(cat.id);
                          setShowCategoryModal(false);
                        }}
                        className={`font-medium flex-1 text-left px-2 py-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors ${
                          category === cat.id 
                            ? type === "income" ? "text-positive" : "text-negative"
                            : ""
                        }`}
                      >
                        {cat.label}
                      </button>
                      {confirmDeleteId === cat.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-negative font-medium">Excluir?</span>
                          <button 
                            onClick={() => {
                              deleteCategory(cat.id);
                              if (category === cat.id) {
                                const remainingCategories = activeCategories.filter(c => c.id !== cat.id);
                                setCategory(remainingCategories.length > 0 ? remainingCategories[0].id : "");
                              }
                              setConfirmDeleteId(null);
                            }}
                            className="p-1.5 bg-negative/10 text-negative rounded-lg hover:bg-negative/20 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setConfirmDeleteId(null)}
                            className="p-1.5 bg-black/5 dark:bg-white/10 text-foreground/60 rounded-lg hover:text-foreground transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => {
                              setEditingCategoryId(cat.id);
                              setEditCategoryName(cat.label);
                            }}
                            className="p-2 text-foreground/60 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setConfirmDeleteId(cat.id)}
                            className="p-2 text-negative/70 hover:text-negative hover:bg-negative/10 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
