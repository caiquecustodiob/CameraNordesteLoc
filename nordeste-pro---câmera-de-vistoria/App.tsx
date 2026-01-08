
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Download, 
  Trash2, 
  Camera as CameraIcon, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Trash, 
  Save, 
  Target, 
  History, 
  Plus,
  ChevronRight,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { AppState, LocationData, SessionData, CapturedPhoto, InspectionBatch } from './types';
import SessionForm from './components/SessionForm';
import CameraView from './components/CameraView';
import { applyWatermark } from './utils/imageProcessor';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.PERMISSION_CHECK);
  const [location, setLocation] = useState<LocationData>({ latitude: null, longitude: null, accuracy: null });
  const [session, setSession] = useState<SessionData | null>(null);
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [history, setHistory] = useState<InspectionBatch[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<InspectionBatch | null>(null);

  useEffect(() => {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist();
    }
  }, []);

  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          });
          if (appState === AppState.PERMISSION_CHECK) {
            setAppState(AppState.SETUP);
          }
        },
        (err) => {
          console.error('GPS Error:', err);
          if (appState === AppState.PERMISSION_CHECK) setAppState(AppState.SETUP);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [appState]);

  const handleCapture = async (blob: Blob) => {
    if (!session) return;
    setIsProcessing(true);
    try {
      const { url, filename } = await applyWatermark(blob, location, session, photos.length);
      const newPhoto: CapturedPhoto = {
        id: crypto.randomUUID(),
        url,
        timestamp: new Date().toISOString(),
        location,
        filename
      };
      setPhotos(prev => [...prev, newPhoto]);
    } catch (err) {
      console.error('Watermark error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const deletePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const saveToHistory = () => {
    if (!session || photos.length === 0) return;
    
    const newBatch: InspectionBatch = {
      id: crypto.randomUUID(),
      session: { ...session },
      photos: [...photos],
      createdAt: new Date().toISOString()
    };
    
    setHistory(prev => [newBatch, ...prev]);
    setPhotos([]);
    setSession(null);
    setAppState(AppState.HISTORY);
  };

  const downloadBatch = (batchPhotos: CapturedPhoto[]) => {
    batchPhotos.forEach(photo => {
      const link = document.createElement('a');
      link.href = photo.url;
      link.download = photo.filename;
      link.click();
    });
  };

  const resetCurrentBuffer = () => {
    if (window.confirm('Descartar todas as fotos do buffer atual?')) {
      setPhotos([]);
      setSession(null);
      setAppState(AppState.SETUP);
    }
  };

  if (appState === AppState.PERMISSION_CHECK) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8">
        <div className="relative mb-8">
          <div className="w-20 h-20 border-[6px] border-slate-900 border-t-blue-600 rounded-full animate-spin"></div>
          <Target className="absolute inset-0 m-auto text-blue-500/50" size={32} />
        </div>
        <h2 className="text-xl font-black text-white uppercase italic">Nordeste <span className="text-blue-500">Pro</span></h2>
      </div>
    );
  }

  if (appState === AppState.SETUP) {
    return (
      <div className="relative">
        <SessionForm onSubmit={(data) => { setSession(data); setAppState(AppState.CAMERA); }} />
        {history.length > 0 && (
          <button 
            onClick={() => setAppState(AppState.HISTORY)}
            className="fixed bottom-6 right-6 p-4 bg-slate-800 text-blue-400 rounded-full shadow-2xl border border-white/10 z-20 flex items-center gap-2 font-bold text-xs uppercase"
          >
            <History size={20} />
            Histórico ({history.length})
          </button>
        )}
      </div>
    );
  }

  if (appState === AppState.CAMERA && session) {
    return (
      <div className="relative h-screen overflow-hidden">
        <CameraView 
          session={session}
          location={location}
          photoCount={photos.length}
          onCapture={handleCapture}
          onFinish={() => setAppState(AppState.REVIEW)}
          onCancel={resetCurrentBuffer}
        />
        {isProcessing && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-[60]">
             <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
             <p className="text-white text-xs font-black uppercase tracking-[0.3em]">Processando Carimbo...</p>
          </div>
        )}
      </div>
    );
  }

  if (appState === AppState.REVIEW && session) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <header className="bg-slate-900 p-6 pt-12 border-b border-white/5 sticky top-0 z-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-black text-white italic uppercase">Revisão do Lote</h2>
            <button onClick={() => setAppState(AppState.CAMERA)} className="p-2 bg-slate-800 rounded-lg text-blue-400"><CameraIcon size={20} /></button>
          </div>
          <div className="flex gap-2 text-[10px] font-mono text-slate-400">
             <span className="px-2 py-1 bg-black rounded border border-white/5 uppercase">PAT: {session.assetId}</span>
             <span className="px-2 py-1 bg-black rounded border border-white/5 uppercase truncate max-w-[150px]">{session.client}</span>
          </div>
        </header>
        <main className="flex-1 p-4 grid grid-cols-2 gap-3 overflow-y-auto pb-32">
          {photos.map((photo, i) => (
            <div key={photo.id} className="relative aspect-[3/4] bg-slate-900 rounded-xl overflow-hidden border border-white/5">
              <img src={photo.url} className="w-full h-full object-cover" />
              <button onClick={() => deletePhoto(photo.id)} className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg shadow-lg"><Trash size={14} /></button>
            </div>
          ))}
        </main>
        <footer className="fixed bottom-0 left-0 right-0 p-6 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 flex gap-4">
          <button onClick={resetCurrentBuffer} className="flex-1 py-4 bg-slate-800 text-slate-400 font-bold rounded-2xl border border-white/5 flex items-center justify-center gap-2">
            <Trash2 size={18} /> LIMPAR
          </button>
          <button onClick={saveToHistory} className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-900/40 flex items-center justify-center gap-2">
            <Save size={18} /> FINALIZAR LOTE
          </button>
        </footer>
      </div>
    );
  }

  if (appState === AppState.HISTORY) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col animate-in fade-in duration-300">
        <header className="p-6 pt-12 bg-slate-900 border-b border-white/5 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
               <History size={24} className="text-blue-500" />
               <h2 className="text-xl font-black text-white uppercase italic">Arquivos <span className="text-blue-500">Pro</span></h2>
            </div>
            <button 
              onClick={() => setAppState(AppState.SETUP)}
              className="p-3 bg-blue-600 rounded-full text-white shadow-lg active:scale-90 transition-transform"
            >
              <Plus size={20} />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-4 overflow-y-auto pb-24">
          {history.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-700 space-y-2">
              <History size={48} strokeWidth={1} />
              <p className="text-xs font-bold uppercase tracking-widest">Nenhuma vistoria salva</p>
            </div>
          ) : (
            history.map((batch) => (
              <div key={batch.id} className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 hover:border-blue-500/30 transition-colors group">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1">
                      <Calendar size={10} /> {new Date(batch.createdAt).toLocaleDateString('pt-BR')} às {new Date(batch.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <h3 className="text-lg font-black text-red-500 font-mono italic">PAT: {batch.session.assetId}</h3>
                    <p className="text-xs text-slate-300 font-bold uppercase truncate max-w-[200px]">{batch.session.client}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-[9px] font-black rounded-lg border border-blue-500/20 uppercase tracking-tighter">
                      {batch.photos.length} Fotos
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-4 pt-4 border-t border-white/5">
                  <button 
                    onClick={() => downloadBatch(batch.photos)}
                    className="flex-1 py-3 bg-slate-800 text-slate-200 text-xs font-black rounded-xl border border-white/5 flex items-center justify-center gap-2 hover:bg-slate-700 active:scale-95 transition-all"
                  >
                    <Download size={14} /> BAIXAR TODOS
                  </button>
                  <button 
                    onClick={() => { setSelectedBatch(batch); }}
                    className="p-3 bg-blue-600/10 text-blue-500 rounded-xl border border-blue-500/20 active:scale-95 transition-all"
                  >
                    <ExternalLink size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </main>

        {/* Modal de Detalhes do Lote */}
        {selectedBatch && (
          <div className="fixed inset-0 z-[100] bg-black/95 animate-in fade-in duration-300 flex flex-col">
            <header className="p-6 pt-12 flex justify-between items-center border-b border-white/5 bg-slate-950">
               <div>
                 <h2 className="text-lg font-black text-white italic uppercase">Vistoria Detalhada</h2>
                 <p className="text-[10px] text-slate-500 font-mono uppercase">Batch ID: {selectedBatch.id.slice(0,8)}</p>
               </div>
               <button onClick={() => setSelectedBatch(null)} className="p-3 bg-slate-900 rounded-full text-white"><ChevronRight className="rotate-180" /></button>
            </header>
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3">
               {selectedBatch.photos.map(p => (
                 <div key={p.id} className="aspect-[3/4] rounded-xl overflow-hidden border border-white/10 bg-slate-900">
                    <img src={p.url} className="w-full h-full object-cover" />
                 </div>
               ))}
            </div>
            <div className="p-6 bg-slate-900 border-t border-white/10">
               <button 
                onClick={() => downloadBatch(selectedBatch.photos)}
                className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl flex items-center justify-center gap-3"
               >
                 <Download size={20} /> DOWNLOAD LOTE COMPLETO
               </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default App;
