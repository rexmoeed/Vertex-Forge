import React, { useState } from 'react';
import { useIDE } from '../../context/IDEContext';
import { X, Sparkles, Layers, Check } from 'lucide-react';
import { Archetype } from '../../types/ide';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose }) => {
  const { createNewProject } = useIDE();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [archetype, setArchetype] = useState<Archetype>('fullstack-saas');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    await createNewProject(name.trim(), description.trim() || 'A new software project planned with Vertex Forge.', archetype);
    setIsSubmitting(false);
    onClose();
  };

  const archetypes: { id: Archetype; title: string; stack: string; icon: string }[] = [
    { id: 'fullstack-saas', title: 'Full-Stack SaaS', stack: 'React 19 + TypeScript + Express + PostgreSQL', icon: '⚡' },
    { id: 'web-react', title: 'Modern React App', stack: 'React 19 + TypeScript + Tailwind CSS + Vitest', icon: '⚛️' },
    { id: 'mobile-react-native', title: 'Mobile (React Native)', stack: 'Expo SDK 52 + TypeScript + Native Bridges', icon: '📱' },
    { id: 'backend-fastapi', title: 'FastAPI Microservice', stack: 'Python 3.12 + Pydantic v2 + SQLite/Postgres', icon: '🐍' },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-slate-100">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Create New Software Project</h2>
              <p className="text-xs text-slate-400">Describe what to build; AI Architect will plan the stack</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300">Project Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., VertexPay Invoicing Platform"
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300">Natural Language Goal & Requirements</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe user roles, key features, database models, APIs, and design guidelines..."
              className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-indigo-500 h-24 resize-none leading-relaxed"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-300">Technology Archetype</label>
            <div className="grid grid-cols-2 gap-2">
              {archetypes.map(a => (
                <div
                  key={a.id}
                  onClick={() => setArchetype(a.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 ${
                    archetype === a.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{a.icon}</span>
                    {archetype === a.id && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                  <span className="text-xs font-bold">{a.title}</span>
                  <span className="text-[10px] text-slate-400 truncate">{a.stack}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Architecting...' : 'Initialize Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
