
import React, { useState } from 'react';
import { User } from '../types';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  ArrowDownTrayIcon,
  UserIcon,
  PencilSquareIcon,
  TrashIcon,
  KeyIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

interface TechnicianManagementProps {
  users: User[];
  onSaveUser: (user: User) => void;
}

export const TechnicianManagement: React.FC<TechnicianManagementProps> = ({ users, onSaveUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User>>({});

  const technicians = users.filter(u => u.role === 'TECHNICIAN' || u.role === 'ADMIN'); // Show all for now

  const filteredUsers = technicians.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateNew = () => {
    setEditingUser({
      role: 'TECHNICIAN',
      active: true,
      createdAt: new Date().toISOString()
    });
    setShowModal(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser({ ...user });
    setShowModal(true);
  };

  const handleDelete = (user: User) => {
    if (confirm(`Weet je zeker dat je ${user.name} wilt deactiveren?`)) {
        onSaveUser({ ...user, active: false });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser.email || !editingUser.name) return;

    const userToSave: User = {
        id: editingUser.id || crypto.randomUUID(),
        email: editingUser.email!,
        name: editingUser.name!,
        role: editingUser.role as 'ADMIN' | 'TECHNICIAN' || 'TECHNICIAN',
        active: editingUser.active ?? true,
        phone: editingUser.phone,
        password: editingUser.password || 'password123', // Default if new
        createdAt: editingUser.createdAt || new Date().toISOString(),
    };

    onSaveUser(userToSave);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-zinc-900">Techniekers Beheer</h2>
           <p className="text-zinc-500">{technicians.length} gebruikers</p>
        </div>
        <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded-lg bg-white text-zinc-700 hover:bg-zinc-50 font-medium transition-colors">
                <ArrowDownTrayIcon className="w-5 h-5" /> Export
            </button>
            <button 
                onClick={handleCreateNew}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg shadow-blue-600/20 transition-all"
            >
                <PlusIcon className="w-5 h-5" /> Nieuwe Technieker
            </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col md:flex-row gap-4">
         <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-5 h-5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
                type="text"
                placeholder="Zoek op naam of e-mail..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
         </div>
         <select className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-zinc-700">
             <option>Alle statussen</option>
             <option>Actief</option>
             <option>Verwijderd</option>
         </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                        <th className="px-6 py-4 font-semibold text-zinc-600 text-sm">Naam</th>
                        <th className="px-6 py-4 font-semibold text-zinc-600 text-sm">E-mail</th>
                        <th className="px-6 py-4 font-semibold text-zinc-600 text-sm">Telefoon</th>
                        <th className="px-6 py-4 font-semibold text-zinc-600 text-sm">Status</th>
                        <th className="px-6 py-4 font-semibold text-zinc-600 text-sm">Aangemaakt</th>
                        <th className="px-6 py-4 font-semibold text-zinc-600 text-sm text-right">Acties</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                    {filteredUsers.map(user => (
                        <tr key={user.id} className="hover:bg-zinc-50/50 transition-colors group">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                                        {user.name.charAt(0)}
                                    </div>
                                    <span className="font-medium text-zinc-900">{user.name}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-zinc-600 text-sm">
                                <div className="flex items-center gap-2">
                                    <EnvelopeIcon className="w-4 h-4 text-zinc-400" />
                                    {user.email}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-zinc-600 text-sm">
                                <div className="flex items-center gap-2">
                                    {user.phone ? (
                                        <>
                                            <PhoneIcon className="w-4 h-4 text-zinc-400" />
                                            {user.phone}
                                        </>
                                    ) : '-'}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    user.active 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                    {user.active ? 'Actief' : 'Verwijderd'}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-zinc-500 text-sm">
                                {new Date(user.createdAt).toLocaleDateString('nl-BE')}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(user)} className="p-1.5 hover:bg-zinc-100 rounded text-zinc-500 hover:text-blue-600" title="Bewerken">
                                        <PencilSquareIcon className="w-5 h-5" />
                                    </button>
                                    <button className="p-1.5 hover:bg-zinc-100 rounded text-zinc-500 hover:text-amber-600" title="Wachtwoord Reset">
                                        <KeyIcon className="w-5 h-5" />
                                    </button>
                                    {user.active && (
                                        <button onClick={() => handleDelete(user)} className="p-1.5 hover:bg-zinc-100 rounded text-zinc-500 hover:text-red-600" title="Deactiveren">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                <h3 className="text-xl font-bold mb-4">{editingUser.id ? 'Technieker Bewerken' : 'Nieuwe Technieker'}</h3>
                
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Naam</label>
                        <input 
                            type="text" 
                            required
                            value={editingUser.name || ''}
                            onChange={e => setEditingUser(prev => ({...prev, name: e.target.value}))}
                            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">E-mail (Gebruikersnaam)</label>
                        <input 
                            type="email" 
                            required
                            value={editingUser.email || ''}
                            onChange={e => setEditingUser(prev => ({...prev, email: e.target.value}))}
                            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Telefoonnummer</label>
                        <input 
                            type="tel" 
                            value={editingUser.phone || ''}
                            onChange={e => setEditingUser(prev => ({...prev, phone: e.target.value}))}
                            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    
                    {!editingUser.id && (
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">Tijdelijk Wachtwoord</label>
                            <input 
                                type="text" 
                                required
                                value={editingUser.password || ''}
                                onChange={e => setEditingUser(prev => ({...prev, password: e.target.value}))}
                                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                placeholder="bv. Welkom123!"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Rol</label>
                        <select
                            value={editingUser.role || 'TECHNICIAN'}
                            onChange={e => setEditingUser(prev => ({...prev, role: e.target.value as any}))}
                            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="TECHNICIAN">Technieker</option>
                            <option value="ADMIN">Beheerder</option>
                        </select>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button 
                            type="button" 
                            onClick={() => setShowModal(false)}
                            className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium rounded-lg"
                        >
                            Annuleren
                        </button>
                        <button 
                            type="submit" 
                            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
                        >
                            Opslaan
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};