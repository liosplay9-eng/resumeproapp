import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';

interface UserData {
  userId: string;
  email: string;
  displayName?: string;
  isPro: boolean;
  subscriptionType: 'free' | 'monthly' | 'yearly';
  resumesCount: number;
  streakCount: number;
  lastActiveDate: string;
  referralCode: string;
  createdAt: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  userData: UserData | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, userData: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        
        // Listen for user data changes
        const unsubscribe = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data() as UserData;
            setUserData(data);
            
            // Check daily streak
            const today = new Date().toISOString().split('T')[0];
            const lastActive = data.lastActiveDate?.split('T')[0];
            
            if (lastActive !== today) {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayStr = yesterday.toISOString().split('T')[0];
              
              if (lastActive === yesterdayStr) {
                updateDoc(userRef, {
                  streakCount: (data.streakCount || 0) + 1,
                  lastActiveDate: new Date().toISOString()
                });
              } else {
                updateDoc(userRef, {
                  streakCount: 1,
                  lastActiveDate: new Date().toISOString()
                });
              }
            }
          } else {
            // Initial user setup
            const newData: UserData = {
              userId: user.uid,
              email: user.email!,
              displayName: user.displayName || '',
              isPro: false,
              subscriptionType: 'free',
              resumesCount: 0,
              streakCount: 1,
              lastActiveDate: new Date().toISOString(),
              referralCode: Math.random().toString(36).substring(7).toUpperCase(),
              createdAt: new Date().toISOString()
            };
            setDoc(userRef, newData);
          }
        });
        setLoading(false);
        return unsubscribe;
      } else {
        setUserData(null);
        setLoading(false);
      }
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
