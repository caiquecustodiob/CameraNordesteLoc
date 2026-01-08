
import { LocationData } from '../types';

export const getCurrentLocation = (): Promise<LocationData> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ latitude: null, longitude: null, timestamp: null, error: 'GPS não suportado' });
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: position.timestamp
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMsg = 'Localização não disponível';
        if (error.code === 1) errorMsg = 'Permissão de GPS negada';
        resolve({ latitude: null, longitude: null, timestamp: null, error: errorMsg });
      },
      options
    );
  });
};
