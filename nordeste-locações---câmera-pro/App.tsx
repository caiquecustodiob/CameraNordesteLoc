
import React, { useState, useEffect } from 'react';
import CameraView from './components/CameraView';
import PhotoPreview from './components/PhotoPreview';
import CustomModal from './components/CustomModal';
import { getCurrentLocation } from './services/locationService';
import { processImage, reprocessWithPatrimonio } from './services/imageProcessor';
import { LocationData, StampedImage, InspectionSession } from './types';
import { Loader2, History, X, Camera, Smartphone, Share, PlusSquare, Menu, Download, ShieldCheck, Database, MapPin } from 'lucide-react';

const App: React.FC = () => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImages, setCapturedImages] = useState<StampedImage[]>([]);
  const [archivedSessions, setArchivedSessions] = useState<InspectionSession[]>([]);
  const [showGallery, setShowGallery] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  
  // PWA & Permissions
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [storagePermission, setStoragePermission] = useState<'default' | 'granted'>('default');

  const [isPatrimonioModalOpen, setIsPatrimonioModalOpen] = useState(false);

  useEffect(() => {
    // Detect Standalone
    const checkStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    setIsStandalone(checkStandalone);

    // Capture Install Prompt
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Check Storage Persistence status
    if (navigator.storage && navigator.storage.persisted) {
      navigator.storage.persisted().then(persisted => {
        if (persisted) setStoragePermission('granted');
      });
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const requestStoragePermission = async () => {
    if (navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persist();
      if (isPersisted) {
        setStoragePermission('granted');
        alert('Armazenamento configurado como permanente!');
      } else {
        alert('O sistema negou a permanência automática, mas o app continuará funcionando.');
      }
    }
  };

  const handleInstallAction = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    } else {
      setShowInstallGuide(true);
    }
  };

  const handleCapture = async (video: HTMLVideoElement) => {
    if (video.readyState < 2 || video.videoWidth === 0) return;
    setIsProcessing(true);
    try {
      const loc = await getCurrentLocation();
      const result = await processImage(video, loc);
      const newImg: StampedImage = {
        id: Date.now().toString(),
        url: result.url,
        blob: result.blob,
        timestamp: Date.now(),
        location: loc
      };
      setCapturedImages(prev => [newImg, ...prev]);
    } catch (e: any) {
      alert('Erro: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const finalizeVistoria = (data?: { patrimonio: string, cliente: string }) => {
    setIsPatrimonioModalOpen(false);
    if (!data?.patrimonio || !data?.cliente) {
      alert('Informe os dados.');
      return;
    }
    executeFinalization(data.patrimonio, data.cliente);
  };

  const executeFinalization = async (patrimonio: string, cliente: string) => {
    setIsProcessing(true);
    try {
      const safeName = cliente.replace(/\s+/g, '_').toLowerCase();
      for (let i = 0; i < capturedImages.length; i++) {
        const reprocessed = await reprocessWithPatrimonio(capturedImages[i], patrimonio, cliente);
        const a = document.createElement('a');
        a.href = reprocessed.url;
        a.download = `VISTORIA_${patrimonio}_${safeName}_${i+1}.jpg`;
        a.click();
        await new Promise(r => setTimeout(r, 600));
      }
      setCapturedImages([]);
      setShowGallery(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white overflow-hidden">
      {showIntro ? (
        <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col items-center p-6 pt-16 overflow-y-auto">
          {/* Logo Section */}
          <div className="w-24 h-24 mb-6 bg-blue-600 rounded-[2rem] shadow-2xl flex items-center justify-center animate-in zoom-in duration-500">
            <Camera size={48} />
          </div>
          <h1 className="text-3xl font-black mb-1 uppercase italic tracking-tighter">Nordeste Pro</h1>
          <p className="text-slate-500 mb-10 text-[10px] font-black uppercase tracking-[0.4em]">Câmera de Vistoria</p>

          <div className="w-full max-w-sm space-y-4">
            {/* Status de Permissões */}
            <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 space-y-4">
              <h2 className="text-[11px] font-black uppercase text-slate-500 tracking-widest mb-2">Configuração do Dispositivo</h2>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database size={18} className={storagePermission === 'granted' ? 'text-green-500' : 'text-slate-600'} />
                  <span className="text-xs font-bold">Armazenamento Offline</span>
                </div>
                {storagePermission !== 'granted' ? (
                  <button onClick={requestStoragePermission} className="text-[10px] bg-blue-600 px-3 py-1.5 rounded-lg font-black uppercase">Permitir</button>
                ) : (
                  <ShieldCheck size={18} className="text-green-500" />
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-green-500" />
                  <span className="text-xs font-bold">Localização GPS</span>
                </div>
                <ShieldCheck size={18} className="text-green-500" />
              </div>
            </div>

            {/* Ações Principais */}
            <div className="space-y-4 pt-4">
              {!isStandalone && (
                <button 
                  onClick={handleInstallAction}
                  className="w-full py-6 bg-white text-blue-600 font-black rounded-3xl shadow-xl active:scale-95 transition-all text-lg uppercase italic tracking-tighter flex items-center justify-center gap-3"
                >
                  <Download size={24} strokeWidth={3} />
                  Baixar Aplicativo
                </button>
              )}

              <button 
                onClick={() => setShowIntro(false)} 
                className="w-full py-6 bg-blue-600 font-black rounded-3xl shadow-lg active:scale-95 transition-all text-lg uppercase italic tracking-tighter"
              >
                Abrir Câmera
              </button>
              
              <button 
                onClick={() => setShowHistory(true)} 
                className="w-full py-4 bg-slate-900/50 text-slate-400 flex items-center justify-center gap-3 rounded-2xl font-black uppercase text-xs"
              >
                <History size={16}/> Histórico
              </button>
            </div>
          </div>

          <p className="mt-10 text-[9px] text-slate-600 uppercase font-black text-center max-w-[200px] leading-relaxed">
            Desenvolvido para uso exclusivo de colaboradores da Nordeste Locações.
          </p>
        </div>
      ) : (
        <CameraView 
          onCapture={handleCapture} 
          isProcessing={isProcessing}
          locationError={currentLocation?.error || null}
          capturedCount={capturedImages.length}
          lastPhotoUrl={capturedImages[0]?.url || null}
          onOpenGallery={() => setShowGallery(true)}
          onFinalize={() => setIsPatrimonioModalOpen(true)}
        />
      )}

      {/* Guia Visual iOS */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowInstallGuide(false)}>
           <div className="w-full max-w-xs bg-slate-900 border border-white/10 rounded-[3rem] p-8 text-center animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
              <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                 <Smartphone size={32} />
              </div>
              <h3 className="text-xl font-black uppercase italic mb-6">Instalar no iPhone</h3>
              <div className="space-y-6 text-left mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-xl"><Share size={20} className="text-blue-500"/></div>
                  <p className="text-[10px] font-black uppercase tracking-tight">1. Toque em "Compartilhar"</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-xl"><PlusSquare size={20} className="text-blue-500"/></div>
                  <p className="text-[10px] font-black uppercase tracking-tight">2. "Adicionar à Tela de Início"</p>
                </div>
              </div>
              <button onClick={() => setShowInstallGuide(false)} className="w-full py-4 bg-blue-600 rounded-2xl font-black text-xs uppercase">Entendi</button>
           </div>
        </div>
      )}

      {showGallery && (
        <PhotoPreview 
          images={capturedImages} 
          onClose={() => setShowGallery(false)}
          onDeleteImage={(id) => setCapturedImages(prev => prev.filter(img => img.id !== id))}
          onClearAll={() => setCapturedImages([])}
        />
      )}

      <CustomModal
        isOpen={isPatrimonioModalOpen}
        onClose={() => setIsPatrimonioModalOpen(false)}
        onConfirm={finalizeVistoria}
        title="Finalizar"
        message="Confirme os dados para o carimbo."
        showInput={true}
        confirmText="Gerar Arquivos"
      />

      {isProcessing && (
        <div className="fixed inset-0 z-[400] bg-black/95 flex flex-col items-center justify-center">
           <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-4" strokeWidth={3} />
           <p className="font-black uppercase italic tracking-widest text-sm">Processando...</p>
        </div>
      )}
    </div>
  );
};

export default App;
