"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { useStore } from "@/store/use-store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isInitializing, setIsInitializing] = useState(!!auth);

  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);

  // State to sync
  const transactions = useStore((state) => state.transactions);
  const vehicles = useStore((state) => state.vehicles);
  const categories = useStore((state) => state.categories);
  const dailyGoal = useStore((state) => state.dailyGoal);

  // Handle Auth State & Load Data
  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // 1. Carrega o básico rápido para a tela não piscar
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Usuário",
          email: firebaseUser.email || "",
          avatar: firebaseUser.photoURL || undefined,
        });

        // 2. Busca os dados reais e definitivos no Firestore
        if (db) {
          try {
            const docRef = doc(db, "users", firebaseUser.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
              const data = docSnap.data();
              
              // A MÁGICA: A foto do banco de dados tem prioridade absoluta!
              const savedAvatar = data.user?.avatar || data.avatar || firebaseUser.photoURL || undefined;

              // Sobrescreve com os dados do banco
              setUser({
                id: firebaseUser.uid,
                name: data.user?.name || firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Usuário",
                email: firebaseUser.email || "",
                avatar: savedAvatar, // Aqui a foto que você subiu finalmente ganha!
              });

              useStore.setState({
                transactions: data.transactions || [],
                vehicles: data.vehicles || [],
                categories: data.categories || useStore.getState().categories,
                dailyGoal: data.dailyGoal || 0,
              });
            }
          } catch (error) {
            console.error("Error loading user data:", error);
          }
        }
      } else {
        // User is logged out
        setUser(null);
        useStore.setState({
          transactions: [],
          vehicles: [],
          dailyGoal: 0,
        });
      }
      setIsInitializing(false);
    });

    return () => unsubscribe();
  }, [setUser]);

  // Handle Redirects
  useEffect(() => {
    if (isInitializing) return;

    if (user && pathname === "/login") {
      router.replace("/");
    } else if (!user && pathname !== "/login") {
      router.replace("/login");
    }
  }, [user, pathname, isInitializing, router]);

  // Sync Data to Firestore when it changes
  useEffect(() => {
    if (!user || !db || isInitializing) return;

    const syncData = async () => {
      if (!db) return;
      try {
        const docRef = doc(db, "users", user.id);
        await setDoc(
          docRef,
          {
            user, // Salva o usuário com a foto nova no Firebase a cada alteração
            transactions,
            vehicles,
            categories,
            dailyGoal,
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
      } catch (error) {
        console.error("Error syncing data:", error);
      }
    };

    const timeoutId = setTimeout(syncData, 2000); // Debounce
    return () => clearTimeout(timeoutId);
  }, [transactions, vehicles, categories, dailyGoal, user, isInitializing]);

  if (isInitializing) {
    return null;
  }

  return <>{children}</>;
}