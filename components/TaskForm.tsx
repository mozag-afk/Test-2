
import React, { useState } from 'react';
import { Task, TaskType, Outcome, ProductSelection, TaskProduct, TASK_TYPES, OUTCOMES, INSTALL_PRODUCT_OPTIONS, OTHER_PRODUCTS_LIST } from '../types';
import { 
  CameraIcon, 
  TrashIcon, 
  WrenchScrewdriverIcon, 
  WifiIcon, 
  SignalIcon, 
  ComputerDesktopIcon, 
  ServerStackIcon, 
  FaceFrownIcon, 
  HomeModernIcon, 
  ChevronUpDownIcon,
  ClipboardDocumentListIcon,
  LifebuoyIcon
} from '@heroicons/react/24/outline';

interface TaskFormProps {
  initialTask?: Task | null;
  currentUser: any;
  onSave: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onCancel: () => void;
}

// Icon mapping for Task Types
const TASK_TYPE_ICONS: Record<string, React.ElementType> = {
  'Repair': WrenchScrewdriverIcon,
  'Install 0': SignalIcon,
  'Install 1': WifiIcon,
  'Install 2': ComputerDesktopIcon,
  'Install 3': ServerStackIcon,
  'Proj unhappy': FaceFrownIcon,
  'Proj inhome large': HomeModernIcon,
  'DIY support': LifebuoyIcon
};

// Color mapping for Task Types to provide visual reference
const TASK_TYPE_COLORS: Record<string, string> = {
  'Repair': 'text-amber-500',
  'Install 0': 'text-emerald-500',
  'Install 1': 'text-emerald-500',
  'Install 2': 'text-emerald-500',
  'Install 3': 'text-emerald-500',
  'Proj unhappy': 'text-red-500',
  'Proj inhome large': 'text-purple-500',
  'DIY support': 'text-cyan-500'
};

