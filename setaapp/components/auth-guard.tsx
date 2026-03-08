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
    if (!auth) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is logged in
        setUser({
          id: firebaseUser.uid,
          name:
            firebaseUser.displayName ||
            firebaseUser.email?.split("@")[0] ||
            "Usuário",
          email: firebaseUser.email || "",
          avatar: firebaseUser.photoURL || undefined,
        });

        // Load data from Firestore
        if (db) {
          try {
            const currentDb = db;
            if (!currentDb) return;
            const docRef = doc(currentDb, "users", firebaseUser.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
              const data = docSnap.data();
              
              // Restore avatar if it exists in Firestore and not in Firebase Auth
              if (data.user?.avatar && !firebaseUser.photoURL) {
                setUser({
                  id: firebaseUser.uid,
                  name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Usuário",
                  email: firebaseUser.email || "",
                  avatar: data.user.avatar,
                });
              }

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
        // Clear local data so another user doesn't see it
        useStore.setState({
          transactions: [],
          vehicles: [],
          dailyGoal: 0,
          // Keep default categories or reset them
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
            user, // Save user object including avatar
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

    const timeoutId = setTimeout(syncData, 2000); // Debounce sync by 2 seconds
    return () => clearTimeout(timeoutId);
  }, [transactions, vehicles, categories, dailyGoal, user, isInitializing]);

  if (isInitializing) {
    return null;
  }

  return <>{children}</>;
}
