"use client";

import { useState } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { Calendar, Filter, Download, User, TrendingUp, TrendingDown, Car, Bike, Truck, X, FileText, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import { useStore } from "@/store/use-store";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

const getVehicleIcon = (type: string, className: string = "w-6 h-6") => {
  switch (type) {
    case 'bicicleta': return <Bike className={className} />;
    case 'moto': return <Bike className={className} />;
    case 'caminhao': return <Truck className={className} />;
    case 'carro':
    default: return <Car className={className} />;
  }
};

export default function ReportsPage() {
  const transactions = useStore((state) => state.transactions);
  const vehicles = useStore((state) => state.vehicles);
  const user = useStore((state) => state.user);
  
  const [filter, setFilter] = useState<"today" | "week" | "month" | "custom">("month");
  const [vehicleFilter, setVehicleFilter] = useState<string>("all");
  
  const [showDateModal, setShowDateModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateError, setDateError] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const deleteTransaction = useStore((state) => state.deleteTransaction);
  const categories = useStore((state) => state.categories);

  // Filter transactions based on selected period
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
    } else if (filter === "week") {
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
        from.setMinutes(from.getMinutes() + from.getTimezoneOffset());
        from.setHours(0, 0, 0, 0);
        
        const to = new Date(dateTo);
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

  const totalKm = filteredTransactions.reduce((acc, t) => acc + (t.km || 0), 0);
  const totalHours = filteredTransactions.reduce((acc, t) => acc + (t.hours || 0), 0);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Group transactions by date
  const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
    const date = new Date(transaction.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, typeof transactions>);

  const handleDownload = () => {
    if (filteredTransactions.length === 0) return;

    const headers = ["Data", "Tipo", "Categoria", "Valor", "Veículo", "Descrição"];
    
    const csvContent = [
      headers.join(";"),
      ...filteredTransactions.map(t => {
        const date = new Date(t.date).toLocaleDateString('pt-BR');
        const type = t.type === 'income' ? 'Entrada' : 'Saída';
        const category = categories.find(c => c.id === t.category)?.label || t.category || 'Sem categoria';
        const amount = t.amount.toFixed(2).replace('.', ',');
        const vehicle = vehicles.find(v => v.id === t.vehicleId)?.name || 'Nenhum';
        const description = t.description ? `"${t.description.replace(/"/g, '""')}"` : '';
        
        return `${date};${type};${category};${amount};${vehicle};${description}`;
      })
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `extrato_${filter}_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowDownloadMenu(false);
  };

  const handleDownloadPDF = async () => {
    if (filteredTransactions.length === 0) return;
    
    setShowDownloadMenu(false);

    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(18);
      doc.text("Extrato Detalhado", 14, 22);
      
      // Period
      doc.setFontSize(11);
      doc.setTextColor(100);
      let periodText = "Período: ";
      if (filter === "today") periodText += "Hoje";
      else if (filter === "week") periodText += "Últimos 7 dias";
      else if (filter === "month") periodText += "Últimos 30 dias";
      else if (filter === "custom") periodText += `${dateFrom} até ${dateTo}`;
      doc.text(periodText, 14, 30);
      
      // Summary
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(`Entradas: ${formatCurrency(totalIncome)}`, 14, 40);
      doc.text(`Saídas: -${formatCurrency(totalExpense)}`, 14, 46);
      doc.text(`Saldo: ${formatCurrency(netProfit)}`, 14, 52);
      
      doc.text(`Total Km: ${totalKm} km`, 120, 40);
      doc.text(`Total Horas: ${totalHours} h`, 120, 46);

      let startY = 60;

      // Try to add chart
      const chartElement = document.getElementById('reports-chart');
      if (chartElement) {
        try {
          const canvas = await html2canvas(chartElement, { scale: 2, logging: false });
          const imgData = canvas.toDataURL('image/png');
          const pdfWidth = doc.internal.pageSize.getWidth() - 28;
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          doc.addImage(imgData, 'PNG', 14, startY, pdfWidth, pdfHeight);
          startY += pdfHeight + 10;
        } catch (e) {
          console.error("Could not capture chart", e);
        }
      }

      // Table
      const tableColumn = ["Data", "Tipo", "Categoria", "Valor", "Veículo", "Km", "Horas", "Descrição"];
      const tableRows = filteredTransactions.map(t => {
        const date = new Date(t.date).toLocaleDateString('pt-BR');
        const type = t.type === 'income' ? 'Entrada' : 'Saída';
        const category = categories.find(c => c.id === t.category)?.label || t.category || '-';
        const amount = t.type === 'expense' ? `-${formatCurrency(t.amount)}` : formatCurrency(t.amount);
        const vehicle = vehicles.find(v => v.id === t.vehicleId)?.name || '-';
        const km = t.km ? `${t.km}` : '-';
        const hours = t.hours ? `${t.hours}` : '-';
        const desc = t.description || '-';
        
        return [date, type, category, amount, vehicle, km, hours, desc];
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: startY,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [40, 40, 40] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          3: { halign: 'right' }, // Valor
          5: { halign: 'right' }, // Km
          6: { halign: 'right' }, // Horas
        }
      });

      doc.save(`extrato_${filter}_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error("Error generating PDF", error);
      alert("Erro ao gerar PDF. Tente novamente.");
    }
  };

  // Prepare chart data
  const chartData = Object.entries(groupedTransactions).map(([dateStr, dayTransactions]) => {
    const dayIncome = dayTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const dayExpense = dayTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const realDate = new Date(dayTransactions[0].date);
    const dayOfWeek = realDate.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
    const dayOfMonth = realDate.getDate();
    
    return {
      dateObj: realDate,
      name: `${dayOfMonth}\n${dayOfWeek}`, // e.g. "2\nseg"
      dayOfWeek,
      dayOfMonth,
      Entradas: dayIncome,
      Saídas: dayExpense,
      Saldo: dayIncome - dayExpense,
    };
  }).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

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
        <h1 className="text-xl font-bold tracking-tight justify-self-center">Extrato</h1>
        <div className="justify-self-end relative">
          <button 
            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
            className="p-2 text-foreground/60 hover:text-foreground rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title="Baixar Extrato"
          >
            <Download className="w-5 h-5" />
          </button>
          
          {showDownloadMenu && (
            <>
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setShowDownloadMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-card rounded-xl shadow-lg border border-black/5 dark:border-white/5 z-50 overflow-hidden">
                <button
                  onClick={handleDownloadPDF}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <FileText className="w-4 h-4 text-red-500" />
                  <span>Baixar PDF</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-t border-black/5 dark:border-white/5"
                >
                  <FileSpreadsheet className="w-4 h-4 text-green-500" />
                  <span>Baixar CSV (Excel)</span>
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <div className="p-6 max-w-md mx-auto space-y-6">
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
            onClick={() => setFilter("week")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === "week" ? "bg-foreground text-background" : "bg-card border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5"
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
            Mês
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

        {/* Resumo do Período */}
        <div className="bg-card p-5 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm space-y-4">
          <h3 className="font-medium text-foreground/80">Resumo do Período</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-foreground/60">Total de Entradas</span>
              <span className="font-bold text-positive">{formatCurrency(totalIncome)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-foreground/60">Total de Saídas</span>
              <span className="font-bold text-negative">{formatCurrency(totalExpense)}</span>
            </div>
            <div className="pt-3 border-t border-black/5 dark:border-white/5 flex justify-between items-center">
              <span className="font-medium">Saldo Final</span>
              <span className={`font-bold text-xl ${netProfit < 0 ? 'text-negative' : 'text-foreground'}`}>
                {formatCurrency(netProfit)}
              </span>
            </div>
          </div>
        </div>

        {/* Extrato Detalhado */}
        <div className="space-y-6">
          <h3 className="font-medium text-foreground/80">Lançamentos</h3>
          
          {Object.keys(groupedTransactions).length === 0 ? (
            <div className="text-center py-8 text-foreground/50 text-sm bg-card rounded-xl border border-black/5 dark:border-white/5 border-dashed">
              Nenhuma transação registrada neste período.
            </div>
          ) : (
            Object.entries(groupedTransactions).map(([date, dayTransactions]) => (
              <div key={date} className="space-y-3">
                <h4 className="text-xs font-bold text-foreground/50 uppercase tracking-wider pl-2">
                  {date}
                </h4>
                <div className="bg-card rounded-2xl border border-black/5 dark:border-white/5 shadow-sm overflow-hidden">
                  {dayTransactions.map((t, index) => (
                    <button 
                      key={t.id} 
                      onClick={() => setSelectedTransaction(t)}
                      className={`w-full flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left ${
                        index !== dayTransactions.length - 1 ? 'border-b border-black/5 dark:border-white/5' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          t.type === 'income' ? 'bg-positive/10 text-positive' : 'bg-negative/10 text-negative'
                        }`}>
                          {t.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold capitalize">{categories.find(c => c.id === t.category)?.label || t.category}</p>
                          {t.description && (
                            <p className="text-xs text-foreground/50 truncate max-w-[150px]">{t.description}</p>
                          )}
                          {!t.description && t.type === 'income' && (t.km || t.hours) && (
                            <p className="text-xs text-foreground/50">
                              {t.km ? `${t.km}km` : ''} {t.km && t.hours ? '•' : ''} {t.hours ? `${t.hours}h` : ''}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${t.type === 'income' ? 'text-positive' : 'text-foreground'}`}>
                          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                        </p>
                        <p className="text-[10px] text-foreground/40">
                          {new Date(t.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Gráfico de Visão Geral */}
        {chartData.length > 0 && (
          <div id="reports-chart" className="bg-card p-5 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm space-y-4 mt-6">
            <h3 className="font-medium text-foreground/80">Visão Geral</h3>
            <div className="w-full" style={{ height: 256 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 30, right: 10, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="currentColor" 
                    className="text-[10px] opacity-50" 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tick={({ x, y, payload }) => {
                      const [day, weekday] = payload.value.split('\n');
                      return (
                        <g transform={`translate(${x},${y})`}>
                          <text x={0} y={0} dy={10} textAnchor="middle" fill="currentColor" className="text-[11px] font-medium opacity-80">{day}</text>
                          <text x={0} y={0} dy={24} textAnchor="middle" fill="currentColor" className="text-[10px] opacity-50 capitalize">{weekday}</text>
                        </g>
                      );
                    }}
                  />
                  <YAxis 
                    stroke="currentColor" 
                    className="text-[10px] opacity-50"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatCurrency(value)}
                    width={60}
                    tickMargin={5}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    labelStyle={{ fontSize: '12px', color: 'var(--foreground)', opacity: 0.6, marginBottom: '4px' }}
                    cursor={{ fill: 'var(--foreground)', opacity: 0.05 }}
                    separator=""
                    formatter={(value: any) => [formatCurrency(Number(value)), '']}
                  />
                  <Bar dataKey="Entradas" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
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
