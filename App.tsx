import React, { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { CameraScanner } from './components/CameraScanner';
import { History } from './components/History';
import { Login } from './components/Login';
import { Profile } from './components/Profile';
import { MeterReading, ViewState, UserInfo } from './types';
import { subscribeToReadings, addReading, updateReading, deleteReading } from './services/firebase';
import { subscribeToAuth, getUserInfo, claimExistingReadings } from './services/auth';
import { initializePermissions } from './services/permissions';
import { Loader2 } from 'lucide-react';

interface DateFilter {
  start: number;
  end: number;
  label: string;
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // Subscribe to auth state
  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const info = getUserInfo(firebaseUser);
        setUserInfo(info);
        // If admin, migrate any unclaimed readings
        if (info.isAdmin) {
          const migrated = await claimExistingReadings(firebaseUser);
          if (migrated > 0) {
            console.log(`Migrated ${migrated} readings to ${info.email}`);
          }
        }
        // Request camera/location permissions upfront (once per session)
        initializePermissions();
      } else {
        setUserInfo(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to real-time updates from Firebase
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToReadings((updatedReadings) => {
      setReadings(updatedReadings);
    });
    return () => unsubscribe();
  }, [user]);

  const handleScanComplete = async (newReading: MeterReading) => {
    // Add user info to reading
    const readingWithUser = {
      ...newReading,
      recordedBy: userInfo || undefined
    };
    const { id, ...readingData } = readingWithUser;
    await addReading(readingData);
    setCurrentView('history');
  };

  const handleDayClick = (dayStart: number, dayEnd: number, label: string) => {
    setDateFilter({ start: dayStart, end: dayEnd, label });
    setCurrentView('history');
  };

  const handleClearFilter = () => {
    setDateFilter(null);
  };

  // Show loading spinner during auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  // Show login if not authenticated
  if (!user || !userInfo) {
    return <Login onSuccess={() => {}} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard readings={readings} onQuickScan={() => setCurrentView('scan')} onDayClick={handleDayClick} />;
      case 'scan':
        return <CameraScanner onScanComplete={handleScanComplete} onCancel={() => setCurrentView('dashboard')} />;
      case 'history':
        return <History readings={readings} onEdit={updateReading} onDelete={deleteReading} dateFilter={dateFilter} onClearFilter={handleClearFilter} />;
      case 'profile':
        return <Profile userInfo={userInfo} />;
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
