import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db, Employee } from '@/db';

interface AuthContextType {
  user: Employee | null;
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUserId = sessionStorage.getItem('userId');
    if (storedUserId) {
      db.employees.get(parseInt(storedUserId)).then((employee) => {
        if (employee && employee.active) {
          setUser(employee);
        } else {
            sessionStorage.removeItem('userId');
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (pin: string) => {
    const employee = await db.employees.where('pin').equals(pin).first();
    if (employee && employee.active) {
      setUser(employee);
      sessionStorage.setItem('userId', employee.id.toString());
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('userId');
  };

  if (loading) {
      return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
