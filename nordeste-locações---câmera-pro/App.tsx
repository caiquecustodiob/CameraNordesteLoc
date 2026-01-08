
import React, { useState, useEffect, useCallback } from 'react';
import CameraView from './components/CameraView';
import PhotoPreview from './components/PhotoPreview';
import { getCurrentLocation } from './services/locationService';
import { processImage } from './services/imageProcessor';
import { LocationData, StampedImage } from './types';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<StampedImage | null>(null);
  const [showIntro, setShowIntro] = useState(true);

  // Initialize GPS updates
  useEffect(() => {
    const updateLocation = async () => {
      const loc = await getCurrentLocation();
      setCurrentLocation(loc);
    };

    updateLocation();
    const interval = setInterval(updateLocation, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  const handleCapture = async (videoElement: HTMLVideoElement) => {
    setIsProcessing(true);
    try {
      // Refresh location right before processing for maximum accuracy
      const loc = await getCurrentLocation();
      setCurrentLocation(loc);

      const result = await processImage(videoElement, loc);
      
      const newImage: StampedImage = {
        id: Date.now().toString(),
        url: result.url,
        blob: result.blob,
        timestamp: Date.now()
      };

      setCapturedImage(newImage);
    } catch (error) {
      console.error('Processing failed:', error);
      alert('Erro ao processar imagem.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClosePreview = () => {
    setCapturedImage(null);
  };

  const handleDeleteImage = () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage.url);
      setCapturedImage(null);
    }
  };

  if (showIntro) {
    return (
      <div className="fixed inset-0 bg-slate-900 z-[100] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 mb-8 bg-white p-4 rounded-3xl shadow-xl shadow-blue-500/20 flex items-center justify-center">
          <img 
            src="https://nordesteloc.com.br/wp-content/uploads/2024/01/logo-nordeste-white.svg" 
            alt="Logo" 
            className="w-full grayscale brightness-0"
          />
        </div>
        <h1 className="text-3xl font-bold mb-4 text-white">Nordeste Cam Pro</h1>
        <p className="text-slate-400 mb-12 max-w-sm">
          Câmera inteligente com carimbo automático de vistorias, GPS e marca d'água corporativa.
        </p>
        <button 
          onClick={() => setShowIntro(false)}
          className="w-full max-w-xs py-4 px-8 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95"
        >
          Iniciar Captura
        </button>
        <p className="mt-8 text-xs text-slate-500 font-mono">
          VERSÃO 2.1.0 • USO CORPORATIVO
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 select-none">
      <CameraView 
        onCapture={handleCapture} 
        isProcessing={isProcessing}
        locationError={currentLocation?.error || null}
      />

      {capturedImage && (
        <PhotoPreview 
          image={capturedImage} 
          onClose={handleClosePreview}
          onDelete={handleDeleteImage}
        />
      )}

      {isProcessing && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="bg-slate-900 p-8 rounded-3xl flex flex-col items-center shadow-2xl border border-white/10">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="font-bold text-white text-lg">Processando Carimbo...</p>
            <p className="text-slate-400 text-sm mt-2">Aplicando logo e metadados GPS</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
