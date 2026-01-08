
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
  location: LocationData;
  patrimonio?: string;
  cliente?: string;
}

export interface InspectionSession {
  id: string;
  patrimonio: string;
  cliente: string;
  date: number;
  images: StampedImage[];
  isFinalized: boolean;
}

export enum CameraMode {
  USER = 'user',
  ENVIRONMENT = 'environment'
}
