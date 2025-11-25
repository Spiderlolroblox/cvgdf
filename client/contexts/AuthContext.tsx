import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  SystemNoticesService,
  UserBan,
  MaintenanceNotice,
} from "@/lib/system-notices";

export type PlanType = "Free" | "Classic" | "Pro";

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  plan: PlanType;
  messagesUsed: number;
  messagesLimit: number;
  createdAt: number;
  isAdmin: boolean;
  licenseKey?: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  userBan: UserBan | null;
  maintenanceNotice: MaintenanceNotice | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  error: null,
  isAdmin: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userBan, setUserBan] = useState<UserBan | null>(null);
  const [maintenanceNotice, setMaintenanceNotice] =
    useState<MaintenanceNotice | null>(null);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      try {
        if (!isMounted) return;

        if (authUser) {
          setUser(authUser);

          // Check if user is banned
          const ban = await SystemNoticesService.getUserBan(authUser.uid);
          if (isMounted) {
            setUserBan(ban);
          }

          // Check for active maintenance
          const maintenance =
            await SystemNoticesService.getActiveMaintenanceNotice();
          if (isMounted) {
            setMaintenanceNotice(maintenance);
          }

          const userDocRef = doc(db, "users", authUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (!isMounted) return;

          if (userDocSnap.exists()) {
            setUserData(userDocSnap.data() as UserData);
          } else {
            // Initialize new user with Free plan
            const newUserData: UserData = {
              uid: authUser.uid,
              email: authUser.email || "",
              displayName: authUser.displayName || "Utilisateur",
              plan: "Free",
              messagesUsed: 0,
              messagesLimit: 10,
              createdAt: Date.now(),
              isAdmin: false,
            };
            setUserData(newUserData);
          }
        } else {
          setUser(null);
          setUserData(null);
          setUserBan(null);
          setMaintenanceNotice(null);
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Auth error");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const refreshUserData = async () => {
      if (!isMounted) return;

      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (isMounted && userDocSnap.exists()) {
          setUserData(userDocSnap.data() as UserData);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error refreshing user data:", err);
        }
      }

      if (isMounted) {
        timeoutId = setTimeout(refreshUserData, 5000);
      }
    };

    timeoutId = setTimeout(refreshUserData, 5000);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        error,
        isAdmin: userData?.isAdmin || false,
        userBan,
        maintenanceNotice,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
