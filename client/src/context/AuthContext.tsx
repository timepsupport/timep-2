import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { IUser } from "../assets/assets";
import api from "../configs/api";
import toast from "react-hot-toast";

// 🔹 Interface du context
interface AuthContextProps {
  isLoggedIn: boolean;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  user: IUser | null;
  setUser: (user: IUser | null) => void;
  login: (user: { email: string; password: string }) => Promise<void>;
  signUp: (user: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

// 🔹 Création du context
const AuthContext = createContext<AuthContextProps>({
  isLoggedIn: false,
  setIsLoggedIn: () => {},
  user: null,
  setUser: () => {},
  login: async () => {},
  signUp: async () => {},
  logout: async () => {},
});

// 🔹 Provider
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // 🔹 Inscription
  const signUp = async ({ name, email, password }: { name: string; email: string; password: string }) => {
    try {
      const { data } = await api.post("/api/auth/register", { name, email, password });
      if (data.user) {
        setUser(data.user as IUser);
        setIsLoggedIn(true);
      }
      toast.success(data.message);
    } catch (error: any) {
      console.log(error);
      toast.error(error.response?.data?.message || "Registration failed");
    }
  };

  // 🔹 Connexion
  const login = async ({ email, password }: { email: string; password: string }) => {
    try {
      const { data } = await api.post("/api/auth/login", {email, password });
      if (data.user) {
        setUser(data.user as IUser);
        setIsLoggedIn(true);
      }
      toast.success(data.message);
    } catch (error: any) {
      console.log(error);
      toast.error(error.response?.data?.message || "Login failed");
    }
  };

  // 🔹 Déconnexion
  const logout = async () => {
    try {
      const { data } = await api.post("/api/auth/logout");
      setUser(null);
      setIsLoggedIn(false);
      toast.success(data.message);
    } catch (error: any) {
      console.log(error);
      toast.error(error.response?.data?.message || "Logout failed");
    }
  };

  // 🔹 Vérification de la session
  const fetchUser = async () => {
    try {
      const { data } = await api.get("/api/auth/verify");
      if (data.user) {
        setUser(data.user as IUser);
        setIsLoggedIn(true);
      }
    } catch (error: any) {
      console.log(error);
      // Pas de toast ici pour éviter pop-ups à chaque refresh si non connecté
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const value = { user, setUser, isLoggedIn, setIsLoggedIn, signUp, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 🔹 Hook pratique
export const useAuth = () => useContext(AuthContext);


