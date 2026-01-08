
import React, { useRef, useEffect, useState } from 'react';
import { CameraMode, LocationData } from '../types';
import { Camera, RefreshCw, Circle, X } from 'lucide-react';

interface CameraViewProps {
  onCapture: (videoElement: HTMLVideoElement) => void;
  isProcessing: boolean;
  locationError: string | null;
}

const CameraView: React.FC<CameraViewProps> = ({ onCapture, isProcessing, locationError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<CameraMode>(CameraMode.ENVIRONMENT);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const startCamera = async () => {
    stopStream();
    setError(null);
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error('Camera Access Error:', err);
      setError('Erro ao acessar a câmera. Verifique as permissões.');
    }
  };

  useEffect(() => {
    startCamera();
    return stopStream;
  }, [mode]);

  const toggleCamera = () => {
    setMode(prev => prev === CameraMode.ENVIRONMENT ? CameraMode.USER : CameraMode.ENVIRONMENT);
  };

  const handleCaptureClick = () => {
    if (videoRef.current && !isProcessing) {
      onCapture(videoRef.current);
    }
  };

  return (
    <div className="relative flex flex-col h-full bg-black overflow-hidden">
      {/* Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="flex-1 object-cover w-full h-full"
      />

      {/* Overlays */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none">
        <div className="bg-black/50 backdrop-blur-md p-2 rounded-lg pointer-events-auto">
          <img 
            src="https://nordesteloc.com.br/wp-content/uploads/2024/01/logo-nordeste-white.svg" 
            alt="Logo" 
            className="h-6 opacity-80"
          />
        </div>
        
        {locationError && (
          <div className="bg-red-500/80 text-white text-xs px-3 py-1 rounded-full animate-pulse">
            {locationError}
          </div>
        )}
      </div>

      {/* Main Controls Area */}
      <div className="absolute bottom-0 left-0 w-full p-8 flex justify-around items-center bg-gradient-to-t from-black/80 to-transparent">
        {/* Toggle Camera */}
        <button 
          onClick={toggleCamera}
          className="p-4 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white border border-white/20"
          title="Alternar Câmera"
        >
          <RefreshCw size={28} />
        </button>

        {/* Shutter Button */}
        <button 
          onClick={handleCaptureClick}
          disabled={isProcessing}
          className={`relative flex items-center justify-center rounded-full p-1 border-4 border-white transition-all active:scale-90 ${isProcessing ? 'opacity-50 grayscale' : 'hover:scale-105'}`}
        >
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
             <Circle size={40} className="text-white fill-white" />
          </div>
          {isProcessing && (
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-full rounded-full border-t-4 border-blue-500 animate-spin"></div>
             </div>
          )}
        </button>

        {/* Spacer for symmetry or gallery thumb placeholder */}
        <div className="w-[60px]"></div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
          <Camera size={64} className="text-slate-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Acesso Necessário</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button 
            onClick={startCamera}
            className="px-6 py-3 bg-blue-600 rounded-full font-bold hover:bg-blue-700 active:scale-95"
          >
            Tentar Novamente
          </button>
        </div>
      )}
    </div>
  );
};

export default CameraView;
