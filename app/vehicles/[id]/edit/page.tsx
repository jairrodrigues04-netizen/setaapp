"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ChevronDown, X } from "lucide-react";
import { useStore } from "@/store/use-store";

export default function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const vehicleId = resolvedParams.id;
  
  const updateVehicle = useStore((state) => state.updateVehicle);
  const vehicles = useStore((state) => state.vehicles);
  
  const existingVehicle = vehicles.find(v => v.id === vehicleId);
  
  const [name, setName] = useState("");
  const [type, setType] = useState("carro");
  const [model, setModel] = useState("");
  const [plate, setPlate] = useState("");
  const [error, setError] = useState("");
  
  // Lista de tipos de veículos gerenciada pelo estado
  const [vehicleTypes, setVehicleTypes] = useState([
    { id: "bicicleta", label: "Bicicleta" },
    { id: "moto", label: "Moto" },
    { id: "carro", label: "Carro" },
    { id: "caminhao", label: "Caminhão" },
    { id: "outros", label: "Outros" },
  ]);

  // Estado para o Modal de Novo Tipo
  const [showNewTypeModal, setShowNewTypeModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  
  const hasOtherVehicles = vehicles.length > 1; 
  const [makeActive, setMakeActive] = useState(false);

  useEffect(() => {
    if (existingVehicle) {
      setTimeout(() => {
        setName(existingVehicle.name);
        setType(existingVehicle.type);
        setModel(existingVehicle.model);
        setPlate(existingVehicle.plate);
        setMakeActive(existingVehicle.isActive);
        
        // Se o tipo não estiver na lista padrão, adiciona
        const typeExists = vehicleTypes.some(t => t.id === existingVehicle.type);
        if (!typeExists) {
          setVehicleTypes(prev => [...prev, { id: existingVehicle.type, label: existingVehicle.type.charAt(0).toUpperCase() + existingVehicle.type.slice(1) }]);
        }
      }, 0);
    } else {
      router.push("/vehicles");
    }
  }, [existingVehicle, router, vehicleTypes]);

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

  const handleSave = () => {
    setError("");
    if (!name.trim()) {
      setError("Preencha o nome do veículo.");
      return;
    }
    
    updateVehicle(vehicleId, {
      name,
      type,
      model,
      plate,
      isActive: makeActive
    });
    
    // Se o usuário marcou como ativo, precisamos garantir que os outros fiquem inativos
    if (makeActive && !existingVehicle?.isActive) {
      useStore.getState().setActiveVehicle(vehicleId);
    }
    
    router.push("/vehicles");
  };

  if (!existingVehicle) return null;

  return (
    <main className="flex-1 pb-24 bg-background min-h-screen relative">
      <header className="bg-card p-6 border-b border-black/5 dark:border-white/5 sticky top-0 z-10 flex items-center gap-4">
        <Link 
          href="/vehicles" 
          className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Editar Veículo</h1>
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
        {hasOtherVehicles && !existingVehicle?.isActive && (
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
            Salvar Alterações
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
