import { useEffect, useState } from "react";
import { type ITip } from "../assets/assets";
import SoftBackdrop from "../components/SoftBackdrop";
import { useNavigate } from "react-router-dom";
import { TrashIcon, FolderIcon, FolderOpenIcon, PlusIcon, ArrowLeftIcon, XIcon } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import api from "../configs/api";
import toast from "react-hot-toast";

const SPECIALTY_ICONS: Record<string, string> = {
  "Cardiologie": "🫀", "Neurologie": "🧠", "Pharmacologie": "💊",
  "Pneumologie": "🫁", "Gastroentérologie": "🩺", "Néphrologie": "🔬",
  "Endocrinologie": "⚗️", "Infectiologie": "🦠", "Hématologie": "🩸",
  "Rhumatologie": "🦴", "Chirurgie": "🔪", "Pédiatrie": "👶",
  "Gynécologie": "🌸", "Psychiatrie": "🧘", "Dermatologie": "🌿",
  "Urgences": "🚨", "Anatomie": "📐", "Biochimie": "🧪",
  "Physiologie": "⚡", "Immunologie": "🛡️", "Ophtalmologie": "👁️",
  "ORL": "👂", "Urologie": "💧", "Oncologie": "🎗️",
  "Radiologie": "📡", "General": "📚"
};

interface IFolder { _id: string; name: string; specialty: string; }
interface TipWithMeta extends ITip { specialty?: string; group?: string; }

