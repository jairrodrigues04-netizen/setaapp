"use client";

import { useState } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { Car, Bike, Truck, Plus, MoreVertical, CheckCircle2, Circle, User, Edit2, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/use-store";

const getVehicleIcon = (type: string) => {
  switch (type) {
    case 'bicicleta': return <Bike className="w-6 h-6" />;
    case 'moto': return <Bike className="w-6 h-6" />;
    case 'caminhao': return <Truck className="w-6 h-6" />;
    case 'carro':
    default: return <Car className="w-6 h-6" />;
  }
};

export default function VehiclesPage() {
  const router = useRouter();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<{id: string, name: string} | null>(null);

  const vehicles = useStore((state) => state.vehicles);
  const setActiveVehicle = useStore((state) => state.setActiveVehicle);
  const deleteVehicle = useStore((state) => state.deleteVehicle);
  const user = useStore((state) => state.user);

  const toggleMenu = (id: string) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleSetActive = (id: string) => {
    setActiveVehicle(id);
    setOpenMenuId(null); // Fecha o menu se estiver aberto
  };

  // Ordena os veículos: o ativo sempre fica em primeiro
  const sortedVehicles = [...vehicles].sort((a, b) => {
    if (a.isActive) return -1;
    if (b.isActive) return 1;
    return 0;
  });

  return (
    <main className="flex-1 pb-24" onClick={() => setOpenMenuId(null)}>
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
        <h1 className="text-xl font-bold tracking-tight justify-self-center">Veículos</h1>
        <div className="justify-self-end">
          <Link 
            href="/vehicles/new"
            className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <div className="p-6 max-w-md mx-auto space-y-4">
        {sortedVehicles.map((vehicle) => (
          <div 
            key={vehicle.id}
            onClick={() => !vehicle.isActive && handleSetActive(vehicle.id)}
            className={`bg-card p-4 rounded-2xl border-2 shadow-sm relative transition-all ${
              !vehicle.isActive && "cursor-pointer"
            } ${
              vehicle.isActive 
                ? "border-positive" 
                : "border-black/5 dark:border-white/5 opacity-70 hover:opacity-100"
            }`}
          >
            {/* Ribbon "Ativo" - sem precisar de overflow-hidden no pai */}
            {vehicle.isActive && (
              <div className="absolute top-[-2px] right-[-2px] bg-positive text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl uppercase tracking-wider">
                Ativo
              </div>
            )}
            
            <div className="flex items-center gap-4">
              {vehicle.isActive ? (
                <div className="text-positive">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : (
                <div className="text-foreground/30 hover:text-foreground/60 transition-colors">
                  <Circle className="w-6 h-6" />
                </div>
              )}
              
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                vehicle.isActive ? "bg-positive/10 text-positive" : "bg-black/5 dark:bg-white/10 text-foreground/60"
              }`}>
                {getVehicleIcon(vehicle.type)}
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-lg">{vehicle.name}</h3>
                <p className="text-sm text-foreground/60">Placa: {vehicle.plate}</p>
              </div>
              
              {/* Menu 3 Pontinhos */}
              <div className="relative">
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleMenu(vehicle.id); }}
                  className="p-2 text-foreground/40 hover:text-foreground rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                
                {openMenuId === vehicle.id && (
                  <div className="absolute right-0 top-10 w-40 bg-card border border-black/10 dark:border-white/10 rounded-xl shadow-lg overflow-hidden z-20 animate-in fade-in slide-in-from-top-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(null);
                        router.push(`/vehicles/${vehicle.id}/edit`);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" /> Editar
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(null);
                        setVehicleToDelete({ id: vehicle.id, name: vehicle.name });
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-negative hover:bg-negative/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> Excluir
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        <div className="text-center pt-6">
          <p className="text-sm text-foreground/50">
            Toque no círculo para definir qual veículo está ativo. O veículo ativo será usado automaticamente nas novas transações.
          </p>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {vehicleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-sm rounded-3xl p-6 space-y-6 shadow-xl border border-black/10 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-negative">Excluir Veículo</h3>
              <button onClick={() => setVehicleToDelete(null)} className="p-2 bg-black/5 dark:bg-white/10 rounded-full hover:opacity-80 transition-opacity">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-foreground/80">
              Tem certeza que deseja excluir o veículo <strong>{vehicleToDelete.name}</strong>?
              <br/><br/>
              <span className="text-sm text-foreground/60">Os lançamentos antigos vinculados a ele não serão apagados.</span>
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setVehicleToDelete(null)}
                className="flex-1 bg-card border-2 border-black/5 dark:border-white/5 text-foreground py-4 rounded-xl font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  deleteVehicle(vehicleToDelete.id);
                  setVehicleToDelete(null);
                }}
                className="flex-1 bg-negative text-white py-4 rounded-xl font-bold hover:opacity-90 transition-opacity"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
