
import React, { useState } from 'react';
import { ClipboardList, User, Camera, ArrowRight, ShieldCheck } from 'lucide-react';
import { SessionData } from '../types';

interface SessionFormProps {
  onSubmit: (data: SessionData) => void;
}

const SessionForm: React.FC<SessionFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<SessionData>({ assetId: '', client: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.assetId && formData.client) {
      onSubmit(formData);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 overflow-y-auto">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-900/20">
            <Camera size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white uppercase italic">
            Nordeste <span className="text-blue-500">Pro</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium">Sistema de Vistoria de Campo v2.6</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 backdrop-blur-sm space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Nº Patrimônio</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <ClipboardList size={18} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="EX: EQ-9942"
                  className="block w-full pl-11 pr-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-700 font-mono font-bold"
                  value={formData.assetId}
                  onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Cliente / Obra</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User size={18} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="NOME DO CLIENTE"
                  className="block w-full pl-11 pr-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-700 font-bold uppercase"
                  value={formData.client}
                  onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-blue-900/40 transition-all active:scale-95"
          >
            INICIAR CÂMERA
            <ArrowRight size={20} />
          </button>
        </form>

        <div className="flex items-center justify-center gap-3 py-4 border-t border-slate-900">
           <ShieldCheck size={16} className="text-slate-500" />
           <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Dados criptografados e invioláveis</span>
        </div>
      </div>
    </div>
  );
};

export default SessionForm;
