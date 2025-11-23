import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { CameraScanner } from './components/CameraScanner';
import { History } from './components/History';
import { MeterReading, ViewState } from './types';
import { LucideIcon, LayoutDashboard, Scan, History as HistoryIcon, User } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [readings, setReadings] = useState<MeterReading[]>([]);
  
  // Simulate initial data loading
  useEffect(() => {
    const mockData: MeterReading[] = [
      { id: '1', value: '02268.85', confidence: 0.98, timestamp: Date.now() - 10000000, imageUrl: '', location: 'Building A' },
      { id: '2', value: '01258.90', confidence: 0.95, timestamp: Date.now() - 5000000, imageUrl: '', location: 'Building B' },
      { id: '3', value: '01261.25', confidence: 0.88, timestamp: Date.now() - 1000000, imageUrl: '', location: 'Building C' },
    ];
    setReadings(mockData);
  }, []);

  const handleScanComplete = (newReading: MeterReading) => {
    setReadings(prev => [newReading, ...prev]);
    setCurrentView('history');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard readings={readings} onQuickScan={() => setCurrentView('scan')} />;
      case 'scan':
        return <CameraScanner onScanComplete={handleScanComplete} onCancel={() => setCurrentView('dashboard')} />;
      case 'history':
        return <History readings={readings} />;
      case 'profile':
        return (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center text-slate-400">
            <div className="w-24 h-24 bg-surface rounded-full mb-4 flex items-center justify-center">
              <User size={48} />
            </div>
            <h2 className="text-xl font-bold text-white">Technician Profile</h2>
            <p className="mt-2">ID: #8821-CTX</p>
            <p className="text-sm mt-1">Region: North-East</p>
            <div className="mt-8 p-4 bg-slate-900/50 rounded-lg w-full max-w-sm">
              <p className="text-xs font-mono text-cyan-400">STATUS: ONLINE</p>
              <p className="text-xs text-slate-500 mt-1">Sync: Up to date</p>
            </div>
          </div>
        );
      default:
        return <Dashboard readings={readings} onQuickScan={() => setCurrentView('scan')} />;
    }
  };

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {renderContent()}
    </Layout>
  );
};

export default App;