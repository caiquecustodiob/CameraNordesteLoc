
import React, { useState } from 'react';
import { StampedImage } from '../types';
import { Share, Download, X, Trash2, Archive, Loader2 } from 'lucide-react';

interface PhotoPreviewProps {
  images: StampedImage[];
  onClose: () => void;
  onDeleteImage: (id: string) => void;
  onClearAll: () => void;
}

const PhotoPreview: React.FC<PhotoPreviewProps> = ({ images, onClose, onDeleteImage, onClearAll }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadAll = async () => {
    if (images.length === 0) return;
    setIsDownloading(true);
    try {
      for (const [index, img] of images.entries()) {
        const link = document.createElement('a');
        link.href = img.url;
        link.download = `foto_${index + 1}_${img.timestamp}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (images.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 400));
        }
      }
    } catch (err) {
      alert('Erro ao baixar imagens.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareBatch = async () => {
    if (navigator.share && images.length > 0) {
      try {
        const files = images.map((img, index) => 
          new File([img.blob], `vistoria_${index + 1}.jpg`, { type: 'image/jpeg' })
        );
        await navigator.share({
          files: files,
          title: 'Vistorias Nordeste Locações',
          text: `Registro de ${images.length} fotos.`
        });
      } catch (err) {}
    } else {
      alert('Compartilhamento não disponível.');
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-slate-950 flex flex-col">
      {/* Header Mobile Otimizado */}
      <div className="pt-12 p-6 flex justify-between items-center bg-slate-900 border-b border-white/5">
        <button onClick={onClose} className="p-4 rounded-2xl bg-white/5 text-white active:scale-90 transition-transform">
          <X size={28} />
        </button>
        <div className="text-center">
          <span className="block font-black text-white italic tracking-tighter uppercase">Galeria</span>
          <span className="text-[10px] text-blue-500 font-black uppercase tracking-widest">{images.length} FOTOS</span>
        </div>
        <button onClick={onClearAll} className="p-4 rounded-2xl bg-red-500/10 text-red-500 active:scale-90 transition-transform">
          <Trash2 size={28} />
        </button>
      </div>

      {/* Grid com visualização maior */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
        <div className="grid grid-cols-2 gap-4">
          {images.map((image) => (
            <div key={image.id} className="relative aspect-[3/4] group">
              <img 
                src={image.url} 
                alt="Captured" 
                className="w-full h-full object-cover rounded-[2rem] border-2 border-white/10"
              />
              <button 
                onClick={() => onDeleteImage(image.id)}
                className="absolute top-3 right-3 p-3 bg-black/60 backdrop-blur-md rounded-2xl text-red-400 border border-white/10 active:scale-75 transition-transform"
              >
                <X size={20} />
              </button>
            </div>
          ))}
        </div>
        
        {images.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-700">
             <Archive size={80} className="mb-6 opacity-10" />
             <p className="font-black uppercase tracking-widest text-sm italic">Sessão vazia</p>
          </div>
        )}
      </div>

      {/* Footer Ações Grandes */}
      <div className="p-8 pb-12 flex flex-col gap-4 bg-slate-900 border-t border-white/5">
        <button 
          onClick={handleShareBatch}
          disabled={images.length === 0}
          className="w-full flex items-center justify-center gap-4 py-5 bg-blue-600 rounded-3xl font-black text-lg text-white shadow-2xl shadow-blue-600/30 active:scale-95 transition-all disabled:opacity-30"
        >
          <Share size={24} />
          COMPARTILHAR TUDO
        </button>
        
        <button 
          onClick={handleDownloadAll}
          disabled={images.length === 0 || isDownloading}
          className="w-full flex items-center justify-center gap-4 py-5 bg-slate-800 rounded-3xl font-black text-lg text-white border border-white/5 active:scale-95 transition-all disabled:opacity-30"
        >
          {isDownloading ? (
            <Loader2 size={24} className="animate-spin" />
          ) : <Download size={24} />}
          BAIXAR IMAGENS
        </button>
      </div>
    </div>
  );
};

export default PhotoPreview;
