
import React, { useRef, useEffect, useState } from 'react';
import { CameraMode, StampedImage } from '../types';
import { Camera, RefreshCw, Circle, Image as ImageIcon, CheckCircle } from 'lucide-react';

interface CameraViewProps {
  onCapture: (videoElement: HTMLVideoElement) => void;
  isProcessing: boolean;
  locationError: string | null;
  capturedCount: number;
  lastPhotoUrl: string | null;
  onOpenGallery: () => void;
  onFinalize: () => void;
}

const CameraView: React.FC<CameraViewProps> = ({ 
  onCapture, 
  isProcessing, 
  locationError, 
  capturedCount, 
  lastPhotoUrl,
  onOpenGallery,
  onFinalize
}) => {
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
      setError('Erro ao acessar a câmera.');
    }
  };

  useEffect(() => {
    startCamera();
    return stopStream;
  }, [mode]);

  const toggleCamera = () => {
    setMode(prev => prev === CameraMode.ENVIRONMENT ? CameraMode.USER : CameraMode.ENVIRONMENT);
  };

  return (
    <div className="relative flex flex-col h-full bg-black overflow-hidden">
      <video ref={videoRef} autoPlay playsInline muted className="flex-1 object-cover w-full h-full" />

      {/* Top UI */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start">
        <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
          <span className="text-white font-black text-xs tracking-tighter uppercase italic">Nordeste Locações</span>
        </div>
        
        {capturedCount > 0 && (
          <button 
            onClick={onFinalize}
            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg animate-pulse transition-all"
          >
            <CheckCircle size={18} />
            Finalizar Vistoria
          </button>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 w-full p-8 flex justify-between items-center bg-gradient-to-t from-black/80 to-transparent">
        <button onClick={toggleCamera} className="p-4 rounded-full bg-white/10 text-white border border-white/20">
          <RefreshCw size={28} />
        </button>

        <button 
          onClick={() => videoRef.current && onCapture(videoRef.current)}
          disabled={isProcessing}
          className={`relative flex items-center justify-center rounded-full p-1 border-4 border-white transition-all active:scale-90 ${isProcessing ? 'opacity-50' : 'hover:scale-105'}`}
        >
          <div className="w-16 h-16 rounded-full bg-white"></div>
        </button>

        <button 
          onClick={onOpenGallery}
          disabled={capturedCount === 0}
          className={`relative w-14 h-14 rounded-xl border-2 border-white/30 overflow-hidden ${capturedCount === 0 ? 'opacity-30' : ''}`}
        >
          {lastPhotoUrl ? (
            <img src={lastPhotoUrl} className="w-full h-full object-cover" alt="Last" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white/10 text-white/50">
              <ImageIcon size={24} />
            </div>
          )}
          {capturedCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-black">
              {capturedCount}
            </div>
          )}
        </button>
      </div>

      {error && (
        <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white">
          <Camera size={64} className="text-slate-500 mb-4" />
          <p className="mb-6">{error}</p>
          <button onClick={startCamera} className="px-6 py-3 bg-blue-600 rounded-full font-bold">Tentar Novamente</button>
        </div>
      )}
    </div>
  );
};

export default CameraView;
