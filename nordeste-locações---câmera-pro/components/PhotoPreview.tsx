
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
        
        // Pequeno atraso para não sobrecarregar o gerenciador de downloads do navegador
        if (images.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    } catch (err) {
      console.error('Download Error:', err);
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
      } catch (err) {
        console.error('Sharing failed:', err);
      }
    } else {
      alert('Compartilhamento múltiplo não disponível neste navegador.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="p-4 flex justify-between items-center bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <button onClick={onClose} className="p-2 rounded-full bg-white/10 text-white">
          <X size={24} />
        </button>
        <div className="flex flex-col items-center">
          <span className="font-bold text-slate-200">Sessão de Vistoria</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest">{images.length} Fotos Capturadas</span>
        </div>
        <button onClick={onClearAll} className="p-2 rounded-full bg-red-500/20 text-red-400" title="Limpar Tudo">
          <Trash2 size={24} />
        </button>
      </div>

      {/* Grid Display */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-950">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((image) => (
            <div key={image.id} className="relative aspect-square group">
              <img 
                src={image.url} 
                alt="Captured" 
                className="w-full h-full object-cover rounded-xl border border-white/10"
              />
              <button 
                onClick={() => onDeleteImage(image.id)}
                className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
        
        {images.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
             <Archive size={48} className="mb-4 opacity-20" />
             <p>Nenhuma foto capturada</p>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="p-6 grid grid-cols-2 gap-4 bg-slate-900/80 backdrop-blur-md border-t border-white/5">
        <button 
          onClick={handleDownloadAll}
          disabled={images.length === 0 || isDownloading}
          className="flex flex-col items-center justify-center gap-1 py-3 px-4 bg-slate-800 rounded-2xl font-bold text-white border border-white/10 hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-50"
        >
          {isDownloading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : <Download size={20} />}
          <span className="text-xs">Baixar Fotos</span>
        </button>
        <button 
          onClick={handleShareBatch}
          disabled={images.length === 0}
          className="flex flex-col items-center justify-center gap-1 py-3 px-4 bg-blue-600 rounded-2xl font-bold text-white hover:bg-blue-500 active:scale-95 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
        >
          <Share size={20} />
          <span className="text-xs">Compartilhar</span>
        </button>
      </div>
    </div>
  );
};

export default PhotoPreview;
