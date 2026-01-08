
export interface LocationData {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
}

export interface SessionData {
  assetId: string;
  client: string;
}

export interface CapturedPhoto {
  id: string;
  url: string; // Blob URL
  timestamp: string;
  location: LocationData;
  filename: string;
}

export interface InspectionBatch {
  id: string;
  session: SessionData;
  photos: CapturedPhoto[];
  createdAt: string;
}

export enum AppState {
  PERMISSION_CHECK = 'PERMISSION_CHECK',
  SETUP = 'SETUP',
  CAMERA = 'CAMERA',
  REVIEW = 'REVIEW',
  HISTORY = 'HISTORY'
}
