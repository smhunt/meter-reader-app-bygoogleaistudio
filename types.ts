export type ViewState = 'dashboard' | 'scan' | 'history' | 'profile';

export interface UserInfo {
  uid: string;
  email: string;
  displayName?: string;
  isAdmin?: boolean;
}

// Admin emails - these users have full access
export const ADMIN_EMAILS = ['sean@ecoworks.ca'];

export interface MeterReading {
  id: string;
  value: string;
  confidence: number;
  timestamp: number;
  imageUrl?: string;
  location?: string;
  recordedBy?: UserInfo;
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
