
export interface LocationData {
  latitude: number | null;
  longitude: number | null;
  timestamp: number | null;
  address?: string;
  error?: string;
}

export interface StampedImage {
  id: string;
  url: string;
  blob: Blob;
  timestamp: number;
}

export enum CameraMode {
  USER = 'user',
  ENVIRONMENT = 'environment'
}
