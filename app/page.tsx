"use client";

import { useState } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { Plus, TrendingUp, TrendingDown, Route, Clock, Coins, Banknote, Calendar, Filter, User, Car, Bike, Truck, X } from "lucide-react";
import Link from "next/link";
import { useStore } from "@/store/use-store";

const getVehicleIcon = (type: string, className: string = "w-6 h-6") => {
  switch (type) {
    case 'bicicleta': return <Bike className={className} />;
    case 'moto': return <Bike className={className} />;
    case 'caminhao': return <Truck className={className} />;
    case 'carro':
    default: return <Car className={className} />;
  }
};

export default function Home() {
  const transactions = useStore((state) => state.transactions);
  const dailyGoal = useStore((state) => state.dailyGoal);
  const vehicles = useStore((state) => state.vehicles);
  const user = useStore((state) => state.user);
  
  const [filter, setFilter] = useState<"today" | "7days" | "month" | "custom">("today");
  const [vehicleFilter, setVehicleFilter] = useState<string>("all");
  
  const [showDateModal, setShowDateModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateError, setDateError] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteTransaction = useStore((state) => state.deleteTransaction);
  const categories = useStore((state) => state.categories);

  // Filter transactions based on selected period and vehicle
  const filteredTransactions = transactions.filter((t) => {
    // Vehicle Filter
    if (vehicleFilter !== "all" && t.vehicleId !== vehicleFilter) {
      return false;
    }

    // Date Filter
    const txDate = new Date(t.date);
    const today = new Date();
    
    if (filter === "today") {
      return txDate.toDateString() === today.toDateString();
    } else if (filter === "7days") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);
      return txDate >= sevenDaysAgo;
    } else if (filter === "month") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      return txDate >= thirtyDaysAgo;
    } else if (filter === "custom") {
      if (dateFrom && dateTo) {
        const from = new Date(dateFrom);
        // Ajusta para o início do dia no fuso horário local
        from.setMinutes(from.getMinutes() + from.getTimezoneOffset());
        from.setHours(0, 0, 0, 0);
        
        const to = new Date(dateTo);
        // Ajusta para o final do dia no fuso horário local
        to.setMinutes(to.getMinutes() + to.getTimezoneOffset());
        to.setHours(23, 59, 59, 999);
        
        return txDate >= from && txDate <= to;
      }
    }
    return true;
  });

  // Calculate totals
  const totalIncome = filteredTransactions
    .filter(t => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);
    
  const totalExpense = filteredTransactions
    .filter(t => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);
    
  const netProfit = totalIncome - totalExpense;
  
  const totalKm = filteredTransactions
    .reduce((acc, t) => acc + (t.km || 0), 0);
    
  const totalHours = filteredTransactions
    .reduce((acc, t) => acc + (t.hours || 0), 0);

  // Derived metrics
  const rsPerKm = totalKm > 0 ? (netProfit / totalKm) : 0;
  const rsPerHour = totalHours > 0 ? (netProfit / totalHours) : 0;
  
  // Goal progress
  const goalProgress = dailyGoal > 0 ? Math.min((netProfit / dailyGoal) * 100, 100) : 0;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Format hours
  const formatHours = (decimalHours: number) => {
    const h = Math.floor(decimalHours);
    const m = Math.round((decimalHours - h) * 60);
    return { h, m };
  };
  const { h: hoursH, m: hoursM } = formatHours(totalHours);

  return (
    <main className="flex-1 pb-24 relative">
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
        <h1 className="text-xl font-bold tracking-tight justify-self-center">Início</h1>
        
        {/* Floating Action Button in Header (Fixed) */}
        <div className="justify-self-end">
          <Link 
            href="/transactions/new"
            className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center shadow-md hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <div className="p-6 max-w-md mx-auto space-y-6">
        {/* Meta Diária (Só aparece na Home se houver meta definida) */}
        {dailyGoal > 0 && (
          <Link href="/goals/new" className="block bg-card p-5 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-foreground/60">Meta Diária ({formatCurrency(Math.max(0, netProfit))} / {formatCurrency(dailyGoal)})</span>
              <span className="text-sm font-bold">{goalProgress.toFixed(0)}%</span>
            </div>
            <div className="h-2 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-positive rounded-full transition-all duration-500" style={{ width: `${goalProgress}%` }}></div>
            </div>
          </Link>
        )}

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {vehicles.length > 0 && (
            <button 
              onClick={() => setShowVehicleModal(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                vehicleFilter !== "all" ? "bg-foreground text-background" : "bg-card border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              Veículos
            </button>
          )}
          <button 
            onClick={() => setFilter("today")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === "today" ? "bg-foreground text-background" : "bg-card border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Hoje
          </button>
          <button 
            onClick={() => setFilter("7days")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === "7days" ? "bg-foreground text-background" : "bg-card border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            7 dias
          </button>
          <button 
            onClick={() => setFilter("month")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === "month" ? "bg-foreground text-background" : "bg-card border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            30 dias
          </button>
          <button 
            onClick={() => setShowDateModal(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === "custom" ? "bg-foreground text-background" : "bg-card border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtro
          </button>
        </div>

        {/* Lucro Líquido */}
        <div className="bg-card p-5 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
          <h3 className="text-sm font-medium text-foreground/60 mb-1">Lucro Líquido</h3>
          <p className={`text-4xl font-bold tracking-tight ${netProfit < 0 ? 'text-negative' : ''}`}>
            {formatCurrency(netProfit)}
          </p>
        </div>

        {/* Dashboard Cards Grid (6 items now) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card p-4 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
            <div className="flex items-center gap-2 text-foreground/60 mb-2">
              <TrendingUp className="w-4 h-4 text-positive" />
              <span className="text-xs font-medium uppercase tracking-wider">Ganhos</span>
            </div>
            <p className="text-2xl font-bold text-positive">{formatCurrency(totalIncome)}</p>
          </div>
          
          <div className="bg-card p-4 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
            <div className="flex items-center gap-2 text-foreground/60 mb-2">
              <TrendingDown className="w-4 h-4 text-negative" />
              <span className="text-xs font-medium uppercase tracking-wider">Despesas</span>
            </div>
            <p className="text-2xl font-bold text-negative">{formatCurrency(totalExpense)}</p>
          </div>

          <div className="bg-card p-4 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
            <div className="flex items-center gap-2 text-foreground/60 mb-2">
              <Coins className="w-4 h-4 text-positive" />
              <span className="text-xs font-medium uppercase tracking-wider">R$ / KM</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(rsPerKm)}</p>
          </div>

          <div className="bg-card p-4 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
            <div className="flex items-center gap-2 text-foreground/60 mb-2">
              <Banknote className="w-4 h-4 text-positive" />
              <span className="text-xs font-medium uppercase tracking-wider">R$ / Hora</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(rsPerHour)}</p>
          </div>

          <div className="bg-card p-4 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
            <div className="flex items-center gap-2 text-foreground/60 mb-2">
              <Route className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider">KM Total</span>
            </div>
            <p className="text-2xl font-bold">{totalKm.toFixed(1)} <span className="text-sm text-foreground/60 font-medium">km</span></p>
          </div>

          <div className="bg-card p-4 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
            <div className="flex items-center gap-2 text-foreground/60 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Horas</span>
            </div>
            <p className="text-2xl font-bold">{hoursH}<span className="text-sm text-foreground/60 font-medium">h</span> {hoursM.toString().padStart(2, '0')}<span className="text-sm text-foreground/60 font-medium">m</span></p>
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <div className="pt-4">
          <h3 className="font-medium mb-4">Atividade Recente</h3>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-foreground/50 text-sm bg-card rounded-xl border border-black/5 dark:border-white/5 border-dashed">
              Nenhuma transação registrada neste período.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.slice(0, 5).map(t => (
                <button 
                  key={t.id} 
                  onClick={() => setSelectedTransaction(t)}
                  className="w-full flex items-center justify-between p-4 bg-card rounded-xl border border-black/5 dark:border-white/5 shadow-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      t.type === 'income' ? 'bg-positive/10 text-positive' : 'bg-negative/10 text-negative'
                    }`}>
                      {t.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold capitalize">{categories.find(c => c.id === t.category)?.label || t.category}</p>
                      <p className="text-xs text-foreground/50">{new Date(t.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <p className={`font-bold ${t.type === 'income' ? 'text-positive' : 'text-negative'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Filtro por Data */}
      {showDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-sm rounded-3xl p-6 space-y-6 shadow-xl border border-black/10 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Filtrar por Data</h3>
              <button onClick={() => { setShowDateModal(false); setDateError(""); }} className="p-2 bg-black/5 dark:bg-white/10 rounded-full hover:opacity-80 transition-opacity">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {dateError && (
              <div className="bg-negative/10 border border-negative/20 text-negative px-4 py-3 rounded-xl text-sm font-medium">
                {dateError}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/60">De:</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setDateError(""); }}
                  className="w-full bg-background border border-black/10 dark:border-white/10 rounded-xl p-4 font-medium outline-none focus:border-foreground transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/60">Para:</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setDateError(""); }}
                  className="w-full bg-background border border-black/10 dark:border-white/10 rounded-xl p-4 font-medium outline-none focus:border-foreground transition-colors"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => { setShowDateModal(false); setDateError(""); }}
                className="flex-1 bg-card border-2 border-black/5 dark:border-white/5 text-foreground py-4 rounded-xl font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  if (dateFrom && dateTo) {
                    setFilter("custom");
                    setShowDateModal(false);
                    setDateError("");
                  } else {
                    setDateError("Por favor, selecione as duas datas.");
                  }
                }}
                className="flex-1 bg-foreground text-background py-4 rounded-xl font-bold hover:opacity-90 transition-opacity"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Filtro por Veículo */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-sm rounded-3xl p-6 space-y-6 shadow-xl border border-black/10 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Filtrar por Veículo</h3>
              <button onClick={() => setShowVehicleModal(false)} className="p-2 bg-black/5 dark:bg-white/10 rounded-full hover:opacity-80 transition-opacity">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
              <button 
                onClick={() => { setVehicleFilter("all"); setShowVehicleModal(false); }}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  vehicleFilter === "all" 
                    ? "border-foreground bg-foreground/5" 
                    : "border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <div className="flex-1 text-left font-medium">Todos os Veículos</div>
              </button>
              {vehicles.map(v => (
                <button 
                  key={v.id}
                  onClick={() => { setVehicleFilter(v.id); setShowVehicleModal(false); }}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    vehicleFilter === v.id 
                      ? "border-foreground bg-foreground/5" 
                      : "border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    vehicleFilter === v.id ? "bg-foreground text-background" : "bg-black/5 dark:bg-white/10 text-foreground/60"
                  }`}>
                    {getVehicleIcon(v.type, "w-5 h-5")}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold">{v.name}</div>
                    <div className="text-xs text-foreground/50">{v.plate}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Opções do Lançamento */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-sm rounded-3xl p-6 space-y-6 shadow-xl border border-black/10 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Opções do Lançamento</h3>
              <button onClick={() => { setSelectedTransaction(null); setConfirmDelete(false); }} className="p-2 bg-black/5 dark:bg-white/10 rounded-full hover:opacity-80 transition-opacity">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground/60">Categoria</span>
                <span className="font-bold capitalize">{categories.find(c => c.id === selectedTransaction.category)?.label || selectedTransaction.category}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground/60">Valor</span>
                <span className={`font-bold ${selectedTransaction.type === 'income' ? 'text-positive' : 'text-negative'}`}>
                  {formatCurrency(selectedTransaction.amount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground/60">Data</span>
                <span className="font-bold">{new Date(selectedTransaction.date).toLocaleDateString('pt-BR')}</span>
              </div>
              {selectedTransaction.description && (
                <div className="pt-2 border-t border-black/5 dark:border-white/5">
                  <span className="text-sm text-foreground/60 block mb-1">Observação</span>
                  <span className="font-medium text-sm">{selectedTransaction.description}</span>
                </div>
              )}
            </div>

            {confirmDelete ? (
              <div className="space-y-3">
                <p className="text-center text-sm font-medium text-negative mb-2">Tem certeza que deseja excluir?</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 bg-card border-2 border-black/5 dark:border-white/5 text-foreground py-4 rounded-xl font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    Não
                  </button>
                  <button 
                    onClick={() => {
                      deleteTransaction(selectedTransaction.id);
                      setSelectedTransaction(null);
                      setConfirmDelete(false);
                    }}
                    className="flex-1 bg-negative text-white py-4 rounded-xl font-bold hover:opacity-90 transition-opacity"
                  >
                    Sim, Excluir
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <button 
                  onClick={() => setConfirmDelete(true)}
                  className="w-full bg-negative/10 text-negative py-4 rounded-xl font-bold hover:bg-negative/20 transition-colors"
                >
                  Excluir Lançamento
                </button>
                <button 
                  onClick={() => setSelectedTransaction(null)}
                  className="w-full bg-card border-2 border-black/5 dark:border-white/5 text-foreground py-4 rounded-xl font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
