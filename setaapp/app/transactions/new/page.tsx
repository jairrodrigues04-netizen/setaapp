"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, X, ChevronDown } from "lucide-react";
import { useStore } from "@/store/use-store";
import { db } from "@/lib/firebase"; 
import { collection, addDoc } from "firebase/firestore"; 

export default function NewTransactionPage() {
  const router = useRouter();
  const store = useStore() as any;
  const { addTransaction, vehicles, user, categories } = store;
  const activeVehicle = vehicles?.find((v: any) => v.isActive);

  const [type, setType] = useState<"income" | "expense">("income");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("uber");
  const [km, setKm] = useState("");
  const [hours, setHours] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState("");
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const activeCategories = categories?.filter((c: any) => c.type === type) || [];

  const handleSave = async () => {
    if (!db) return;
    if (!activeVehicle) { setError("Selecione um veículo ativo."); return; }
    if (!amount || parseFloat(amount) <= 0) { setError("Insira um valor."); return; }
    if (!user?.id) return;

    try {
      const transactionData: any = {
        type,
        amount: parseFloat(amount),
        category,
        date: new Date(date).toISOString(),
        vehicleId: activeVehicle.id,
        createdAt: new Date().toISOString()
      };

      if (type === "income") {
        transactionData.km = parseFloat(km) || 0;
        transactionData.hours = parseFloat(hours) || 0;
      }

      const docRef = await addDoc(collection(db as any, "users", user.id, "transactions"), transactionData);
      
      // @ts-ignore
      addTransaction({ ...transactionData, id: docRef.id });
      router.push("/");
    } catch (e) {
      setError("Erro ao salvar.");
    }
  };

  return (
    <main className="flex-1 pb-24 bg-background min-h-screen">
      <header className="p-6 border-b flex items-center gap-4">
        <Link href="/" className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center"><ArrowLeft /></Link>
        <h1 className="text-2xl font-bold">Novo Lançamento</h1>
      </header>

      <div className="p-6 max-w-md mx-auto space-y-8">
        <div className="flex p-1 bg-black/5 rounded-xl">
          <button onClick={() => setType("income")} className={`flex-1 py-3 font-bold rounded-lg ${type === "income" ? "bg-card text-positive shadow-sm" : "opacity-50"}`}>GANHO</button>
          <button onClick={() => setType("expense")} className={`flex-1 py-3 font-bold rounded-lg ${type === "expense" ? "bg-card text-negative shadow-sm" : "opacity-50"}`}>DESPESA</button>
        </div>

        <div className="space-y-4">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-card border rounded-xl p-4" />
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="R$ 0,00" className="w-full bg-card border-2 rounded-2xl p-4 text-3xl font-bold" />
          
          <button onClick={() => setShowCategoryModal(true)} className="w-full bg-card border rounded-xl p-4 flex justify-between">
            <span>{activeCategories.find((c: any) => c.id === category)?.label || "Categoria"}</span>
            <ChevronDown />
          </button>

          {type === "income" && (
            <div className="grid grid-cols-2 gap-4">
              {/* VOLTANDO OS PLACEHOLDERS ORIGINAIS */}
              <input type="number" value={km} onChange={e => setKm(e.target.value)} placeholder="KM Rodados (ex: 150)" className="w-full bg-card border rounded-xl p-4" />
              <input type="number" value={hours} onChange={e => setHours(e.target.value)} placeholder="Horas (ex: 8)" className="w-full bg-card border rounded-xl p-4" />
            </div>
          )}
        </div>

        {error && <p className="text-negative text-center">{error}</p>}
        <button onClick={handleSave} className={`w-full py-4 rounded-xl font-bold text-white ${type === "income" ? "bg-positive" : "bg-negative"}`}>Salvar</button>
      </div>

      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-card w-full max-w-sm rounded-3xl p-6">
            <div className="flex justify-between mb-4 font-bold">Categorias <button onClick={() => setShowCategoryModal(false)}><X /></button></div>
            {activeCategories.map((cat: any) => (
              <button key={cat.id} onClick={() => { setCategory(cat.id); setShowCategoryModal(false); }} className="w-full text-left p-4 border-b">{cat.label}</button>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}