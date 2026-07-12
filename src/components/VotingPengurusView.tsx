import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Calendar,
  User,
  Users,
  Building,
  Info,
  Trash2,
  AlertCircle,
  Vote,
  FileText,
  BarChart3,
  Check,
  ChevronRight,
  HelpCircle,
  Edit,
} from 'lucide-react';
import { VotingItem, VoteType, User as UserType, Progja, Role, OrgMember } from '../types';

interface VotingPengurusViewProps {
  currentUser: UserType;
  votingList: VotingItem[];
  progjaList: Progja[];
  orgMembers: OrgMember[];
  onUpdateState: (newState: any) => void;
  onAddNotification: (content: string, type: string) => void;
  initialSelectedVotingId?: string | null;
  onClearInitialSelectedVotingId?: () => void;
}

export default function VotingPengurusView({
  currentUser,
  votingList,
  progjaList,
  orgMembers,
  onUpdateState,
  onAddNotification,
  initialSelectedVotingId,
  onClearInitialSelectedVotingId,
}: VotingPengurusViewProps) {
  // Tabs and filter states
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'SEMUA' | 'PROGJA' | 'AGENDA'>('SEMUA');
  const [activeStatusFilter, setActiveStatusFilter] = useState<'SEMUA' | 'AKTIF' | 'SELESAI'>('SEMUA');

  // Creation form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'PROGJA' | 'AGENDA'>('PROGJA');
  const [newDescription, setNewDescription] = useState('');
  const [newTargetId, setNewTargetId] = useState('');
  const [newEndDate, setNewEndDate] = useState(() => {
    // Default is 7 days from now
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Auto-select and trigger edit mode from public portal redirection
  useEffect(() => {
    if (initialSelectedVotingId) {
      const found = votingList.find((v) => v.id === initialSelectedVotingId);
      if (found) {
        setActiveCategoryFilter('SEMUA');
        setActiveStatusFilter('SEMUA');
        
        const canEdit = currentUser.role === 'admin_master' || found.createdByNik === currentUser.nik;
        if (canEdit) {
          setNewTitle(found.title);
          setNewType(found.type);
          setNewDescription(found.description);
          setNewTargetId(found.targetId || '');
          setNewEndDate(found.endDate);
          setIsEditMode(true);
          setEditingId(found.id);
          setShowCreateModal(true);
        }
      }
      if (onClearInitialSelectedVotingId) {
        onClearInitialSelectedVotingId();
      }
    }
  }, [initialSelectedVotingId, votingList, currentUser.role, currentUser.nik, onClearInitialSelectedVotingId]);

  // Check if a voting item is active
  const isVotingActive = (item: VotingItem) => {
    return item.endDate >= todayStr;
  };

  // Filter voting items based on selection
  const filteredVotings = useMemo(() => {
    return votingList.filter((item) => {
      const matchesCategory = activeCategoryFilter === 'SEMUA' || item.type === activeCategoryFilter;
      const isActive = isVotingActive(item);
      const matchesStatus =
        activeStatusFilter === 'SEMUA' ||
        (activeStatusFilter === 'AKTIF' && isActive) ||
        (activeStatusFilter === 'SELESAI' && !isActive);
      return matchesCategory && matchesStatus;
    });
  }, [votingList, activeCategoryFilter, activeStatusFilter, todayStr]);

  // Compute stats
  const stats = useMemo(() => {
    const total = votingList.length;
    const active = votingList.filter(isVotingActive).length;
    const closed = total - active;
    const userVotesCast = votingList.filter((item) => item.votes[currentUser.nik] !== undefined).length;

    return { total, active, closed, userVotesCast };
  }, [votingList, currentUser.nik]);

  // Handle casting a vote
  const handleCastVote = (votingId: string, choice: VoteType) => {
    const targetItem = votingList.find((v) => v.id === votingId);
    if (!targetItem) return;

    if (!isVotingActive(targetItem)) {
      onAddNotification('Voting sudah berakhir dan tidak dapat menerima suara lagi.', 'warning');
      return;
    }

    const updatedVotingList = votingList.map((item) => {
      if (item.id === votingId) {
        return {
          ...item,
          votes: {
            ...item.votes,
            [currentUser.nik]: choice,
          },
        };
      }
      return item;
    });

    // Create activity log
    const logDesc = `${currentUser.name} memberikan suara "${choice}" pada voting "${targetItem.title}".`;
    const newLog = {
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userNik: currentUser.nik,
      userName: currentUser.name,
      userRole: currentUser.role,
      category: 'system' as const,
      action: 'Berikan Suara',
      description: logDesc,
    };

    onUpdateState({
      votingList: updatedVotingList,
      activityLogs: [newLog], // Parent app.tsx merges it with existing logs
    });

    onAddNotification(`Suara Anda (${choice}) berhasil disimpan!`, 'success');
  };

  // Handle deleting/closing a voting item (Only for creator or admin_master)
  const handleDeleteVoting = (id: string) => {
    const item = votingList.find((v) => v.id === id);
    if (!item) return;

    if (currentUser.role !== 'admin_master' && item.createdByNik !== currentUser.nik) {
      onAddNotification('Hanya pembuat voting atau Admin Master yang dapat menghapus voting ini.', 'warning');
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus voting: "${item.title}"?`)) {
      const updatedList = votingList.filter((v) => v.id !== id);

      const newLog = {
        id: 'log-' + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        userNik: currentUser.nik,
        userName: currentUser.name,
        userRole: currentUser.role,
        category: 'system' as const,
        action: 'Hapus Voting',
        description: `Menghapus voting: "${item.title}" (Tipe: ${item.type})`,
      };

      onUpdateState({
        votingList: updatedList,
        activityLogs: [newLog],
      });

      onAddNotification('Voting berhasil dihapus.', 'info');
    }
  };

  // Close voting early
  const handleCloseVotingEarly = (id: string) => {
    const item = votingList.find((v) => v.id === id);
    if (!item) return;

    if (currentUser.role !== 'admin_master' && item.createdByNik !== currentUser.nik) {
      onAddNotification('Hanya pembuat atau Admin Master yang dapat menutup voting lebih awal.', 'warning');
      return;
    }

    // Set end date to yesterday to mark as closed
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const updatedList = votingList.map((v) => {
      if (v.id === id) {
        return {
          ...v,
          endDate: yesterdayStr,
        };
      }
      return v;
    });

    const newLog = {
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userNik: currentUser.nik,
      userName: currentUser.name,
      userRole: currentUser.role,
      category: 'system' as const,
      action: 'Tutup Voting Awal',
      description: `Menutup voting "${item.title}" lebih awal dari jadwal semula.`,
    };

    onUpdateState({
      votingList: updatedList,
      activityLogs: [newLog],
    });

    onAddNotification('Voting telah ditutup secara manual.', 'info');
  };

  // Submit new voting item
  const handleCreateVoting = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTitle.trim() || !newDescription.trim()) {
      onAddNotification('Harap lengkapi judul dan deskripsi voting.', 'warning');
      return;
    }

    if (isEditMode && editingId) {
      const updatedList = votingList.map((item) => {
        if (item.id === editingId) {
          return {
            ...item,
            title: newTitle,
            type: newType,
            description: newDescription,
            targetId: newType === 'PROGJA' && newTargetId ? newTargetId : undefined,
            endDate: newEndDate,
          };
        }
        return item;
      });

      const newLog = {
        id: 'log-' + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        userNik: currentUser.nik,
        userName: currentUser.name,
        userRole: currentUser.role,
        category: 'system' as const,
        action: 'Edit Voting',
        description: `Memperbarui rincian voting: "${newTitle}" (${newType}) s/d tanggal ${newEndDate}.`,
      };

      onUpdateState({
        votingList: updatedList,
        activityLogs: [newLog],
      });

      onAddNotification('Detail voting berhasil diperbarui!', 'success');
    } else {
      const newVotingItem: VotingItem = {
        id: 'v-' + Math.random().toString(36).substr(2, 9),
        title: newTitle,
        type: newType,
        description: newDescription,
        targetId: newType === 'PROGJA' && newTargetId ? newTargetId : undefined,
        votes: {},
        createdAt: todayStr,
        endDate: newEndDate,
        createdByNik: currentUser.nik,
        createdByName: currentUser.name,
        createdByRole: currentUser.role,
      };

      const newLog = {
        id: 'log-' + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        userNik: currentUser.nik,
        userName: currentUser.name,
        userRole: currentUser.role,
        category: 'system' as const,
        action: 'Buat Voting',
        description: `Memulai voting baru: "${newTitle}" (${newType}) s/d tanggal ${newEndDate}.`,
      };

      onUpdateState({
        votingList: [newVotingItem, ...votingList],
        activityLogs: [newLog],
      });

      onAddNotification('Voting baru berhasil dibuat dan siap menerima hak suara pengurus!', 'success');
    }

    // Reset fields
    setNewTitle('');
    setNewDescription('');
    setNewTargetId('');
    setIsEditMode(false);
    setEditingId(null);
    setShowCreateModal(false);
  };

  // Helper to check if a user is allowed to create voting items
  const canCreateVoting = useMemo(() => {
    const allowedRoles: Role[] = ['ketua', 'pengawas', 'sekretaris', 'admin_master'];
    return allowedRoles.includes(currentUser.role);
  }, [currentUser.role]);

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-red-100 shadow-sm">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-red-50 text-red-700 rounded-lg">
              <Vote className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 font-display">Sistem Voting Pengurus</h2>
          </div>
          <p className="text-xs text-slate-500 max-w-xl">
            Sistem pengambilan keputusan mufakat pengurus koperasi secara transparan untuk pengesahan Program Kerja (Progja) baru dan penyetujuan Agenda Rapat.
          </p>
        </div>

        {canCreateVoting && (
          <button
            onClick={() => {
              setNewTitle('');
              setNewDescription('');
              setNewTargetId('');
              setIsEditMode(false);
              setEditingId(null);
              setShowCreateModal(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer hover:shadow-md hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            Mulai Voting Baru
          </button>
        )}
      </div>

      {/* QUICK STATS DASHBOARD BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-red-100 shadow-3xs flex items-center gap-3 text-left">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <Vote className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Voting</p>
            <p className="text-lg font-extrabold text-slate-950 font-display">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-3xs flex items-center gap-3 text-left">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Voting Aktif</p>
            <p className="text-lg font-extrabold text-emerald-600 font-display">{stats.active}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-3xs flex items-center gap-3 text-left">
          <div className="p-3 bg-slate-100 text-slate-500 rounded-xl">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Voting Selesai</p>
            <p className="text-lg font-extrabold text-slate-600 font-display">{stats.closed}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-3xs flex items-center gap-3 text-left">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Partisipasi Anda</p>
            <p className="text-lg font-extrabold text-blue-700 font-display">
              {stats.userVotesCast} <span className="text-xs text-slate-400 font-medium">dari {stats.total}</span>
            </p>
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS & HEADLINE */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveCategoryFilter('SEMUA')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeCategoryFilter === 'SEMUA' ? 'bg-white text-slate-900 shadow-3xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setActiveCategoryFilter('PROGJA')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeCategoryFilter === 'PROGJA' ? 'bg-white text-red-700 shadow-3xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Program Kerja (Progja)
          </button>
          <button
            onClick={() => setActiveCategoryFilter('AGENDA')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeCategoryFilter === 'AGENDA' ? 'bg-white text-blue-700 shadow-3xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Agenda Rapat
          </button>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveStatusFilter('SEMUA')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeStatusFilter === 'SEMUA' ? 'bg-white text-slate-900 shadow-3xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Semua Status
          </button>
          <button
            onClick={() => setActiveStatusFilter('AKTIF')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeStatusFilter === 'AKTIF' ? 'bg-white text-emerald-700 shadow-3xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Masih Aktif
          </button>
          <button
            onClick={() => setActiveStatusFilter('SELESAI')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeStatusFilter === 'SELESAI' ? 'bg-white text-rose-700 shadow-3xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Telah Berakhir
          </button>
        </div>
      </div>

      {/* VOTING ITEMS CONTAINER LIST */}
      <div className="space-y-4">
        {filteredVotings.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-red-100 text-center space-y-4 max-w-lg mx-auto shadow-3xs">
            <div className="p-4 bg-red-50 text-red-500 rounded-full w-fit mx-auto animate-wiggle">
              <Vote className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">Tidak ada voting ditemukan</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Belum ada pengajuan voting untuk parameter filter saat ini. Klik tombol di atas untuk menginisiasi voting baru jika Anda adalah Ketua, Pengawas, atau Sekretaris.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredVotings.map((item) => {
              const isActive = isVotingActive(item);
              const userVote = item.votes[currentUser.nik];
              
              // Find related progja if exists
              const relatedProgja = item.targetId ? progjaList.find(p => p.id === item.targetId) : null;

              // Calculate vote breakdowns
              const totalVotes = Object.keys(item.votes).length;
              const counts = {
                SETUJU: Object.values(item.votes).filter(v => v === 'SETUJU').length,
                TOLAK: Object.values(item.votes).filter(v => v === 'TOLAK').length,
                ABSTAIN: Object.values(item.votes).filter(v => v === 'ABSTAIN').length,
              };

              const pct = {
                SETUJU: totalVotes > 0 ? Math.round((counts.SETUJU / totalVotes) * 100) : 0,
                TOLAK: totalVotes > 0 ? Math.round((counts.TOLAK / totalVotes) * 100) : 0,
                ABSTAIN: totalVotes > 0 ? Math.round((counts.ABSTAIN / totalVotes) * 100) : 0,
              };

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-3xl border p-6 flex flex-col justify-between gap-5 relative overflow-hidden transition-all shadow-3xs hover:shadow-xs ${
                    isActive ? 'border-slate-200' : 'border-slate-200 bg-slate-50/40'
                  }`}
                >
                  {/* Category & Status Indicators Ribbon */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                          item.type === 'PROGJA'
                            ? 'bg-red-50 text-red-700 border border-red-100'
                            : 'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}
                      >
                        {item.type === 'PROGJA' ? 'Sirkulasi Progja' : 'Agenda Rapat'}
                      </span>
                      {relatedProgja && (
                        <span className="text-[10px] text-slate-500 font-mono font-semibold bg-slate-100 px-2 py-0.5 rounded-md">
                          Sektor: {relatedProgja.sector}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                        {isActive ? 'Aktif' : 'Selesai'}
                      </span>

                      {/* Delete and Edit button (creator/admin) */}
                      {(currentUser.role === 'admin_master' || item.createdByNik === currentUser.nik) && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setNewTitle(item.title);
                              setNewType(item.type);
                              setNewDescription(item.description);
                              setNewTargetId(item.targetId || '');
                              setNewEndDate(item.endDate);
                              setIsEditMode(true);
                              setEditingId(item.id);
                              setShowCreateModal(true);
                            }}
                            title="Edit Rincian Voting"
                            className="p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {isActive && (
                            <button
                              onClick={() => handleCloseVotingEarly(item.id)}
                              title="Tutup Voting Lebih Awal"
                              className="p-1 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteVoting(item.id)}
                            title="Hapus Voting"
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-extrabold text-slate-900 leading-snug tracking-tight font-display text-left">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-normal text-left">
                      {item.description}
                    </p>
                  </div>

                  {/* Related Work Program (PROGJA) Box Info if linked */}
                  {relatedProgja && (
                    <div className="bg-slate-50/85 rounded-2xl p-3.5 border border-red-100/55 text-xs text-left space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-red-600" />
                          Rincian Program Terkait
                        </span>
                        <span className="text-red-700 font-mono font-extrabold">Rp {relatedProgja.budget.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                        <div>
                          <p className="font-bold">PIC Bidang:</p>
                          <p>{relatedProgja.picName} ({relatedProgja.picRole.replace(/_/g, ' ')})</p>
                        </div>
                        <div>
                          <p className="font-bold">Target Tanggal:</p>
                          <p className="font-semibold">{relatedProgja.targetDate}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* VOTE PROGRESS BAR (TRANS-COLOR STACKED BAR) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
                      <span>Prosentase Persetujuan ({totalVotes} Suara Masuk)</span>
                      <span className="font-mono">{pct.SETUJU}% Setuju</span>
                    </div>

                    {/* Progress stacked bar container */}
                    <div className="w-full h-3 bg-slate-100 rounded-full flex overflow-hidden">
                      {totalVotes === 0 ? (
                        <div className="w-full h-full bg-slate-200 text-center text-[8px] text-slate-400 font-bold flex items-center justify-center">
                          Belum ada suara masuk
                        </div>
                      ) : (
                        <>
                          <div
                            style={{ width: `${pct.SETUJU}%` }}
                            className="bg-emerald-500 h-full transition-all duration-500 border-r border-white/40"
                            title={`Setuju: ${counts.SETUJU} suara (${pct.SETUJU}%)`}
                          />
                          <div
                            style={{ width: `${pct.TOLAK}%` }}
                            className="bg-rose-500 h-full transition-all duration-500 border-r border-white/40"
                            title={`Tolak: ${counts.TOLAK} suara (${pct.TOLAK}%)`}
                          />
                          <div
                            style={{ width: `${pct.ABSTAIN}%` }}
                            className="bg-slate-400 h-full transition-all duration-500"
                            title={`Abstain: ${counts.ABSTAIN} suara (${pct.ABSTAIN}%)`}
                          />
                        </>
                      )}
                    </div>

                    {/* Numerical legends */}
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-emerald-600">✔ {counts.SETUJU} Setuju</span>
                      <span className="text-rose-600">✘ {counts.TOLAK} Tolak</span>
                      <span className="text-slate-500">⚫ {counts.ABSTAIN} Abstain</span>
                    </div>
                  </div>

                  {/* VOTING BUTTONS INTERACTION INTERACTIVE PANEL */}
                  <div className="border-t border-slate-150 pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-left">
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Prakarsa:</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span className="text-xs font-bold text-slate-700">
                          {item.createdByName} <span className="font-medium text-slate-400">({item.createdByRole.replace(/_/g, ' ')})</span>
                        </span>
                      </div>
                    </div>

                    {isActive ? (
                      /* If active, allow board member to cast their vote */
                      <div className="space-y-1">
                        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider sm:text-right">
                          Berikan Pilihan Suara Anda:
                        </p>
                        <div className="flex gap-1.5 p-0.5 bg-slate-100 rounded-xl border border-slate-200">
                          <button
                            onClick={() => handleCastVote(item.id, 'SETUJU')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              userVote === 'SETUJU'
                                ? 'bg-emerald-600 text-white shadow-3xs'
                                : 'text-slate-600 hover:bg-slate-200/60'
                            }`}
                          >
                            Setuju
                          </button>
                          <button
                            onClick={() => handleCastVote(item.id, 'TOLAK')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              userVote === 'TOLAK'
                                ? 'bg-rose-600 text-white shadow-3xs'
                                : 'text-slate-600 hover:bg-slate-200/60'
                            }`}
                          >
                            Tolak
                          </button>
                          <button
                            onClick={() => handleCastVote(item.id, 'ABSTAIN')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              userVote === 'ABSTAIN'
                                ? 'bg-slate-600 text-white shadow-3xs'
                                : 'text-slate-600 hover:bg-slate-200/60'
                            }`}
                          >
                            Abstain
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* If closed, show final result statement */
                      <div className="bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-center text-xs font-bold text-slate-600">
                        {counts.SETUJU > counts.TOLAK ? (
                          <span className="text-emerald-700">✔ DISAHKAN (Mayoritas Setuju)</span>
                        ) : counts.TOLAK > counts.SETUJU ? (
                          <span className="text-rose-700">✘ DITOLAK (Mayoritas Menolak)</span>
                        ) : (
                          <span>⚫ BERAKHIR SEIMBANG</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* TRANSPARENT VOTERS DETAIL EXPAND PANEL */}
                  <div className="bg-slate-50/50 p-2.5 rounded-2xl border border-slate-100 text-left">
                    <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                      <Users className="w-3 h-3" /> Transparansi Suara Pengurus:
                    </p>
                    {totalVotes === 0 ? (
                      <p className="text-[10px] text-slate-400 italic">Belum ada pengurus yang menyumbangkan suara.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(item.votes).map(([vNik, vChoice]) => {
                          const vMember = orgMembers.find(m => m.nik === vNik) || { name: `NIK: ${vNik}`, role: 'pengurus' as Role };
                          return (
                            <span
                              key={vNik}
                              title={`${vMember.name} (${vMember.role.replace(/_/g, ' ')})`}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold border ${
                                vChoice === 'SETUJU'
                                  ? 'bg-emerald-50/80 text-emerald-800 border-emerald-100'
                                  : vChoice === 'TOLAK'
                                  ? 'bg-rose-50/80 text-rose-800 border-rose-100'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {vMember.name.split(',')[0]} (
                              {vChoice === 'SETUJU' ? '✔' : vChoice === 'TOLAK' ? '✘' : '⚫'}
                              )
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* END DATE METADATA INFO */}
                  <div className="absolute bottom-2 right-4 flex items-center gap-1 text-[8px] text-slate-400 font-mono">
                    <Calendar className="w-2.5 h-2.5" />
                    <span>Batas Waktu: {item.endDate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE NEW VOTING MODAL OVERLAY */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white rounded-3xl w-full max-w-xl border border-slate-200 shadow-2xl overflow-hidden text-left"
          >
            {/* Header */}
            <div className="bg-red-700 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Vote className="w-5 h-5" />
                <h3 className="font-bold text-sm font-display">
                  {isEditMode ? 'Edit Detail Voting Pemufakatan' : 'Buat Voting Pemufakatan Baru'}
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5 text-white/80" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateVoting} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                  Judul Voting / Agenda
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Persetujuan Alokasi Anggaran Audit Koperasi"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:ring-1 focus:ring-red-500 rounded-xl text-xs outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                    Kategori Voting
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => {
                      const val = e.target.value as 'PROGJA' | 'AGENDA';
                      setNewType(val);
                      if (val === 'AGENDA') setNewTargetId('');
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:ring-1 focus:ring-red-500 rounded-xl text-xs outline-hidden"
                  >
                    <option value="PROGJA">Sirkulasi Progja (Program Kerja)</option>
                    <option value="AGENDA">Agenda Rapat / Umum</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                    Batas Akhir Pemilihan (Batas Tanggal)
                  </label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    min={todayStr}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:ring-1 focus:ring-red-500 rounded-xl text-xs outline-hidden"
                    required
                  />
                </div>
              </div>

              {/* Show dropdown to select related Progja if type is PROGJA */}
              {newType === 'PROGJA' && (
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                    Hubungkan dengan Program Kerja (Terkait)
                  </label>
                  <select
                    value={newTargetId}
                    onChange={(e) => setNewTargetId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:ring-1 focus:ring-red-500 rounded-xl text-xs outline-hidden"
                  >
                    <option value="">-- Pilih program kerja yang disirkulasikan --</option>
                    {progjaList.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.status}] {p.title} - Rp {p.budget.toLocaleString('id-ID')} ({p.picName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                  Deskripsi & Konsensus Permasalahan
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Detail penjelasan mufakat, alasan voting, serta opsi persetujuan yang diajukan..."
                  rows={4}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:ring-1 focus:ring-red-500 rounded-xl text-xs outline-hidden leading-normal resize-none"
                  required
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer text-center transition-colors"
                >
                  Batalkan
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer text-center transition-colors shadow-xs"
                >
                  {isEditMode ? 'Simpan Perubahan' : 'Luncurkan Voting'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
