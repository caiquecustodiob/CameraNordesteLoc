
import React, { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';

interface CustomModalProps {
  title: string;
  message: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value?: string) => void;
  showInput?: boolean;
  confirmText?: string;
  placeholder?: string;
}

const CustomModal: React.FC<CustomModalProps> = ({
  title,
  message,
  isOpen,
  onClose,
  onConfirm,
  showInput = false,
  confirmText = "Confirmar",
  placeholder = "Digite aqui..."
}) => {
  const [inputValue, setInputValue] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <X size={20} className="text-slate-400" />
            </button>
          </div>
          <p className="text-slate-300 mb-6">{message}</p>
          
          {showInput && (
            <input
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.toUpperCase())}
              placeholder={placeholder}
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
              onKeyDown={(e) => e.key === 'Enter' && onConfirm(inputValue)}
            />
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => onConfirm(showInput ? inputValue : undefined)}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-colors"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomModal;