const MyGeneration = () => {
  const { isSignedIn, getToken } = useAuth();
  const navigate = useNavigate();
  const [tips, setTips] = useState<TipWithMeta[]>([]);
  const [folders, setFolders] = useState<IFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'specialties' | 'specialty' | 'folder'>('specialties');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<IFolder | null>(null);

  // Modals
  const [folderModal, setFolderModal] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [folderLoading, setFolderLoading] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [assignTipId, setAssignTipId] = useState<string | null>(null);

  const getHeaders = async () => {
    const token = await getToken();
    return { Authorization: `Bearer ${token}` };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = await getHeaders();
      const [tipsRes, foldersRes] = await Promise.all([
        api.get('/api/user/tips', { headers }),
        api.get('/api/user/folders', { headers }),
      ]);
      setTips(tipsRes.data.tips || []);
      setFolders(foldersRes.data.folders || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      const headers = await getHeaders();
      await api.delete(`/api/tip/delete/${id}`, { headers });
      toast.success('Tip deleted');
      setTips(prev => prev.filter(t => t._id !== id));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim() || !selectedSpecialty) return;
    try {
      setFolderLoading(true);
      const headers = await getHeaders();
      const { data } = await api.post('/api/user/folders', {
        name: folderName.trim(),
        specialty: selectedSpecialty
      }, { headers });
      setFolders(prev => [data.folder, ...prev]);
      setFolderModal(false);
      setFolderName('');
      toast.success(`Folder "${data.folder.name}" created!`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setFolderLoading(false);
    }
  };

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    if (!window.confirm(`Delete folder "${folderName}"? Tips will be ungrouped.`)) return;
    try {
      const headers = await getHeaders();
      await api.delete(`/api/user/folders/${folderId}`, { headers });
      setFolders(prev => prev.filter(f => f._id !== folderId));
      setTips(prev => prev.map(t => t.group === folderName ? { ...t, group: undefined } : t));
      toast.success('Folder deleted');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  const handleAssignGroup = async (tipId: string, group: string | null) => {
    try {
      const headers = await getHeaders();
      await api.post(`/api/user/tip/${tipId}/group`, { group }, { headers });
      setTips(prev => prev.map(t => t._id === tipId ? { ...t, group: group || undefined } : t));
      setAssignModal(false);
      toast.success(group ? `Moved to "${group}"` : 'Removed from folder');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    if (isSignedIn) fetchData();
  }, [isSignedIn]);

  // Grouper par spécialité
  const bySpecialty = tips.reduce((acc: Record<string, TipWithMeta[]>, tip) => {
    const s = tip.specialty || 'General';
    if (!acc[s]) acc[s] = [];
    acc[s].push(tip);
    return acc;
  }, {});

  const specialtyTips = selectedSpecialty ? (bySpecialty[selectedSpecialty] || []) : [];
  const specialtyFolders = folders.filter(f => f.specialty === selectedSpecialty);
  const ungrouped = specialtyTips.filter(t => !t.group);
  const folderTips = selectedFolder ? specialtyTips.filter(t => t.group === selectedFolder.name) : [];
  const assignTip = tips.find(t => t._id === assignTipId);

  return (
    <>
      <SoftBackdrop />
      <div className="mt-32 min-h-screen px-6 md:px-16 lg:px-24 xl:px-32 pb-20">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {view !== 'specialties' && (
              <button
                onClick={() => {
                  if (view === 'folder') { setView('specialty'); setSelectedFolder(null); }
                  else { setView('specialties'); setSelectedSpecialty(null); }
                }}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
              >
                <ArrowLeftIcon size={18} />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-zinc-200">
                {view === 'specialties' && 'My Generations'}
                {view === 'specialty' && `${SPECIALTY_ICONS[selectedSpecialty!] || '📚'} ${selectedSpecialty}`}
                {view === 'folder' && `📁 ${selectedFolder?.name}`}
              </h1>
              <p className="text-sm text-zinc-400 mt-1">
                {view === 'specialties' && 'Organized by specialty'}
                {view === 'specialty' && `${specialtyTips.length} tips · ${specialtyFolders.length} folders`}
                {view === 'folder' && `${folderTips.length} tips`}
              </p>
            </div>
          </div>

          {view === 'specialty' && (
            <button
              onClick={() => setFolderModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 transition text-sm font-medium"
            >
              <PlusIcon size={16} /> New Folder
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white/6 border border-white/10 animate-pulse h-32" />
            ))}
          </div>
        ) : (
          <>
            {/* VUE SPÉCIALITÉS */}
            {view === 'specialties' && (
              Object.keys(bySpecialty).length === 0 ? (
                <div className="text-center py-24">
                  <p className="text-4xl mb-4">📚</p>
                  <h3 className="text-lg font-semibold text-zinc-200">No tips yet</h3>
                  <p className="text-sm text-zinc-400 mt-2">Generate your first tip to see it here</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(bySpecialty).map(([specialty, stips]) => (
                    <button
                      key={specialty}
                      onClick={() => { setSelectedSpecialty(specialty); setView('specialty'); }}
                      className="text-left rounded-2xl bg-white/6 border border-white/10 hover:border-pink-500 transition p-6 group"
                    >
                      <div className="text-4xl mb-3">{SPECIALTY_ICONS[specialty] || '📚'}</div>
                      <h3 className="text-lg font-semibold text-zinc-200 group-hover:text-pink-400 transition">{specialty}</h3>
                      <p className="text-sm text-zinc-400 mt-1">{stips.length} tip{stips.length > 1 ? 's' : ''}</p>
                    </button>
                  ))}
                </div>
              )
            )}

            {/* VUE SPÉCIALITÉ */}
            {view === 'specialty' && selectedSpecialty && (
              <div className="space-y-8">

                {/* Dossiers */}
                {specialtyFolders.length > 0 && (
                  <div>
                    <h2 className="text-base font-semibold text-zinc-300 mb-4">📁 Folders</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {specialtyFolders.map(folder => {
                        const count = specialtyTips.filter(t => t.group === folder.name).length;
                        return (
                          <div key={folder._id} className="group relative">
                            <button
                              onClick={() => { setSelectedFolder(folder); setView('folder'); }}
                              className="w-full text-left rounded-2xl bg-white/6 border border-white/10 hover:border-pink-500 transition p-5"
                            >
                              <FolderOpenIcon size={28} className="text-pink-400 mb-2" />
                              <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-pink-400 transition">{folder.name}</h3>
                              <p className="text-xs text-zinc-400 mt-1">{count} tip{count !== 1 ? 's' : ''}</p>
                            </button>
                            <button
                              onClick={() => handleDeleteFolder(folder._id, folder.name)}
                              className="absolute top-3 right-3 p-1.5 bg-black/50 rounded hover:bg-pink-600 transition opacity-0 group-hover:opacity-100"
                            >
                              <TrashIcon size={13} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tips non groupés */}
                {ungrouped.length > 0 && (
                  <div>
                    <h2 className="text-base font-semibold text-zinc-300 mb-4">
                      {specialtyFolders.length > 0 ? '📌 Ungrouped Tips' : 'Tips'}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {ungrouped.map(tip => (
                        <TipCard
                          key={tip._id}
                          tip={tip}
                          onNavigate={() => navigate(`/generate/${tip._id}`)}
                          onDelete={() => handleDelete(tip._id)}
                          onAssign={() => { setAssignTipId(tip._id); setAssignModal(true); }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {specialtyFolders.length === 0 && ungrouped.length === 0 && (
                  <p className="text-zinc-400 text-sm">No tips in this specialty yet.</p>
                )}
              </div>
            )}

            {/* VUE DOSSIER */}
            {view === 'folder' && selectedFolder && (
              folderTips.length === 0 ? (
                <div className="text-center py-24">
                  <p className="text-4xl mb-4">📁</p>
                  <h3 className="text-lg font-semibold text-zinc-200">Empty folder</h3>
                  <p className="text-sm text-zinc-400 mt-2">Go back and move tips into this folder</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {folderTips.map(tip => (
                    <TipCard
                      key={tip._id}
                      tip={tip}
                      onNavigate={() => navigate(`/generate/${tip._id}`)}
                      onDelete={() => handleDelete(tip._id)}
                      onAssign={() => { setAssignTipId(tip._id); setAssignModal(true); }}
                    />
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>

      {/* MODAL NOUVEAU DOSSIER */}
      {folderModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">New Folder</h3>
              <button onClick={() => { setFolderModal(false); setFolderName(''); }}>
                <XIcon size={18} className="text-zinc-400" />
              </button>
            </div>
            <input
              type="text"
              value={folderName}
              onChange={e => setFolderName(e.target.value)}
              placeholder="e.g. Chest Pain"
              autoFocus
              className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/6 text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-pink-500 mb-4"
              onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder(); }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setFolderModal(false); setFolderName(''); }}
                className="flex-1 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={folderLoading || !folderName.trim()}
                className="flex-1 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 disabled:opacity-50 transition text-sm font-medium"
              >
                {folderLoading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ASSIGNER DOSSIER */}
      {assignModal && assignTip && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-semibold">Move to Folder</h3>
              <button onClick={() => setAssignModal(false)}>
                <XIcon size={18} className="text-zinc-400" />
              </button>
            </div>
            <p className="text-xs text-zinc-400 mb-4 line-clamp-1">{assignTip.title}</p>

            {specialtyFolders.length === 0 ? (
              <p className="text-sm text-zinc-400 mb-4">No folders yet — create one first.</p>
            ) : (
              <div className="space-y-2 mb-4">
                {specialtyFolders.map(f => (
                  <button
                    key={f._id}
                    onClick={() => handleAssignGroup(assignTip._id, f.name)}
                    className={`w-full text-left px-4 py-2.5 rounded-lg border transition text-sm text-white flex items-center gap-2 ${
                      assignTip.group === f.name
                        ? 'bg-pink-600/20 border-pink-500'
                        : 'bg-white/6 border-white/10 hover:border-pink-500'
                    }`}
                  >
                    <FolderIcon size={14} className="text-pink-400" /> {f.name}
                    {assignTip.group === f.name && <span className="ml-auto text-xs text-pink-400">current</span>}
                  </button>
                ))}
              </div>
            )}

            {assignTip.group && (
              <button
                onClick={() => handleAssignGroup(assignTip._id, null)}
                className="w-full py-2 rounded-lg text-sm text-zinc-400 hover:text-white transition border border-white/10 hover:border-white/30"
              >
                ✕ Remove from folder
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

const TipCard = ({ tip, onNavigate, onDelete, onAssign }: {
  tip: TipWithMeta;
  onNavigate: () => void;
  onDelete: () => void;
  onAssign: () => void;
}) => (
  <div className="group relative cursor-pointer rounded-2xl bg-white/6 border border-white/10 hover:border-pink-500 transition shadow-xl p-5">
    <div onClick={onNavigate}>
      <p className="text-xs uppercase text-pink-400 mb-1">{tip.type}</p>
      <h3 className="text-sm font-semibold text-zinc-200 mb-2 line-clamp-2">{tip.title}</h3>
      {tip.interests && tip.interests.length > 0 && (
        <p className="text-xs text-zinc-500 line-clamp-1">Based on: {tip.interests.join(", ")}</p>
      )}
    </div>
    <div className="absolute top-3 right-3 hidden group-hover:flex gap-2">
      <button
        onClick={e => { e.stopPropagation(); onAssign(); }}
        className="p-1.5 bg-black/50 rounded hover:bg-pink-600/50 transition"
        title="Move to folder"
      >
        <FolderIcon size={14} />
      </button>
      <button
        onClick={e => { e.stopPropagation(); onDelete(); }}
        className="p-1.5 bg-black/50 rounded hover:bg-pink-600 transition"
      >
        <TrashIcon size={14} />
      </button>
    </div>
  </div>
);

export default MyGeneration;

