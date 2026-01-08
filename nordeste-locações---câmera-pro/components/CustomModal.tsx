
import React, { useState } from 'react';
import { X, User, Tag } from 'lucide-react';

interface CustomModalProps {
  title: string;
  message: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data?: { patrimonio: string, cliente: string }) => void;
  showInput?: boolean;
  confirmText?: string;
}

const CustomModal: React.FC<CustomModalProps> = ({
  title,
  message,
  isOpen,
  onClose,
  onConfirm,
  showInput = false,
  confirmText = "Confirmar"
}) => {
  const [patrimonio, setPatrimonio] = useState('');
  const [cliente, setCliente] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (showInput) {
      onConfirm({ patrimonio, cliente });
    } else {
      onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Overlay mais escuro para foco total */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-slate-900 border-t sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        <div className="p-8 pb-12 sm:pb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-black text-white tracking-tighter italic uppercase">{title}</h3>
            <button onClick={onClose} className="p-3 bg-white/5 rounded-full">
              <X size={24} className="text-slate-400" />
            </button>
          </div>
          <p className="text-slate-400 text-base mb-8">{message}</p>
          
          {showInput && (
            <div className="space-y-6 mb-10">
              <div>
                <label className="text-[11px] font-black text-blue-500 uppercase mb-2 block ml-1 tracking-[0.2em]">Número do Patrimônio</label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                  <input
                    autoFocus
                    type="text"
                    inputMode="text"
                    value={patrimonio}
                    onChange={(e) => setPatrimonio(e.target.value.toUpperCase())}
                    placeholder="Ex: NL-001"
                    className="w-full bg-slate-800 border border-white/10 rounded-2xl pl-12 pr-4 py-5 text-white text-base focus:outline-none focus:ring-4 focus:ring-blue-600/20 transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black text-blue-500 uppercase mb-2 block ml-1 tracking-[0.2em]">Nome do Cliente</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                  <input
                    type="text"
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                    placeholder="Ex: João Silva"
                    className="w-full bg-slate-800 border border-white/10 rounded-2xl pl-12 pr-4 py-5 text-white text-base focus:outline-none focus:ring-4 focus:ring-blue-600/20 transition-all placeholder:text-slate-600"
                    onKeyDown={(e) => e.key === 'Enter' && patrimonio && cliente && handleConfirm()}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <button
              onClick={handleConfirm}
              className="w-full py-5 px-6 bg-blue-600 hover:bg-blue-500 text-white font-black text-lg rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-95"
            >
              {confirmText}
            </button>
            <button
              onClick={onClose}
              className="w-full py-5 px-6 bg-slate-800 text-slate-400 font-bold text-lg rounded-2xl transition-all active:scale-95"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomModal;
