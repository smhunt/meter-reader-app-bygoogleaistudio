export type ViewState = 'dashboard' | 'scan' | 'history' | 'profile';

export interface MeterReading {
  id: string;
  value: string;
  confidence: number;
  timestamp: number;
  imageUrl?: string;
  location?: string;
}

export interface NavItem {
  id: ViewState;
  label: string;
  icon: any; // Using any for Lucide icon component type flexibility
}

export interface ScanResult {
  value: string;
  confidence: number;
}