export const TaskForm: React.FC<TaskFormProps> = ({ initialTask, currentUser, onSave, onDelete, onCancel }) => {
  const [customerNumber, setCustomerNumber] = useState(initialTask?.customerNumber || '');
  const [type, setType] = useState<TaskType>(initialTask?.type || 'Repair');
  const [outcome, setOutcome] = useState<Outcome>(initialTask?.outcome || '');
  const [notes, setNotes] = useState(initialTask?.notes || '');
  const [photos, setPhotos] = useState<string[]>(initialTask?.photos || []);
  
  // Custom dropdown state
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  
  // Products
  const [installProducts, setInstallProducts] = useState<ProductSelection[]>(initialTask?.installProducts || []);
  const [otherProducts, setOtherProducts] = useState<TaskProduct[]>(initialTask?.otherProducts || []);

  const isInstallType = ['Install 1', 'Install 2', 'Install 3'].includes(type);

  const handleInstallProductToggle = (category: 'MODEM' | 'NIU' | 'TV BOX') => {
    const exists = installProducts.find(p => p.category === category);
    if (exists) {
      setInstallProducts(prev => prev.filter(p => p.category !== category));
    } else {
      setInstallProducts(prev => [...prev, { category, model: '' }]);
    }
  };

  const handleInstallModelChange = (category: string, model: string) => {
    setInstallProducts(prev => prev.map(p => p.category === category ? { ...p, model } : p));
  };

  const handleOtherProductChange = (name: string, quantity: number) => {
    if (quantity <= 0) {
      setOtherProducts(prev => prev.filter(p => p.name !== name));
    } else {
      setOtherProducts(prev => {
        const existing = prev.find(p => p.name === name);
        if (existing) {
          return prev.map(p => p.name === name ? { ...p, quantity } : p);
        }
        return [...prev, { name, quantity }];
      });
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setPhotos(prev => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = (status: 'DRAFT' | 'COMPLETED') => {
    if (status === 'COMPLETED' && !outcome) {
      alert("Outcome is verplicht voor afronding.");
      return;
    }
    
    const task: Task = {
      id: initialTask?.id || crypto.randomUUID(),
      technicianId: currentUser.id,
      technicianName: currentUser.name,
      customerNumber,
      type,
      outcome, // Can be empty if DRAFT
      date: initialTask?.date || new Date().toISOString(),
      installProducts: isInstallType ? installProducts : [],
      otherProducts,
      photos,
      notes,
      status,
      updatedAt: new Date().toISOString()
    };
    onSave(task);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    if (initialTask && onDelete) {
        if (confirm("Ben je zeker dat je deze taak wilt verwijderen? Dit kan niet ongedaan gemaakt worden.")) {
            onDelete(initialTask.id);
        }
    }
  }

  // Get the icon and color for the currently selected type
  const SelectedTypeIcon = TASK_TYPE_ICONS[type] || ClipboardDocumentListIcon;
  const selectedTypeColor = TASK_TYPE_COLORS[type] || 'text-zinc-400';

  return (
    <div className="bg-zinc-900 min-h-screen text-zinc-100 p-4 md:p-6 pb-24">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">{initialTask ? 'Bewerk Taak' : 'Nieuwe Taak'}</h2>
            <div className="flex items-center gap-3">
                {initialTask && onDelete && (
                    <button 
                        type="button"
                        onClick={handleDelete}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors border border-red-500/20 text-sm font-medium"
                    >
                        <TrashIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Verwijderen</span>
                    </button>
                )}
                <button type="button" onClick={onCancel} className="text-zinc-400 hover:text-white">Annuleren</button>
            </div>
        </div>

        {/* Basic Info */}
        <div className="space-y-4 bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
            <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Klantennummer</label>
                <input 
                    type="text" 
                    value={customerNumber}
                    onChange={e => setCustomerNumber(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 focus:border-blue-500 outline-none"
                    placeholder="12345678"
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Custom Dropdown for Task Type */}
                <div className="relative">
                    <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Type Taak</label>
                    <button 
                        type="button"
                        onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 flex items-center justify-between focus:border-blue-500 outline-none text-left group"
                    >
                        <div className="flex items-center gap-2">
                           <SelectedTypeIcon className={`w-5 h-5 ${selectedTypeColor}`} />
                           <span className="font-medium">{type}</span>
                        </div>
                        <ChevronUpDownIcon className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
                    </button>

                    {isTypeDropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsTypeDropdownOpen(false)}></div>
                            <div className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
                                {TASK_TYPES.map(t => {
                                    const Icon = TASK_TYPE_ICONS[t] || ClipboardDocumentListIcon;
                                    const iconColor = TASK_TYPE_COLORS[t] || 'text-zinc-400';
                                    return (
                                        <div 
                                            key={t}
                                            onClick={() => { setType(t); setIsTypeDropdownOpen(false); }}
                                            className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${type === t ? 'bg-blue-600/20' : 'hover:bg-zinc-700'}`}
                                        >
                                            <Icon className={`w-5 h-5 ${iconColor}`} />
                                            <span className={type === t ? 'text-blue-400 font-medium' : 'text-zinc-300'}>{t}</span>
                                            {type === t && <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>}
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-medium text-zinc-400 uppercase mb-1">Outcome</label>
                    <select 
                        value={outcome}
                        onChange={e => setOutcome(e.target.value as Outcome)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 focus:border-blue-500 outline-none"
                    >
                        <option value="">Selecteer...</option>
                        {OUTCOMES.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                </div>
            </div>
        </div>

        {/* Install Products Logic */}
        {isInstallType && (
            <div className="bg-zinc-800/50 p-4 rounded-lg border border-blue-900/30">
                <h3 className="text-sm font-bold text-blue-400 mb-4 uppercase tracking-wider">Installatie Producten</h3>
                <div className="space-y-4">
                    {(['MODEM', 'NIU', 'TV BOX'] as const).map(category => {
                        const selection = installProducts.find(p => p.category === category);
                        const isChecked = !!selection;

                        return (
                            <div key={category} className="flex flex-col space-y-2">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={isChecked}
                                        onChange={() => handleInstallProductToggle(category)}
                                        className="w-4 h-4 rounded bg-zinc-900 border-zinc-600 text-blue-500"
                                    />
                                    <span className="font-medium">{category}</span>
                                </label>
                                
                                {isChecked && (
                                    <select 
                                        value={selection?.model || ''}
                                        onChange={e => handleInstallModelChange(category, e.target.value)}
                                        className="ml-6 w-64 bg-zinc-900 border border-zinc-700 rounded p-2 text-sm"
                                    >
                                        <option value="">Kies model...</option>
                                        {INSTALL_PRODUCT_OPTIONS[category].map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* Other Products */}
        <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
            <h3 className="text-sm font-bold text-zinc-400 mb-4 uppercase tracking-wider">Overige Materialen</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {OTHER_PRODUCTS_LIST.map(prod => {
                    const currentQty = otherProducts.find(p => p.name === prod)?.quantity || 0;
                    return (
                        <div key={prod} className="flex items-center justify-between bg-zinc-900/50 p-2 rounded border border-zinc-800">
                            <span className="text-xs text-zinc-300 truncate mr-2" title={prod}>{prod}</span>
                            <div className="flex items-center space-x-1 bg-zinc-800 rounded">
                                <button 
                                    type="button"
                                    onClick={() => handleOtherProductChange(prod, currentQty - 1)}
                                    className="w-6 h-6 flex items-center justify-center hover:bg-zinc-700 rounded"
                                >-</button>
                                <span className="w-6 text-center text-xs">{currentQty}</span>
                                <button 
                                    type="button"
                                    onClick={() => handleOtherProductChange(prod, currentQty + 1)}
                                    className="w-6 h-6 flex items-center justify-center hover:bg-zinc-700 rounded"
                                >+</button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Photos & Notes */}
        <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
            <label className="block text-xs font-medium text-zinc-400 uppercase mb-2">Verslag / Opmerkingen</label>
            <textarea 
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 min-h-[80px]"
                placeholder="Typ hier details..."
            />

            <div className="mt-4">
                <label className="block text-xs font-medium text-zinc-400 uppercase mb-2">Foto's</label>
                <div className="flex flex-wrap gap-2">
                    {photos.map((p, idx) => (
                        <div key={idx} className="relative w-20 h-20 rounded overflow-hidden group">
                            <img src={p} alt="Task" className="w-full h-full object-cover" />
                            <button 
                                type="button"
                                onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <TrashIcon className="w-5 h-5 text-red-400" />
                            </button>
                        </div>
                    ))}
                    <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 rounded cursor-pointer hover:border-zinc-500 hover:bg-zinc-800/50 transition-colors">
                        <CameraIcon className="w-6 h-6 text-zinc-500" />
                        <span className="text-[9px] text-zinc-500 mt-1">Toevoegen</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                </div>
            </div>
        </div>

        {/* Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-900 border-t border-zinc-800 flex gap-3 z-50">
            <button 
                type="button"
                onClick={() => handleSubmit('DRAFT')}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-lg border border-zinc-700"
            >
                Opslaan als concept
            </button>
            <button 
                type="button"
                onClick={() => handleSubmit('COMPLETED')}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!customerNumber || !outcome}
            >
                Afronden
            </button>
        </div>
      </div>
    </div>
  );
};