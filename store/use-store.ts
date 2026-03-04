import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  description: string;
  vehicleId?: string;
  km?: number;
  hours?: number;
}

export interface Vehicle {
  id: string;
  name: string;
  type: string;
  model: string;
  plate: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  label: string;
  type: TransactionType;
  isDefault?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface AppState {
  // Dados
  user: User | null;
  vehicles: Vehicle[];
  transactions: Transaction[];
  dailyGoal: number;
  categories: Category[];
  
  // Ações de Veículos
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  updateVehicle: (id: string, vehicle: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  setActiveVehicle: (id: string) => void;
  
  // Ações de Transações
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  
  // Ações de Metas
  setDailyGoal: (goal: number) => void;

  // Ações de Categorias
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Ações de Usuário
  setUser: (user: User | null) => void;
}

const defaultCategories: Category[] = [
  { id: "uber", label: "Uber", type: "income", isDefault: true },
  { id: "99", label: "99", type: "income", isDefault: true },
  { id: "indriver", label: "InDrive", type: "income", isDefault: true },
  { id: "private", label: "Particular", type: "income", isDefault: true },
  { id: "other_income", label: "Outros", type: "income", isDefault: true },
  { id: "fuel", label: "Combustível", type: "expense", isDefault: true },
  { id: "food", label: "Alimentação", type: "expense", isDefault: true },
  { id: "maintenance", label: "Manutenção", type: "expense", isDefault: true },
  { id: "other_expense", label: "Outros", type: "expense", isDefault: true },
];

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      vehicles: [],
      transactions: [],
      dailyGoal: 0, // Meta padrão inicial zerada
      categories: defaultCategories,

      addVehicle: (vehicle) => set((state) => {
        const newVehicle = { ...vehicle, id: crypto.randomUUID() };
        let newVehicles = [...state.vehicles, newVehicle];
        
        // Se for o primeiro veículo ou se o usuário marcou como ativo, desativa os outros
        if (newVehicle.isActive || newVehicles.length === 1) {
          newVehicles = newVehicles.map(v => ({ 
            ...v, 
            isActive: v.id === newVehicle.id 
          }));
        }
        
        return { vehicles: newVehicles };
      }),

      updateVehicle: (id, updatedFields) => set((state) => ({
        vehicles: state.vehicles.map(v => 
          v.id === id ? { ...v, ...updatedFields } : v
        )
      })),

      deleteVehicle: (id) => set((state) => {
        const newVehicles = state.vehicles.filter(v => v.id !== id);
        
        // Se deletamos o veículo ativo, torna o primeiro da lista restante ativo
        const deletedWasActive = state.vehicles.find(v => v.id === id)?.isActive;
        if (deletedWasActive && newVehicles.length > 0) {
          newVehicles[0].isActive = true;
        }
        
        return { vehicles: newVehicles };
      }),

      setActiveVehicle: (id) => set((state) => ({
        vehicles: state.vehicles.map(v => ({ 
          ...v, 
          isActive: v.id === id 
        }))
      })),

      addTransaction: (transaction) => set((state) => ({
        transactions: [
          { ...transaction, id: crypto.randomUUID() }, 
          ...state.transactions
        ]
      })),

      updateTransaction: (id, updatedFields) => set((state) => ({
        transactions: state.transactions.map(t => 
          t.id === id ? { ...t, ...updatedFields } : t
        )
      })),

      deleteTransaction: (id) => set((state) => ({
        transactions: state.transactions.filter(t => t.id !== id)
      })),

      setDailyGoal: (goal) => set({ dailyGoal: goal }),

      addCategory: (category) => set((state) => ({
        categories: [...state.categories, { ...category, id: crypto.randomUUID() }]
      })),

      updateCategory: (id, updatedFields) => set((state) => ({
        categories: state.categories.map(c => 
          c.id === id ? { ...c, ...updatedFields } : c
        )
      })),

      deleteCategory: (id) => set((state) => ({
        categories: state.categories.filter(c => c.id !== id)
      })),

      setUser: (user) => set({ user }),
    }),
    {
      name: 'seta-storage', // Nome da chave no LocalStorage
    }
  )
);
