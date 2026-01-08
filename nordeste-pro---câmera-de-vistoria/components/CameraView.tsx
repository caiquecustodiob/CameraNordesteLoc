
import React, { useRef, useEffect, useState } from 'react';
import { Camera, MapPin, X, Zap, ZapOff, Image as ImageIcon, CheckCircle, Target } from 'lucide-react';
import { LocationData, SessionData } from '../types';

interface CameraViewProps {
  onCapture: (blob: Blob) => void;
  location: LocationData;
  session: SessionData;
  photoCount: number;
  onFinish: () => void;
  onCancel: () => void;
}

const CameraView: React.FC<CameraViewProps> = ({
  onCapture,
  location,
  session,
  photoCount,
  onFinish,
  onCancel
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };
      
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setStream(newStream);

      // Check for torch capability
      const track = newStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;
      if (capabilities.torch) {
        setHasTorch(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Não foi possível acessar a câmera traseira. Verifique se não há outro app usando a câmera.');
    }
  };

  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    try {
      await (track as any).applyConstraints({
        advanced: [{ torch: !torchOn }]
      });
      setTorchOn(!torchOn);
    } catch (err) {
      console.error('Flashlight error:', err);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const handleCapture = async () => {
    if (!videoRef.current || isCapturing) return;
    
    setIsCapturing(true);
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 150);

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) onCapture(blob);
        setIsCapturing(false);
      }, 'image/jpeg', 0.95);
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50 select-none touch-none">
      {/* Visual Flash Effect */}
      {showFlash && <div className="absolute inset-0 bg-white z-[100] animate-out fade-out duration-150" />}

      {/* Top Overlay: Context & Sensors */}
      <div className="absolute top-0 left-0 right-0 p-5 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start z-10">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]"></div>
            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">REC • VISTORIA PRO</span>
          </div>
          <div className="flex flex-col gap-0.5">
             <p className="text-xs font-mono font-bold text-blue-400">PAT: {session.assetId}</p>
             <p className="text-[10px] text-slate-400 uppercase font-medium truncate max-w-[150px]">{session.client}</p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-3">
          <div className="flex gap-2">
            {hasTorch && (
              <button 
                onClick={toggleTorch}
                className={`p-2.5 rounded-full transition-all border ${torchOn ? 'bg-yellow-500 border-yellow-400 text-black shadow-lg shadow-yellow-900/40' : 'bg-black/40 border-white/20 text-white'}`}
              >
                {torchOn ? <Zap size={18} fill="currentColor" /> : <ZapOff size={18} />}
              </button>
            )}
            <button 
              onClick={onCancel}
              className="p-2.5 bg-red-600/20 border border-red-600/40 rounded-full text-red-500 hover:bg-red-600 hover:text-white transition-all"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono font-bold backdrop-blur-md border ${location.latitude ? 'bg-green-500/10 border-green-500/40 text-green-400' : 'bg-yellow-500/10 border-yellow-500/40 text-yellow-400 animate-pulse'}`}>
            <MapPin size={10} />
            {location.latitude ? `GPS: ${location.latitude.toFixed(4)}, ${location.longitude?.toFixed(4)}` : 'SINAL GPS FRACA'}
          </div>
        </div>
      </div>

      {/* Grid Overlay for framing */}
      <div className="absolute inset-0 pointer-events-none z-0 border-[0.5px] border-white/5 grid grid-cols-3 grid-rows-3 opacity-30">
        <div className="border-r border-b border-white/10"></div>
        <div className="border-r border-b border-white/10"></div>
        <div className="border-b border-white/10"></div>
        <div className="border-r border-b border-white/10"></div>
        <div className="border-r border-b border-white/10 flex items-center justify-center">
            <Target size={40} className="text-white/10" strokeWidth={1} />
        </div>
        <div className="border-b border-white/10"></div>
        <div className="border-r border-white/10"></div>
        <div className="border-r border-white/10"></div>
        <div></div>
      </div>

      {/* Video Stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="flex-1 w-full h-full object-cover"
      />

      {/* Bottom Controls: Capture & Batch Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-black/95 to-transparent flex flex-col items-center gap-8 z-20">
        
        <div className="flex w-full justify-between items-center max-w-sm px-4">
          {/* Gallery Preview / Counter */}
           <div className="flex flex-col items-center gap-2">
            <div className="relative w-14 h-14 rounded-2xl border-2 border-slate-700/50 flex items-center justify-center bg-slate-900 overflow-hidden shadow-inner group">
               <ImageIcon size={24} className="text-slate-600" />
               {photoCount > 0 && (
                 <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center backdrop-blur-[2px]">
                   <span className="text-lg font-black text-white drop-shadow-md">{photoCount}</span>
                 </div>
               )}
            </div>
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Buffer</span>
          </div>

          {/* Shutter Button */}
          <button
            onClick={handleCapture}
            disabled={isCapturing}
            className={`group relative w-24 h-24 rounded-full flex items-center justify-center transition-all transform active:scale-90 ${isCapturing ? 'opacity-50' : 'opacity-100'}`}
          >
            <div className="absolute inset-0 rounded-full border-4 border-white/30 group-active:border-white/50 animate-pulse"></div>
            <div className="w-20 h-20 rounded-full border-[6px] border-white flex items-center justify-center p-1">
               <div className="w-full h-full rounded-full bg-white flex items-center justify-center shadow-lg shadow-white/20">
                  <Camera size={36} className="text-slate-950" strokeWidth={2.5} />
               </div>
            </div>
          </button>

          {/* Finish Button */}
          <button
            onClick={onFinish}
            disabled={photoCount === 0}
            className={`flex flex-col items-center gap-2 transition-all group ${photoCount === 0 ? 'opacity-20 grayscale cursor-not-allowed' : 'opacity-100 active:scale-95'}`}
          >
            <div className="w-14 h-14 rounded-2xl bg-green-600 flex items-center justify-center shadow-lg shadow-green-900/40 border border-green-500/50 group-active:bg-green-500">
              <CheckCircle size={28} className="text-white" />
            </div>
            <span className="text-[10px] text-green-500 font-black uppercase tracking-widest">Fechar</span>
          </button>
        </div>

        {/* Technical Metadata Footer */}
        <div className="flex gap-6 text-[10px] font-mono text-slate-600 uppercase tracking-[0.2em] font-bold">
           <div className="flex items-center gap-1"><span className="w-1 h-1 bg-slate-600 rounded-full"></span> HDR</div>
           <div className="flex items-center gap-1"><span className="w-1 h-1 bg-slate-600 rounded-full"></span> 4:3 RAW</div>
           <div className="flex items-center gap-1 text-blue-500/50"><span className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></span> ONLINE</div>
        </div>
      </div>
    </div>
  );
};

export default CameraView;
