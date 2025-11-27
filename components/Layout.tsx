import React, { ReactNode } from 'react';
import { Ship, Clock, MessageSquare, MapPin } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard', label: 'Painel', icon: <Clock size={20} /> },
    { id: 'boats', label: 'Lanchas & Rotas', icon: <Ship size={20} /> },
    { id: 'logs', label: 'Registro Real', icon: <MapPin size={20} /> },
    { id: 'ai', label: 'Assistente IA', icon: <MessageSquare size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-teal-700 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Ship size={28} />
            <h1 className="text-xl font-bold tracking-tight">NavegaAmazonas</h1>
          </div>
          <div className="text-xs opacity-80 hidden sm:block">
            Manaus ↔ Tabatinga
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-6 mb-20 md:mb-0">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 md:hidden z-50">
        <div className="flex justify-around items-center h-16">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                activeTab === tab.id ? 'text-teal-600' : 'text-slate-500'
              }`}
            >
              {tab.icon}
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="hidden md:flex fixed left-0 top-16 h-full w-64 bg-white border-r border-slate-200 flex-col p-4">
        <div className="space-y-2">
           {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-colors ${
                activeTab === tab.id 
                  ? 'bg-teal-50 text-teal-700 font-medium' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Layout;