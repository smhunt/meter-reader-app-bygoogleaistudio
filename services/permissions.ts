// Permission service to handle camera and location permissions

const PERMISSIONS_KEY = 'flowcheck_permissions';

interface PermissionState {
  camera: 'granted' | 'denied' | 'prompt' | null;
  location: 'granted' | 'denied' | 'prompt' | null;
  lastLocation?: { lat: number; lng: number };
}

const getStoredPermissions = (): PermissionState => {
  try {
    const stored = localStorage.getItem(PERMISSIONS_KEY);
    return stored ? JSON.parse(stored) : { camera: null, location: null };
  } catch {
    return { camera: null, location: null };
  }
};

const storePermissions = (state: Partial<PermissionState>) => {
  const current = getStoredPermissions();
  localStorage.setItem(PERMISSIONS_KEY, JSON.stringify({ ...current, ...state }));
};

export const checkCameraPermission = async (): Promise<'granted' | 'denied' | 'prompt'> => {
  try {
    // Try the Permissions API first
    if ('permissions' in navigator) {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      storePermissions({ camera: result.state as 'granted' | 'denied' | 'prompt' });
      return result.state as 'granted' | 'denied' | 'prompt';
    }
  } catch {
    // Permissions API not supported
  }

  // Fall back to stored state
  const stored = getStoredPermissions();
  return stored.camera || 'prompt';
};

export const checkLocationPermission = async (): Promise<'granted' | 'denied' | 'prompt'> => {
  try {
    if ('permissions' in navigator) {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      storePermissions({ location: result.state as 'granted' | 'denied' | 'prompt' });
      return result.state as 'granted' | 'denied' | 'prompt';
    }
  } catch {
    // Permissions API not supported
  }

  const stored = getStoredPermissions();
  return stored.location || 'prompt';
};

export const requestCameraPermission = async (): Promise<boolean> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(track => track.stop());
    storePermissions({ camera: 'granted' });
    return true;
  } catch {
    storePermissions({ camera: 'denied' });
    return false;
  }
};

export const requestLocationPermission = async (): Promise<{ lat: number; lng: number } | null> => {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      storePermissions({ location: 'denied' });
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        storePermissions({ location: 'granted', lastLocation: coords });
        resolve(coords);
      },
      () => {
        storePermissions({ location: 'denied' });
        resolve(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  });
};

export const getLastKnownLocation = (): { lat: number; lng: number } | null => {
  const stored = getStoredPermissions();
  return stored.lastLocation || null;
};

// Pre-request permissions on app startup (call once when user is logged in)
export const initializePermissions = async () => {
  const [cameraState, locationState] = await Promise.all([
    checkCameraPermission(),
    checkLocationPermission()
  ]);

  // If permissions haven't been asked yet and we're on a secure context, request them
  if (window.isSecureContext) {
    if (cameraState === 'prompt') {
      await requestCameraPermission();
    }
    if (locationState === 'prompt') {
      await requestLocationPermission();
    }
  }
};
