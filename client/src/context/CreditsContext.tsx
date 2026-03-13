import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@clerk/clerk-react";
import api from "../configs/api";

interface CreditsContextType {
  credits: number | null;
  refreshCredits: () => Promise<void>;
  reviewCount: number;
  refreshReviews: () => Promise<void>;
  streak: number;
  completedToday: boolean;
  refreshStreak: () => Promise<void>;
}

const CreditsContext = createContext<CreditsContextType>({
  credits: null,
  refreshCredits: async () => {},
  reviewCount: 0,
  refreshReviews: async () => {},
  streak: 0,
  completedToday: false,
  refreshStreak: async () => {},
});

export const CreditsProvider = ({ children }: { children: ReactNode }) => {
  const { isSignedIn, getToken } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [completedToday, setCompletedToday] = useState(false);

  const refreshCredits = async () => {
    try {
      const token = await getToken();
      const { data } = await api.get('/api/user/credits', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCredits(data.credits);
    } catch (error) {
      console.error(error);
    }
  };

  const refreshReviews = async () => {
    try {
      const token = await getToken();
      const { data } = await api.get('/api/user/reviews', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviewCount(data.count);
    } catch (error) {
      console.error(error);
    }
  };

  const refreshStreak = async () => {
    try {
      const token = await getToken();
      const { data } = await api.get('/api/boost/streak', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStreak(data.currentStreak);
      setCompletedToday(data.completedToday);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      refreshCredits();
      refreshReviews();
      refreshStreak();
    } else {
      setCredits(null);
      setReviewCount(0);
      setStreak(0);
      setCompletedToday(false);
    }
  }, [isSignedIn]);

  return (
    <CreditsContext.Provider value={{ credits, refreshCredits, reviewCount, refreshReviews, streak, completedToday, refreshStreak }}>
      {children}
    </CreditsContext.Provider>
  );
};

export const useCredits = () => useContext(CreditsContext);