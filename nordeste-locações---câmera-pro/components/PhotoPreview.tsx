
import React from 'react';
import { StampedImage } from '../types';
import { Share, Download, X, Trash2 } from 'lucide-react';

interface PhotoPreviewProps {
  image: StampedImage;
  onClose: () => void;
  onDelete: () => void;
}

const PhotoPreview: React.FC<PhotoPreviewProps> = ({ image, onClose, onDelete }) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `vistoria_nordeste_${image.timestamp}.jpg`;
    link.click();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        const file = new File([image.blob], `vistoria_nordeste_${image.timestamp}.jpg`, { type: 'image/jpeg' });
        await navigator.share({
          files: [file],
          title: 'Vistoria Nordeste Locações',
          text: 'Registro fotográfico autenticado.'
        });
      } catch (err) {
        console.error('Sharing failed:', err);
      }
    } else {
      alert('Compartilhamento não disponível neste navegador. Use o botão de download.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="p-4 flex justify-between items-center bg-slate-900/80 backdrop-blur-md">
        <button onClick={onClose} className="p-2 rounded-full bg-white/10 text-white">
          <X size={24} />
        </button>
        <span className="font-semibold text-slate-200">Foto Carimbada</span>
        <button onClick={onDelete} className="p-2 rounded-full bg-red-500/20 text-red-400">
          <Trash2 size={24} />
        </button>
      </div>

      {/* Image Display */}
      <div className="flex-1 flex items-center justify-center p-4 bg-slate-950">
        <img 
          src={image.url} 
          alt="Captured" 
          className="max-w-full max-h-full rounded-lg shadow-2xl border border-white/10"
        />
      </div>

      {/* Footer Controls */}
      <div className="p-8 grid grid-cols-2 gap-4 bg-slate-900/80 backdrop-blur-md">
        <button 
          onClick={handleDownload}
          className="flex items-center justify-center gap-2 py-4 px-6 bg-slate-800 rounded-2xl font-bold text-white border border-white/10 hover:bg-slate-700 active:scale-95 transition-all"
        >
          <Download size={20} />
          <span>Baixar</span>
        </button>
        <button 
          onClick={handleShare}
          className="flex items-center justify-center gap-2 py-4 px-6 bg-blue-600 rounded-2xl font-bold text-white hover:bg-blue-500 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
        >
          <Share size={20} />
          <span>Enviar</span>
        </button>
      </div>
    </div>
  );
};

export default PhotoPreview;
