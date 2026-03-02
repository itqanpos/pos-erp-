import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  History,
  BarChart3,
  UserCog,
  Truck,
  Sun,
  Moon,
  DollarSign
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const isRtl = i18n.dir() === 'rtl';

  const navItems = [
    { icon: LayoutDashboard, label: t('dashboard'), path: '/' },
    { icon: ShoppingCart, label: t('pos'), path: '/pos' },
    { icon: Package, label: t('inventory'), path: '/inventory' },
    { icon: Truck, label: t('suppliers'), path: '/suppliers' },
    { icon: History, label: t('sales_history'), path: '/sales' },
    { icon: DollarSign, label: t('expenses') || 'Expenses', path: '/expenses' },
    { icon: Users, label: t('customers'), path: '/customers' },
    { icon: UserCog, label: t('employees'), path: '/employees' },
    { icon: BarChart3, label: t('reports'), path: '/reports' },
    { icon: Settings, label: t('settings'), path: '/settings' },
  ];

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile Toggle */}
      <div className={cn("md:hidden fixed top-4 z-50", isRtl ? "right-4" : "left-4")}>
        <Button variant="outline" size="icon" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed inset-y-0 z-40 w-64 bg-card border-r border-border text-card-foreground transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen shadow-xl md:shadow-none",
          isRtl ? "right-0 border-l border-r-0" : "left-0",
          isOpen ? "translate-x-0" : (isRtl ? "translate-x-full" : "-translate-x-full")
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {t('app_name')}
              </h1>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Pro Edition</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-8 w-8"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-yellow-500" />
              ) : (
                <Moon className="h-4 w-4 text-slate-700" />
              )}
            </Button>
          </div>

          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )
                }
                onClick={() => setIsOpen(false)}
              >
                <item.icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", isRtl && "ml-2")} />
                <span className="font-medium text-sm">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-border">
            <Button 
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className={cn("h-4 w-4", isRtl && "ml-2")} />
              <span className="font-medium">{t('logout')}</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
