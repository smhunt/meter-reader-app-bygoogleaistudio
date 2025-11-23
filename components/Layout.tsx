import React from 'react';
import { LayoutDashboard, Scan, History, User } from 'lucide-react';
import { ViewState, NavItem } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'scan', label: 'Scan', icon: Scan },
  { id: 'history', label: 'History', icon: History },
  { id: 'profile', label: 'Profile', icon: User },
];

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onViewChange }) => {
  const isScanMode = currentView === 'scan';

  return (
    <div className="flex flex-col h-screen bg-background text-slate-100 overflow-hidden">
      {/* Header - Simple and Clean - Hidden in Scan Mode */}
      {!isScanMode && (
        <header className="flex-none h-14 bg-surface/50 backdrop-blur-md border-b border-slate-700/50 flex items-center justify-between px-4 z-20">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center">
              <Scan className="text-white w-5 h-5" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">FlowCheck</h1>
          </div>
          <div className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
            ONLINE
          </div>
        </header>
      )}

      {/* Main Content Area - Scrollable */}
      <main className={`flex-1 overflow-y-auto ${isScanMode ? 'pb-0' : 'pb-20'} scroll-smooth relative`}>
        {children}
      </main>

      {/* Bottom Navigation - Fixed - Hidden in Scan Mode */}
      {!isScanMode && (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-slate-700 pb-safe z-30">
          <div className="flex justify-around items-center h-full">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              // Special styling for the Scan button to make it pop
              if (item.id === 'scan') {
                return (
                  <button
                    key={item.id}
                    onClick={() => onViewChange(item.id)}
                    className={`flex flex-col items-center justify-center -mt-6 w-14 h-14 rounded-full shadow-lg shadow-cyan-500/30 transition-all active:scale-95 ${
                      isActive 
                        ? 'bg-white text-primary' 
                        : 'bg-primary text-white hover:bg-primaryDark'
                    }`}
                  >
                    <Icon size={24} strokeWidth={2.5} />
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                    isActive ? 'text-primary' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};