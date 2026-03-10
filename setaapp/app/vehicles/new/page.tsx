"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ChevronDown, X } from "lucide-react";
import { useStore } from "@/store/use-store";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function NewVehiclePage() {
  const router = useRouter();
  
  // Pegando do store e forçando any para evitar erros de tipagem
  const store = useStore() as any;
  const { addVehicle, vehicles, user } = store;
  
  const [name, setName] = useState("");
  const [type, setType] = useState("carro");
  const [model, setModel] = useState("");
  const [plate, setPlate] = useState("");
  const [error, setError] = useState("");
  
  const [vehicleTypes, setVehicleTypes] = useState([
    { id: "bicicleta", label: "Bicicleta" },
    { id: "moto", label: "Moto" },
    { id: "carro", label: "Carro" },
    { id: "caminhao", label: "Caminhão" },
    { id: "outros", label: "Outros" },
  ]);

  const [showNewTypeModal, setShowNewTypeModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  
  const hasOtherVehicles = vehicles?.length > 0; 
  const [makeActive, setMakeActive] = useState(!hasOtherVehicles);

  const isBicycle = type === "bicicleta";

  const handleAddNewType = () => {
    if (newTypeName.trim()) {
      const newId = newTypeName.toLowerCase().replace(/\s+/g, "_");
      setVehicleTypes([...vehicleTypes, { id: newId, label: newTypeName }]);
      setType(newId);
      setNewTypeName("");
      setShowNewTypeModal(false);
    }
  };

  const handleSave = async () => {
    setError("");

    // 1. TRAVAS DE SEGURANÇA
    if (!name.trim()) {
      setError("Preencha o nome do veículo.");
      return;
    }
    
    // Se não for bicicleta, modelo e placa são obrigatórios
    if (!isBicycle) {
      if (!model.trim()) {
        setError("Preencha o modelo do veículo.");
        return;
      }
      if (!plate.trim()) {
        setError("Preencha a placa do veículo.");
        return;
      }
    }

    if (!user?.id) {
      setError("Usuário não identificado.");
      return;
    }

    try {
      // 2. Prepara os dados para o Firebase
      const vehicleData = {
        name: name.trim(),
        type,
        model: isBicycle ? "Não aplicável" : model.trim(),
        plate: isBicycle ? "Não aplicável" : plate.trim().toUpperCase(),
        isActive: makeActive,
        createdAt: new Date().toISOString()
      };

      // 3. Salva no Firebase
      const docRef = await addDoc(collection(db as any, "users", user.id, "vehicles"), vehicleData);

      // 4. Salva no Zustand
      addVehicle({
        ...vehicleData,
        id: docRef.id
      });

      router.push("/vehicles");
    } catch (e) {
      console.error("Erro ao salvar veículo:", e);
      setError("Erro ao conectar com o banco de dados.");
    }
  };

  return (
    <main className="flex-1 pb-24 bg-background min-h-screen relative">
      <header className="bg-card p-6 border-b border-black/5 dark:border-white/5 sticky top-0 z-10 flex items-center gap-4">
        <Link 
          href="/vehicles" 
          className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Adicionar Veículo</h1>
      </header>

      <div className="p-6 max-w-md mx-auto space-y-6">
        
        {/* Nome */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground/60">Nome (Apelido)</label>
          <input
            type="text"
            placeholder="Ex: Meu Carro Principal"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-card border border-black/10 dark:border-white/10 rounded-xl p-4 font-medium outline-none focus:border-foreground transition-colors"
          />
        </div>

        {/* Tipo */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground/60">Tipo de Veículo</label>
          <div className="relative">
            <select
              value={type}
              onChange={(e) => {
                if (e.target.value === "add_new") {
                  setShowNewTypeModal(true);
                } else {
                  setType(e.target.value);
                  if (e.target.value === "bicicleta") {
                    setModel("");
                    setPlate("");
                  }
                }
              }}
              className="w-full bg-card border border-black/10 dark:border-white/10 rounded-xl p-4 font-medium outline-none focus:border-foreground transition-colors appearance-none"
            >
              {vehicleTypes.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
              <option value="add_new" className="font-bold text-positive">
                + Adicionar novo tipo...
              </option>
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
              <ChevronDown className="w-5 h-5 text-foreground/50" />
            </div>
          </div>
        </div>

        {/* Modelo */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground/60">Modelo</label>
          <input
            type="text"
            placeholder={isBicycle ? "Não aplicável" : "Ex: Honda Civic 2020"}
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={isBicycle}
            className={`w-full border border-black/10 dark:border-white/10 rounded-xl p-4 font-medium outline-none focus:border-foreground transition-colors ${
              isBicycle ? "bg-black/5 dark:bg-white/5 opacity-50 cursor-not-allowed" : "bg-card"
            }`}
          />
        </div>

        {/* Placa */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground/60">Placa</label>
          <input
            type="text"
            placeholder={isBicycle ? "Não aplicável" : "Ex: ABC-1234"}
            value={plate}
            onChange={(e) => setPlate(e.target.value.toUpperCase())}
            disabled={isBicycle}
            className={`w-full border border-black/10 dark:border-white/10 rounded-xl p-4 font-medium outline-none focus:border-foreground transition-colors uppercase ${
              isBicycle ? "bg-black/5 dark:bg-white/5 opacity-50 cursor-not-allowed" : "bg-card"
            }`}
          />
        </div>

        {/* Definir como Ativo */}
        {hasOtherVehicles && (
          <div className="pt-4 space-y-3 border-t border-black/5 dark:border-white/5">
            <label className="text-sm font-medium text-foreground/60">
              Deseja definir este veículo como ATIVO?
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setMakeActive(true)}
                className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${
                  makeActive 
                    ? "border-positive bg-positive/10 text-positive" 
                    : "border-black/5 dark:border-white/5 bg-card text-foreground/60"
                }`}
              >
                SIM
              </button>
              <button
                onClick={() => setMakeActive(false)}
                className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${
                  !makeActive 
                    ? "border-foreground bg-foreground text-background" 
                    : "border-black/5 dark:border-white/5 bg-card text-foreground/60"
                }`}
              >
                NÃO
              </button>
            </div>
            <p className="text-xs text-foreground/50">
              O veículo ativo é selecionado automaticamente nos novos lançamentos.
            </p>
          </div>
        )}

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
            className="w-full bg-foreground text-background py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md"
          >
            <Check className="w-5 h-5" />
            Salvar Veículo
          </button>
        </div>
      </div>

      {/* Modal Novo Tipo */}
      {showNewTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-sm rounded-3xl p-6 space-y-6 shadow-xl border border-black/10 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Novo Tipo de Veículo</h3>
              <button onClick={() => setShowNewTypeModal(false)} className="p-2 bg-black/5 dark:bg-white/10 rounded-full hover:opacity-80 transition-opacity">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/60">Nome do Tipo</label>
              <input
                type="text"
                placeholder="Ex: Patinete Elétrico"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                autoFocus
                className="w-full bg-background border border-black/10 dark:border-white/10 rounded-xl p-4 font-medium outline-none focus:border-foreground transition-colors"
              />
            </div>
            <button 
              onClick={handleAddNewType}
              className="w-full bg-foreground text-background py-4 rounded-xl font-bold hover:opacity-90 transition-opacity"
            >
              Adicionar Tipo
            </button>
          </div>
        </div>
      )}
    </main>
  );
}