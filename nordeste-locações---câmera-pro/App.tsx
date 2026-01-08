
import React, { useState, useEffect } from 'react';
import CameraView from './components/CameraView';
import PhotoPreview from './components/PhotoPreview';
import CustomModal from './components/CustomModal';
import { getCurrentLocation } from './services/locationService';
import { processImage, reprocessWithPatrimonio } from './services/imageProcessor';
import { LocationData, StampedImage, InspectionSession } from './types';
import { Loader2, FolderClosed, History, Trash2, X, Camera, User, ChevronRight } from 'lucide-react';

const App: React.FC = () => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImages, setCapturedImages] = useState<StampedImage[]>([]);
  const [archivedSessions, setArchivedSessions] = useState<InspectionSession[]>([]);
  const [showGallery, setShowGallery] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  const [isPatrimonioModalOpen, setIsPatrimonioModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const update = async () => setCurrentLocation(await getCurrentLocation());
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

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

  const handleDeleteConfirmed = () => {
    if (deleteId) {
      setArchivedSessions(prev => prev.filter(s => s.id !== deleteId));
      setDeleteId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 select-none text-white">
      {showIntro ? (
        <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col p-10 pt-24 items-center text-center">
          <div className="w-32 h-32 mb-10 bg-blue-600 rounded-[2.5rem] shadow-[0_20px_50px_rgba(37,99,235,0.3)] flex items-center justify-center">
            <Camera size={64} className="text-white" />
          </div>
          <h1 className="text-4xl font-black mb-3 uppercase tracking-tighter italic">Nordeste</h1>
          <p className="text-slate-500 mb-16 text-xs font-black uppercase tracking-[0.3em]">Câmera Pro de Vistoria</p>
          
          <button 
            onClick={() => setShowIntro(false)} 
            className="w-full py-6 px-10 bg-blue-600 font-black rounded-3xl shadow-2xl active:scale-95 transition-all text-xl uppercase tracking-tighter"
          >
            Nova Vistoria
          </button>
          
          <button 
            onClick={() => setShowHistory(true)} 
            className="mt-12 w-full py-5 bg-slate-900 border border-white/5 text-slate-400 flex items-center justify-center gap-3 rounded-3xl font-black uppercase text-sm tracking-widest active:scale-95 transition-all"
          >
            <History size={20}/> Histórico
          </button>
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
            className="absolute top-12 right-6 p-5 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 text-white shadow-2xl active:scale-90 transition-transform"
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

      <CustomModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirmed}
        title="Excluir?"
        message="O registro será removido permanentemente."
        confirmText="Sim, Excluir"
      />

      {showHistory && (
        <div className="fixed inset-0 z-[160] bg-slate-950 flex flex-col">
          <div className="pt-12 p-6 flex justify-between items-center bg-slate-900 border-b border-white/5">
            <h2 className="font-black text-white uppercase italic tracking-tighter">Histórico</h2>
            <button onClick={() => setShowHistory(false)} className="p-4 bg-white/5 rounded-2xl active:scale-90 transition-transform"><X/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {archivedSessions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-800">
                <FolderClosed size={100} className="mb-6 opacity-20" />
                <p className="font-black uppercase tracking-widest text-xs italic">Nenhum registro</p>
              </div>
            ) : (
              archivedSessions.map(session => (
                <div key={session.id} className="bg-slate-900 rounded-[2rem] p-6 border border-white/5 shadow-2xl">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="font-black text-2xl text-blue-500 italic tracking-tighter uppercase">{session.patrimonio}</h3>
                      <div className="flex items-center gap-2 text-slate-400 mt-1">
                        <User size={14} />
                        <span className="text-xs font-black uppercase tracking-tight">{session.cliente}</span>
                      </div>
                    </div>
                    <button onClick={() => setDeleteId(session.id)} className="p-4 text-red-500 bg-red-500/10 rounded-2xl active:scale-90 transition-transform">
                      <Trash2 size={24}/>
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {session.images.slice(0, 4).map(img => (
                      <img key={img.id} src={img.url} className="aspect-square object-cover rounded-xl border border-white/10" alt="prev" />
                    ))}
                  </div>
                  <div className="mt-6 flex justify-between items-center border-t border-white/5 pt-5">
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">{session.images.length} IMAGENS</span>
                    <div className="flex items-center gap-2 text-green-500 bg-green-500/10 px-3 py-1.5 rounded-xl">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-[10px] font-black uppercase tracking-widest">Salvo</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-2xl flex items-center justify-center">
          <div className="flex flex-col items-center p-10">
            <div className="relative mb-10">
               <Loader2 className="w-24 h-24 text-blue-600 animate-spin" strokeWidth={3} />
               <div className="absolute inset-0 flex items-center justify-center font-black italic text-xs">PRO</div>
            </div>
            <p className="font-black text-3xl uppercase italic tracking-tighter">Processando</p>
            <p className="text-slate-500 text-xs mt-4 font-black uppercase tracking-[0.3em] animate-pulse">Carimbando e Exportando...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
