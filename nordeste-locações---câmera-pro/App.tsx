
import React, { useState, useEffect } from 'react';
import CameraView from './components/CameraView';
import PhotoPreview from './components/PhotoPreview';
import CustomModal from './components/CustomModal';
import { getCurrentLocation } from './services/locationService';
import { processImage, reprocessWithPatrimonio } from './services/imageProcessor';
import { LocationData, StampedImage, InspectionSession } from './types';
import { Loader2, FolderClosed, History, Trash2, X, Camera, User, Download, Smartphone, Share, PlusSquare } from 'lucide-react';

const App: React.FC = () => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImages, setCapturedImages] = useState<StampedImage[]>([]);
  const [archivedSessions, setArchivedSessions] = useState<InspectionSession[]>([]);
  const [showGallery, setShowGallery] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  
  // Estados para Instalação PWA
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallOverlay, setShowInstallOverlay] = useState(false);

  const [isPatrimonioModalOpen, setIsPatrimonioModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    // Verifica se está rodando como APP (Standalone)
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(checkStandalone);

    // Se NÃO estiver em modo app, mostramos o overlay de instalação após 2 segundos
    if (!checkStandalone) {
      setTimeout(() => setShowInstallOverlay(true), 1500);
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    const update = async () => setCurrentLocation(await getCurrentLocation());
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallOverlay(false);
      }
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
      alert(e.message || 'Erro na captura.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinalizeVistoria = (data?: { patrimonio: string, cliente: string }) => {
    setIsPatrimonioModalOpen(false);
    if (!data || !data.patrimonio.trim() || !data.cliente.trim()) {
      alert('Preencha todos os campos.');
      return;
    }
    finalizeWithInfo(data.patrimonio.trim(), data.cliente.trim());
  };

  const finalizeWithInfo = async (patrimonio: string, cliente: string) => {
    setIsProcessing(true);
    try {
      const finalizedImages: StampedImage[] = [];
      const safeClienteName = cliente.replace(/[^a-z0-9]/gi, '_').toLowerCase();

      for (let i = 0; i < capturedImages.length; i++) {
        const img = capturedImages[i];
        const reprocessed = await reprocessWithPatrimonio(img, patrimonio, cliente);
        finalizedImages.push(reprocessed);

        const link = document.createElement('a');
        link.href = reprocessed.url;
        link.download = `${patrimonio}_${safeClienteName}_${i + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const session: InspectionSession = {
        id: Date.now().toString(),
        patrimonio,
        cliente,
        date: Date.now(),
        images: finalizedImages,
        isFinalized: true
      };
      setArchivedSessions(prev => [session, ...prev]);
      setCapturedImages([]);
      setShowGallery(false);
    } catch (e: any) {
      alert('Erro ao processar imagens.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 select-none text-white overflow-hidden">
      {/* OVERLAY DE INSTALAÇÃO OBRIGATÓRIO (Apenas se não estiver instalado) */}
      {showInstallOverlay && (
        <div className="fixed inset-0 z-[500] bg-slate-950 p-8 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
           <div className="w-24 h-24 bg-blue-600 rounded-[2rem] shadow-2xl flex items-center justify-center mb-8 animate-bounce">
              <Smartphone size={48} />
           </div>
           <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-4">Instale o App</h2>
           <p className="text-slate-400 mb-10 text-sm leading-relaxed max-w-xs">
             Para remover as barras do navegador e usar a câmera em tela cheia, instale o aplicativo na sua tela de início.
           </p>

           {deferredPrompt ? (
             /* Botão para Android / Chrome Desktop */
             <button 
               onClick={handleInstallClick}
               className="w-full py-6 bg-blue-600 rounded-3xl font-black text-xl uppercase tracking-widest shadow-xl active:scale-95 transition-all"
             >
               Instalar Agora
             </button>
           ) : (
             /* Instrução Manual para iOS */
             <div className="w-full bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] space-y-6 text-left">
                <div className="flex items-center gap-4">
                  <div className="bg-white/10 p-3 rounded-xl text-blue-500"><Share size={24}/></div>
                  <p className="text-xs font-bold uppercase tracking-tight">1. Toque em "Compartilhar"</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-white/10 p-3 rounded-xl text-blue-500"><PlusSquare size={24}/></div>
                  <p className="text-xs font-bold uppercase tracking-tight">2. Toque em "Adicionar à Tela de Início"</p>
                </div>
             </div>
           )}

           <button 
             onClick={() => setShowInstallOverlay(false)}
             className="mt-10 text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] underline"
           >
             Continuar no Navegador (Não recomendado)
           </button>
        </div>
      )}

      {showIntro ? (
        <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col p-10 pt-24 items-center text-center overflow-y-auto">
          <div className="w-32 h-32 mb-10 bg-blue-600 rounded-[2.5rem] shadow-[0_20px_50px_rgba(37,99,235,0.3)] flex items-center justify-center shrink-0">
            <Camera size={64} className="text-white" />
          </div>
          <h1 className="text-4xl font-black mb-3 uppercase tracking-tighter italic">Nordeste</h1>
          <p className="text-slate-500 mb-12 text-xs font-black uppercase tracking-[0.3em]">Câmera Pro de Vistoria</p>
          
          <div className="w-full space-y-4 mb-12">
            <button 
              onClick={() => setShowIntro(false)} 
              className="w-full py-6 px-10 bg-blue-600 font-black rounded-3xl shadow-2xl active:scale-95 transition-all text-xl uppercase tracking-tighter"
            >
              Nova Vistoria
            </button>
            
            <button 
              onClick={() => setShowHistory(true)} 
              className="w-full py-5 bg-slate-900 border border-white/5 text-slate-300 flex items-center justify-center gap-3 rounded-3xl font-black uppercase text-sm tracking-widest active:scale-95 transition-all"
            >
              <History size={20}/> Histórico
            </button>
          </div>
        </div>
      ) : (
        <>
          <CameraView 
            onCapture={handleCapture} 
            isProcessing={isProcessing}
            locationError={currentLocation?.error || null}
            capturedCount={capturedImages.length}
            lastPhotoUrl={capturedImages[0]?.url || null}
            onOpenGallery={() => setShowGallery(true)}
            onFinalize={() => setIsPatrimonioModalOpen(true)}
          />

          <button 
            onClick={() => setShowHistory(true)}
            className="absolute top-16 right-6 p-5 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 text-white shadow-2xl active:scale-90 transition-transform"
          >
            <History size={32} />
          </button>
        </>
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
        onConfirm={handleFinalizeVistoria}
        title="Identificação"
        message="Dados obrigatórios para o carimbo."
        showInput={true}
        confirmText="Gerar Relatório"
      />

      {showHistory && (
        <div className="fixed inset-0 z-[160] bg-slate-950 flex flex-col">
          <div className="pt-16 p-6 flex justify-between items-center bg-slate-900 border-b border-white/5">
            <h2 className="font-black text-white uppercase italic tracking-tighter">Histórico</h2>
            <button onClick={() => setShowHistory(false)} className="p-4 bg-white/5 rounded-2xl active:scale-90 transition-transform"><X/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {archivedSessions.map(session => (
              <div key={session.id} className="bg-slate-900 rounded-[2rem] p-6 border border-white/5">
                <h3 className="font-black text-2xl text-blue-500 italic uppercase">{session.patrimonio}</h3>
                <p className="text-slate-400 text-xs mt-1 uppercase font-bold">{session.cliente}</p>
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {session.images.slice(0, 4).map(img => (
                    <img key={img.id} src={img.url} className="aspect-square object-cover rounded-xl border border-white/10" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-2xl flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="w-20 h-20 text-blue-600 animate-spin mb-6" strokeWidth={3} />
            <p className="font-black text-2xl uppercase italic tracking-tighter">Processando...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
