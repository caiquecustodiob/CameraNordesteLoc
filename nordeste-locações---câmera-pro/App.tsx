
import React, { useState, useEffect } from 'react';
import CameraView from './components/CameraView';
import PhotoPreview from './components/PhotoPreview';
import CustomModal from './components/CustomModal';
import { getCurrentLocation } from './services/locationService';
import { processImage, reprocessWithPatrimonio } from './services/imageProcessor';
import { LocationData, StampedImage, InspectionSession } from './types';
import { Loader2, FolderClosed, History, Trash2, X, Camera } from 'lucide-react';

const App: React.FC = () => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImages, setCapturedImages] = useState<StampedImage[]>([]);
  const [archivedSessions, setArchivedSessions] = useState<InspectionSession[]>([]);
  const [showGallery, setShowGallery] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  // Modal States
  const [isPatrimonioModalOpen, setIsPatrimonioModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Initialize GPS
  useEffect(() => {
    const update = async () => setCurrentLocation(await getCurrentLocation());
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCapture = async (video: HTMLVideoElement) => {
    // Verificar se o vídeo está pronto
    if (video.readyState < 2 || video.videoWidth === 0) {
      alert('Aguarde a câmera carregar completamente.');
      return;
    }

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
      console.error(e);
      alert(e.message || 'Erro na captura. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinalizeVistoria = (patrimonio?: string) => {
    setIsPatrimonioModalOpen(false);
    if (!patrimonio || patrimonio.trim() === '') {
      alert('Número do patrimônio é obrigatório.');
      return;
    }

    finalizeWithPatrimonio(patrimonio.trim());
  };

  const finalizeWithPatrimonio = async (patrimonio: string) => {
    setIsProcessing(true);
    try {
      const finalizedImages: StampedImage[] = [];
      // Processar uma por uma
      for (let i = 0; i < capturedImages.length; i++) {
        const img = capturedImages[i];
        const reprocessed = await reprocessWithPatrimonio(img, patrimonio);
        finalizedImages.push(reprocessed);

        // Download individual
        const link = document.createElement('a');
        link.href = reprocessed.url;
        link.download = `${patrimonio}_foto_${i + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const session: InspectionSession = {
        id: Date.now().toString(),
        patrimonio,
        date: Date.now(),
        images: finalizedImages,
        isFinalized: true
      };
      setArchivedSessions(prev => [session, ...prev]);
      setCapturedImages([]);
      setShowGallery(false);
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Erro ao processar imagens.');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
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
        <div className="fixed inset-0 bg-slate-900 z-[100] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-24 h-24 mb-8 bg-blue-600 rounded-[2rem] shadow-2xl flex items-center justify-center">
            <Camera size={48} className="text-white" />
          </div>
          <h1 className="text-3xl font-black mb-2 uppercase tracking-tighter italic">Nordeste Locações</h1>
          <p className="text-slate-400 mb-12 text-sm uppercase tracking-widest">Câmera Pro de Vistoria</p>
          <button onClick={() => setShowIntro(false)} className="w-full max-w-xs py-5 px-8 bg-blue-600 font-bold rounded-2xl shadow-xl active:scale-95 transition-all text-lg">Nova Vistoria</button>
          <button onClick={() => setShowHistory(true)} className="mt-8 text-slate-500 flex items-center gap-2 hover:text-slate-300 transition-colors uppercase text-xs font-bold tracking-widest"><History size={16}/> Histórico de Arquivos</button>
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
            className="absolute top-20 right-4 p-3 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-white/70 shadow-lg"
          >
            <History size={24} />
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

      {/* Patrimonio Input Modal */}
      <CustomModal
        isOpen={isPatrimonioModalOpen}
        onClose={() => setIsPatrimonioModalOpen(false)}
        onConfirm={handleFinalizeVistoria}
        title="Finalizar Vistoria"
        message="Informe o número do patrimônio para carimbar e baixar as imagens."
        showInput={true}
        placeholder="NL..."
        confirmText="Concluir"
      />

      {/* Delete Confirmation Modal */}
      <CustomModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirmed}
        title="Excluir Vistoria"
        message="Deseja remover este registro permanentemente?"
        confirmText="Excluir"
      />

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-[110] bg-slate-950 flex flex-col">
          <div className="p-5 flex justify-between items-center bg-slate-900 border-b border-white/5">
            <h2 className="font-bold flex items-center gap-2 text-blue-400 uppercase tracking-tighter">Vistorias Salvas</h2>
            <button onClick={() => setShowHistory(false)} className="p-2 bg-white/10 rounded-full"><X/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {archivedSessions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600">
                <FolderClosed size={64} className="opacity-10 mb-4" />
                <p className="uppercase text-xs font-bold tracking-widest">Nenhum histórico</p>
              </div>
            ) : (
              archivedSessions.map(session => (
                <div key={session.id} className="bg-slate-900 rounded-2xl p-4 border border-white/10 shadow-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-black text-xl text-white italic tracking-tighter uppercase">{session.patrimonio}</h3>
                      <p className="text-[10px] text-slate-500 font-mono">{new Date(session.date).toLocaleString('pt-BR')}</p>
                    </div>
                    <button onClick={() => confirmDelete(session.id)} className="p-2 text-red-500 bg-red-500/10 rounded-xl">
                      <Trash2 size={20}/>
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {session.images.slice(0, 4).map(img => (
                      <img key={img.id} src={img.url} className="aspect-square object-cover rounded-lg border border-white/5" alt="prev" />
                    ))}
                  </div>
                  <div className="mt-4 flex justify-between items-center border-t border-white/5 pt-3">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{session.images.length} FOTOS</span>
                    <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-1 rounded-md font-black uppercase tracking-widest">SALVO</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-6" />
            <p className="font-black text-2xl uppercase italic tracking-tighter">Nordeste Locações</p>
            <p className="text-slate-400 text-sm mt-2 font-bold animate-pulse">PROCESSANDO E BAIXANDO...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
