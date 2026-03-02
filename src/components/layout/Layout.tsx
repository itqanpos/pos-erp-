import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

export function Layout() {
  const { i18n } = useTranslation();
  
  useEffect(() => {
    document.dir = i18n.dir();
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
