
import React, { useRef, useEffect, useState } from 'react';
import { CameraMode } from '../types';
import { RefreshCw, ImageIcon, CheckCircle, Camera } from 'lucide-react';

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

      {/* Top UI - Mais alta para SafeArea de iPhones */}
      <div className="absolute top-0 left-0 w-full pt-12 p-6 flex justify-between items-start pointer-events-none">
        <div className="bg-black/60 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10">
          <span className="text-white font-black text-sm tracking-tighter uppercase italic">Nordeste Locações</span>
        </div>
        
        {capturedCount > 0 && (
          <button 
            onClick={onFinalize}
            className="pointer-events-auto bg-green-600 active:bg-green-700 text-white px-6 py-4 rounded-2xl font-black flex items-center gap-3 shadow-2xl animate-pulse transition-all text-sm uppercase"
          >
            <CheckCircle size={24} />
            Finalizar
          </button>
        )}
      </div>

      {/* Bottom Controls - Área de Toque Grande */}
      <div className="absolute bottom-0 left-0 w-full pb-12 p-8 flex justify-between items-center bg-gradient-to-t from-black/90 via-black/40 to-transparent">
        <button 
          onClick={toggleCamera} 
          className="w-16 h-16 flex items-center justify-center rounded-2xl bg-white/10 text-white border border-white/20 active:scale-90 transition-transform"
        >
          <RefreshCw size={32} />
        </button>

        <button 
          onClick={() => videoRef.current && onCapture(videoRef.current)}
          disabled={isProcessing}
          className={`relative flex items-center justify-center rounded-full p-1.5 border-[6px] border-white transition-all active:scale-75 ${isProcessing ? 'opacity-50' : ''}`}
        >
          <div className="w-20 h-20 rounded-full bg-white shadow-inner"></div>
          {isProcessing && <div className="absolute inset-0 border-4 border-blue-500 rounded-full animate-spin"></div>}
        </button>

        <button 
          onClick={onOpenGallery}
          disabled={capturedCount === 0}
          className={`relative w-16 h-16 rounded-2xl border-2 border-white/30 overflow-hidden active:scale-90 transition-transform ${capturedCount === 0 ? 'opacity-30' : ''}`}
        >
          {lastPhotoUrl ? (
            <img src={lastPhotoUrl} className="w-full h-full object-cover" alt="Last" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white/10 text-white/50">
              <ImageIcon size={32} />
            </div>
          )}
          {capturedCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-black w-8 h-8 flex items-center justify-center rounded-full border-4 border-black">
              {capturedCount}
            </div>
          )}
        </button>
      </div>

      {error && (
        <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-8 text-center text-white">
          <Camera size={80} className="text-slate-700 mb-6" />
          <h2 className="text-2xl font-bold mb-2">Ops! Câmera não encontrada</h2>
          <p className="text-slate-400 mb-10">Verifique as permissões do seu navegador.</p>
          <button onClick={startCamera} className="w-full py-5 bg-blue-600 rounded-2xl font-black text-lg">Tentar Novamente</button>
        </div>
      )}
    </div>
  );
};

export default CameraView;
