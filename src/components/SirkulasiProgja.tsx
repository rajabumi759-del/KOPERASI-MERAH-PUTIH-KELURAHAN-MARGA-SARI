import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Briefcase,
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  FileSpreadsheet,
  Calendar,
  DollarSign,
  User,
  Users,
  MessageSquare,
  Upload,
  Printer,
  ChevronRight,
  Sparkles,
  Check,
  X,
  FileCheck2,
  Trash2,
  Info,
  Layers,
  ListTodo,
} from 'lucide-react';
import { Progja, Role, User as UserType, ProgjaStatus, OrgMember, SubTask } from '../types';

interface SirkulasiProgjaProps {
  progjaList: Progja[];
  currentUser: UserType;
  rolesList: { label: string; value: Role }[];
  orgMembers: OrgMember[];
  onSaveProgja: (progja: Progja) => void;
  onDeleteProgja: (id: string) => void;
  onAddNotification: (content: string, type: string) => void;
  initialSelectedProgjaId?: string | null;
  onClearInitialSelectedProgjaId?: () => void;
}

export default function SirkulasiProgja({
  progjaList,
  currentUser,
  rolesList,
  orgMembers,
  onSaveProgja,
  onDeleteProgja,
  onAddNotification,
  initialSelectedProgjaId,
  onClearInitialSelectedProgjaId,
}: SirkulasiProgjaProps) {
  // Tabs and forms state
  const [activeTab, setActiveTab] = useState<string>('SEMUA');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProgja, setSelectedProgja] = useState<Progja | null>(null);
  const [showPrintModal, setShowPrintModal] = useState<Progja | null>(null);

  // Form Mode State
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // New Progja Form State
  const [newTitle, setNewTitle] = useState('');
  const [newSector, setNewSector] = useState('Unit Usaha');
  const [newTargetDate, setNewTargetDate] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [newFundingSource, setNewFundingSource] = useState('Kas Operasional Koperasi');
  const [newIndicators, setNewIndicators] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCollaborators, setNewCollaborators] = useState<Role[]>([]);
  const [newPicNik, setNewPicNik] = useState(currentUser.nik);

  // Action Inputs State
  const [reviewComment, setReviewComment] = useState('');
  const [proofPhoto, setProofPhoto] = useState('');
  const [proofGallery, setProofGallery] = useState<string[]>([]);
  const [proofDesc, setProofDesc] = useState('');
  const [proofReportFile, setProofReportFile] = useState('');

  // Sub-task form states
  const [subTaskTitle, setSubTaskTitle] = useState('');
  const [subTaskAssignee, setSubTaskAssignee] = useState('');
  const [subTaskDueDate, setSubTaskDueDate] = useState('');
  const [showAddSubTaskForm, setShowAddSubTaskForm] = useState(false);

  // Auto-select and trigger edit mode from public portal redirection
  useEffect(() => {
    if (initialSelectedProgjaId) {
      const found = progjaList.find((p) => p.id === initialSelectedProgjaId);
      if (found) {
        setSelectedProgja(found);
        setActiveTab('SEMUA');
        
        // Check if user is allowed to edit this
        const canEdit = currentUser.role === 'admin_master' || currentUser.role === 'ketua' || found.picNik === currentUser.nik;
        if (canEdit) {
          setNewTitle(found.title);
          setNewSector(found.sector);
          setNewTargetDate(found.targetDate);
          setNewBudget(found.budget.toString());
          setNewFundingSource(found.fundingSource);
          setNewIndicators(found.indicators);
          setNewDescription(found.description);
          setNewCollaborators(found.collaborators);
          setNewPicNik(found.picNik);
          setIsEditMode(true);
          setEditingId(found.id);
          setShowCreateModal(true);
        }
      }
      if (onClearInitialSelectedProgjaId) {
        onClearInitialSelectedProgjaId();
      }
    }
  }, [initialSelectedProgjaId, progjaList, currentUser.role, currentUser.nik, onClearInitialSelectedProgjaId]);

  // Reset form helper
  const resetForm = () => {
    setNewTitle('');
    setNewSector('Unit Usaha');
    setNewTargetDate('');
    setNewBudget('');
    setNewFundingSource('Kas Operasional Koperasi');
    setNewIndicators('');
    setNewDescription('');
    setNewCollaborators([]);
    setNewPicNik(currentUser.nik);
    setIsEditMode(false);
    setEditingId(null);
  };

  // Export Program Kerja as CSV Spreadsheet
  const handleExportProgjaCSV = () => {
    try {
      const headers = 'ID,Nama Progja,PIC,Sektor,Tanggal Target,Anggaran,Sumber Dana,Status,Indikator Keberhasilan\n';
      const csvContent = progjaList.map(p => 
        `"${p.id}","${p.title.replace(/"/g, '""')}","${p.picName}","${p.sector}","${p.targetDate}","${p.budget}","${p.fundingSource || ''}","${p.status}","${(p.indicators || '').replace(/"/g, '""')}"`
      ).join('\n');
      
      const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Rekap_Progja_Koperasi_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onAddNotification('Berhasil mengunduh rekap Program Kerja (CSV Spreadsheet)', 'success');
    } catch (err) {
      onAddNotification('Gagal mengunduh rekap program kerja CSV', 'danger');
    }
  };

  // Handle new progja creation (Draft)
  const handleCreateProgja = (status: ProgjaStatus) => {
    if (!newTitle || !newTargetDate || !newBudget) {
      alert('Mohon isi Judul, Target Tanggal, dan Anggaran terlebih dahulu.');
      return;
    }

    const budgetNum = parseFloat(newBudget);
    if (isNaN(budgetNum) || budgetNum < 0) {
      alert('Anggaran harus berupa angka yang valid.');
      return;
    }

    // Find selected PIC info from orgMembers list
    const selectedPic = orgMembers.find((m) => m.nik === newPicNik) || {
      name: currentUser.name,
      role: currentUser.role,
    };

    if (isEditMode && editingId) {
      const originalProgja = progjaList.find((p) => p.id === editingId);
      // If original status was approved, implemented, or published, keep it. Otherwise use the passed status.
      const targetStatus = (originalProgja && ['DRAFT', 'REVISI', 'DIAJUKAN'].includes(originalProgja.status))
        ? status
        : (originalProgja?.status || status);

      const updatedProgja: Progja = {
        ...originalProgja!,
        title: newTitle,
        picNik: newPicNik,
        picName: selectedPic.name,
        picRole: selectedPic.role,
        sector: newSector,
        targetDate: newTargetDate,
        budget: budgetNum,
        fundingSource: newFundingSource,
        indicators: newIndicators,
        description: newDescription,
        collaborators: newCollaborators,
        status: targetStatus,
        updatedAt: new Date().toISOString().split('T')[0],
      };

      onSaveProgja(updatedProgja);
      
      const statusLabel = 
        targetStatus === 'DRAFT' ? 'Draft' :
        targetStatus === 'DIAJUKAN' ? 'Diajukan untuk Review' :
        targetStatus === 'DISETUJUI' ? 'Disetujui Ketua' :
        targetStatus === 'DILAKSANAKAN' ? 'Dilaksanakan' :
        targetStatus === 'DIPUBLIKASIKAN' ? 'Dipublikasikan (Portal Publik)' : targetStatus;

      onAddNotification(
        `Program Kerja "${newTitle}" berhasil diperbarui (Status: ${statusLabel})`,
        'success'
      );

      if (selectedProgja?.id === editingId) {
        setSelectedProgja(updatedProgja);
      }
    } else {
      const newProgjaItem: Progja = {
        id: 'p-' + Math.random().toString(36).substr(2, 9),
        title: newTitle,
        picNik: newPicNik,
        picName: selectedPic.name,
        picRole: selectedPic.role,
        sector: newSector,
        targetDate: newTargetDate,
        budget: budgetNum,
        fundingSource: newFundingSource,
        indicators: newIndicators,
        description: newDescription,
        collaborators: newCollaborators,
        status: status,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };

      onSaveProgja(newProgjaItem);
      onAddNotification(
        `Program Kerja "${newTitle}" berhasil dibuat sebagai ${status === 'DRAFT' ? 'Draft' : 'Diajukan untuk Review'}`,
        status === 'DIAJUKAN' ? 'info' : 'success'
      );
    }

    resetForm();
    setShowCreateModal(false);
  };

  // Check access to modify specific progja
  const canModifyProgja = (progja: Progja) => {
    if (currentUser.role === 'admin_master' || currentUser.role === 'ketua') return true;
    return progja.picNik === currentUser.nik;
  };

  // Submit draft/revision to Ketua
  const handleSubmitToKetua = (progja: Progja) => {
    const updated: Progja = {
      ...progja,
      status: 'DIAJUKAN',
      updatedAt: new Date().toISOString().split('T')[0],
    };
    onSaveProgja(updated);
    onAddNotification(
      `Progja "${progja.title}" dikirim ke Ketua untuk ditinjau & disetujui.`,
      'info'
    );
    if (selectedProgja?.id === progja.id) setSelectedProgja(updated);
  };

  // Ketua Action: Setujui (Moves to DISETUJUI)
  const handleKetuaApprove = (progja: Progja) => {
    const updated: Progja = {
      ...progja,
      status: 'DISETUJUI',
      notesFromKetua: reviewComment || progja.notesFromKetua,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    onSaveProgja(updated);
    onAddNotification(
      `Progja "${progja.title}" TELAH DISETUJUI oleh Ketua!`,
      'success'
    );
    setReviewComment('');
    setSelectedProgja(updated);
  };

  // Ketua Action: Revisi (Moves to REVISI with comments)
  const handleKetuaRevisi = (progja: Progja) => {
    if (!reviewComment) {
      alert('Mohon masukkan catatan revisi terlebih dahulu.');
      return;
    }
    const updated: Progja = {
      ...progja,
      status: 'REVISI',
      notesFromKetua: reviewComment,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    onSaveProgja(updated);
    onAddNotification(
      `Progja "${progja.title}" ditolak/diminta REVISI oleh Ketua.`,
      'warning'
    );
    setReviewComment('');
    setSelectedProgja(updated);
  };

  // Submit implementation proof (Moves to DILAKSANAKAN)
  const handleUploadProof = (progja: Progja) => {
    if (!proofDesc) {
      alert('Mohon isi deskripsi laporan/pelaksanaan terlebih dahulu.');
      return;
    }

    const defaultPhoto = proofPhoto || 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&q=80&w=600';
    const finalGallery = proofGallery.length > 0 ? proofGallery : [defaultPhoto];

    const updated: Progja = {
      ...progja,
      status: 'DILAKSANAKAN',
      proofPhoto: defaultPhoto,
      proofGallery: finalGallery,
      proofDescription: proofDesc,
      proofReport: proofReportFile || 'laporan_kegiatan_terselenggara.pdf',
      updatedAt: new Date().toISOString().split('T')[0],
    };
    onSaveProgja(updated);
    onAddNotification(
      `Dokumentasi progja "${progja.title}" berhasil diunggah! Menunggu validasi Ketua.`,
      'success'
    );
    setProofPhoto('');
    setProofGallery([]);
    setProofDesc('');
    setProofReportFile('');
    setSelectedProgja(updated);
  };

  // Ketua Action: Validasi Akhir (Moves to DIPUBLIKASIKAN)
  const handleKetuaValidate = (progja: Progja, isValid: boolean) => {
    if (isValid) {
      const updated: Progja = {
        ...progja,
        status: 'DIPUBLIKASIKAN',
        updatedAt: new Date().toISOString().split('T')[0],
      };
      onSaveProgja(updated);
      onAddNotification(
        `Progja "${progja.title}" VALIDASI BERHASIL! Sekarang terpublish di Portal Publik.`,
        'success'
      );
      setSelectedProgja(updated);
    } else {
      // Reject implementation, back to REVISI
      if (!reviewComment) {
        alert('Mohon masukkan alasan penolakan pada kolom komentar.');
        return;
      }
      const updated: Progja = {
        ...progja,
        status: 'REVISI',
        notesFromKetua: `Penolakan Pelaksanaan: ${reviewComment}`,
        updatedAt: new Date().toISOString().split('T')[0],
      };
      onSaveProgja(updated);
      onAddNotification(
        `Pelaksanaan progja "${progja.title}" ditolak Ketua. Status kembali ke REVISI.`,
        'warning'
      );
      setReviewComment('');
      setSelectedProgja(updated);
    }
  };

  // Ketua Action: Validasi / Persetujuan Progja Baru (MENUNGGU_VALIDASI state)
  const handleKetuaValidateNewProgja = (progja: Progja, action: 'PUBLISH' | 'APPROVE_PLAN' | 'REJECT') => {
    let targetStatus: ProgjaStatus;
    let message = '';
    let notificationType: 'success' | 'warning' | 'info' = 'success';

    if (action === 'PUBLISH') {
      targetStatus = 'DIPUBLIKASIKAN';
      message = `Progja "${progja.title}" berhasil disetujui dan langsung DIPUBLIKASIKAN ke Portal Publik!`;
      notificationType = 'success';
    } else if (action === 'APPROVE_PLAN') {
      targetStatus = 'DISETUJUI';
      message = `Rencana Progja "${progja.title}" disetujui untuk dilaksanakan!`;
      notificationType = 'success';
    } else {
      if (!reviewComment) {
        alert('Mohon masukkan alasan penolakan atau catatan revisi terlebih dahulu.');
        return;
      }
      targetStatus = 'REVISI';
      message = `Progja "${progja.title}" ditolak & dikembalikan untuk REVISI oleh Ketua Koperasi.`;
      notificationType = 'warning';
    }

    const updated: Progja = {
      ...progja,
      status: targetStatus,
      notesFromKetua: reviewComment || progja.notesFromKetua,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    onSaveProgja(updated);
    onAddNotification(message, notificationType);
    setReviewComment('');
    setSelectedProgja(updated);
  };

  // Sub-task handlers
  const handleAddSubTask = (title: string, assigneeNik: string, dueDate?: string) => {
    if (!selectedProgja) return;
    const member = orgMembers.find(m => m.nik === assigneeNik);
    if (!member) {
      alert('Mohon pilih penerima penugasan sub-tugas.');
      return;
    }

    const newSub: SubTask = {
      id: 'sub-' + Math.random().toString(36).substr(2, 9),
      title,
      assignedToNik: member.nik,
      assignedToName: member.name,
      assignedToRole: member.role,
      isDone: false,
      dueDate: dueDate || undefined,
    };

    const updatedProgja: Progja = {
      ...selectedProgja,
      subTasks: [...(selectedProgja.subTasks || []), newSub],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onSaveProgja(updatedProgja);
    setSelectedProgja(updatedProgja);
    onAddNotification(`Sub-tugas "${title}" berhasil ditambahkan dan ditugaskan ke ${member.name}.`, 'success');
  };

  const handleToggleSubTask = (subTaskId: string) => {
    if (!selectedProgja) return;
    
    const updatedSubTasks = (selectedProgja.subTasks || []).map(sub => {
      if (sub.id === subTaskId) {
        const nextDone = !sub.isDone;
        onAddNotification(
          `Sub-tugas "${sub.title}" ditandai sebagai ${nextDone ? 'Selesai' : 'Belum Selesai'} oleh ${currentUser.name}.`,
          nextDone ? 'success' : 'info'
        );
        return { ...sub, isDone: nextDone };
      }
      return sub;
    });

    const updatedProgja: Progja = {
      ...selectedProgja,
      subTasks: updatedSubTasks,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onSaveProgja(updatedProgja);
    setSelectedProgja(updatedProgja);
  };

  const handleDeleteSubTask = (subTaskId: string) => {
    if (!selectedProgja) return;
    
    const sub = (selectedProgja.subTasks || []).find(s => s.id === subTaskId);
    const updatedSubTasks = (selectedProgja.subTasks || []).filter(s => s.id !== subTaskId);

    const updatedProgja: Progja = {
      ...selectedProgja,
      subTasks: updatedSubTasks,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onSaveProgja(updatedProgja);
    setSelectedProgja(updatedProgja);
    if (sub) {
      onAddNotification(`Sub-tugas "${sub.title}" berhasil dihapus.`, 'warning');
    }
  };

  // Helper to toggle collaborator roles
  const toggleCollaborator = (role: Role) => {
    if (newCollaborators.includes(role)) {
      setNewCollaborators(newCollaborators.filter((r) => r !== role));
    } else {
      setNewCollaborators([...newCollaborators, role]);
    }
  };

  // Filter Progja list based on tab
  const filteredProgjas = progjaList.filter((p) => {
    if (activeTab === 'SEMUA') return true;
    return p.status === activeTab;
  });

  // Calculate status badge style
  const getStatusBadge = (status: ProgjaStatus) => {
    switch (status) {
      case 'DRAFT':
        return { bg: 'bg-slate-100 text-slate-700', label: 'Draft', icon: <FileText className="w-3.5 h-3.5" /> };
      case 'DIAJUKAN':
        return { bg: 'bg-blue-50 text-blue-700 border border-blue-200', label: 'Diajukan', icon: <Clock className="w-3.5 h-3.5" /> };
      case 'REVISI':
        return { bg: 'bg-amber-50 text-amber-700 border border-amber-200', label: 'Revisi', icon: <AlertCircle className="w-3.5 h-3.5" /> };
      case 'DISETUJUI':
        return { bg: 'bg-emerald-50 text-emerald-700 border border-emerald-200', label: 'Disetujui', icon: <CheckCircle2 className="w-3.5 h-3.5" /> };
      case 'DILAKSANAKAN':
        return { bg: 'bg-purple-50 text-purple-700 border border-purple-200', label: 'Dilaksanakan', icon: <Layers className="w-3.5 h-3.5" /> };
      case 'MENUNGGU_VALIDASI':
        return { bg: 'bg-orange-50 text-orange-700 border border-orange-200', label: 'Menunggu Validasi', icon: <Clock className="w-3.5 h-3.5 text-orange-500 animate-pulse" /> };
      case 'DIPUBLIKASIKAN':
        return { bg: 'bg-teal-50 text-teal-700 border border-teal-200', label: 'Dipublikasikan (Publik)', icon: <Sparkles className="w-3.5 h-3.5" /> };
      case 'MENUNGGU_VALIDASI_PENGHAPUSAN':
        return { bg: 'bg-red-50 text-red-700 border border-red-200', label: 'Minta Hapus', icon: <Trash2 className="w-3.5 h-3.5 text-red-500 animate-pulse" /> };
    }
  };

  return (
    <div className="space-y-6">
      {/* Upper bar with creation button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 id="sirkulasi-prokja-heading" className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Briefcase className="w-5.5 h-5.5 text-blue-600" />
            Sirkulasi Program Kerja (Progja)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Alur sirkulasi penyusunan, persetujuan, pelaksanaan, dan publikasi program pengurus.
          </p>
        </div>

        {/* Anyone except Pengawas can draft/create. Admin and Ketua have full access. */}
        {currentUser.role !== 'pengawas' ? (
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5" />
            Buat Progja Baru
          </button>
        ) : null}
      </div>

      {/* Alur Sirkulasi Visual Map */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
        <h4 className="text-xs font-bold text-slate-600 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
          <Layers className="w-4 h-4 text-indigo-500" />
          Diagram Alur Sirkulasi Kerja Pengurus
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {[
            { step: '1', title: 'Pembuatan', desc: 'Status DRAFT', status: 'DRAFT', color: 'border-slate-300' },
            { step: '2', title: 'Review & Validasi', desc: 'Menunggu Validasi', status: 'MENUNGGU_VALIDASI', color: 'border-orange-300' },
            { step: '3', title: 'Persetujuan', desc: 'Disetujui Ketua', status: 'DISETUJUI', color: 'border-emerald-300' },
            { step: '4', title: 'Pelaksanaan', desc: 'Upload Bukti', status: 'DILAKSANAKAN', color: 'border-purple-300' },
            { step: '5', title: 'Validasi Laporan', desc: 'Validasi Akhir', status: 'DILAKSANAKAN', color: 'border-amber-300' },
            { step: '6', title: 'Publikasi', desc: 'Post ke Publik', status: 'DIPUBLIKASIKAN', color: 'border-teal-300' },
          ].map((item, idx) => {
            const isCurrent = activeTab === item.status;
            return (
              <div
                key={idx}
                className={`p-2.5 bg-white rounded-lg border ${item.color} shadow-2xs relative flex flex-col justify-between ${isCurrent ? 'ring-2 ring-blue-500 bg-blue-50/10' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 w-5 h-5 rounded-full flex items-center justify-center">
                    {item.step}
                  </span>
                  {idx < 5 && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 absolute -right-2 top-1/2 -translate-y-1/2 z-10 hidden md:block" />
                  )}
                </div>
                <div className="mt-2">
                  <p className="text-xs font-bold text-slate-700 leading-tight">{item.title}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['SEMUA', 'DRAFT', 'DIAJUKAN', 'REVISI', 'DISETUJUI', 'DILAKSANAKAN', 'MENUNGGU_VALIDASI', 'DIPUBLIKASIKAN', 'MENUNGGU_VALIDASI_PENGHAPUSAN'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab === 'SEMUA' ? 'Semua Status' : tab === 'MENUNGGU_VALIDASI' ? 'Menunggu Validasi' : tab === 'MENUNGGU_VALIDASI_PENGHAPUSAN' ? 'Minta Hapus' : tab}
            </button>
          ))}
        </div>
        <button
          onClick={handleExportProgjaCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap shadow-xs"
          title="Unduh Rekap Program Kerja Spreadsheet (CSV)"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          Unduh Progja (CSV)
        </button>
      </div>

      {/* Grid Layout of Progja list and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: List */}
        <div className="lg:col-span-5 space-y-3">
          {filteredProgjas.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
              <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-medium">Tidak ada Program Kerja dengan status "{activeTab}"</p>
            </div>
          ) : (
            filteredProgjas.map((progja) => {
              const badge = getStatusBadge(progja.status);
              const isSelected = selectedProgja?.id === progja.id;
              return (
                <div
                  key={progja.id}
                  onClick={() => {
                    setSelectedProgja(progja);
                    setReviewComment('');
                  }}
                  className={`p-4 bg-white border rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer text-left ${
                    isSelected ? 'ring-2 ring-blue-500 border-transparent bg-blue-50/10' : 'border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {progja.sector}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 ${badge.bg}`}>
                      {badge.icon}
                      {badge.label}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                    {progja.title}
                  </h3>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      {progja.picName.split(',')[0]}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {progja.targetDate}
                    </span>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700">
                      Rp {progja.budget.toLocaleString('id-ID')}
                    </span>
                    {progja.collaborators.length > 0 && (
                      <span className="flex items-center gap-1 text-slate-400 text-[10px]">
                        <Users className="w-3 h-3" />
                        {progja.collaborators.length} Kolaborator
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT COLUMN: Selected Details */}
        <div className="lg:col-span-7">
          {selectedProgja ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 text-left relative">
              {/* Header Details */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                      {selectedProgja.sector}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      ID: {selectedProgja.id}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-2 leading-snug">
                    {selectedProgja.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPrintModal(selectedProgja)}
                    className="p-2 text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    title="Cetak Form Progja / Download PDF"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  {(currentUser.role === 'admin_master' || currentUser.role === 'ketua' || currentUser.nik === selectedProgja.picNik) && (
                    <button
                      onClick={() => {
                        const isAdminOrKetua = currentUser.role === 'admin_master' || currentUser.role === 'ketua';
                        const isDraft = selectedProgja.status === 'DRAFT';
                        
                        if (isAdminOrKetua || isDraft) {
                          if (confirm('Apakah Anda yakin ingin menghapus progja ini secara permanen?')) {
                            onDeleteProgja(selectedProgja.id);
                            onAddNotification(`Progja "${selectedProgja.title}" berhasil dihapus.`, 'warning');
                            setSelectedProgja(null);
                          }
                        } else {
                          if (confirm('Sebagai pengurus, Anda perlu mengajukan permohonan penghapusan program kerja ini untuk disetujui Ketua Koperasi. Ajukan permohonan penghapusan?')) {
                            const updated: Progja = {
                              ...selectedProgja,
                              status: 'MENUNGGU_VALIDASI_PENGHAPUSAN',
                              updatedAt: new Date().toISOString().split('T')[0],
                            };
                            onSaveProgja(updated);
                            onAddNotification(`Permintaan penghapusan progja "${selectedProgja.title}" telah diajukan ke Ketua Koperasi.`, 'info');
                            setSelectedProgja(updated);
                          }
                        }
                      }}
                      className="p-2 text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title={
                        currentUser.role === 'admin_master' || currentUser.role === 'ketua' || selectedProgja.status === 'DRAFT'
                          ? "Hapus Progja"
                          : "Ajukan Penghapusan ke Ketua"
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Grid Specifications */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-2.5">
                  <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Penanggung Jawab (PIC)</p>
                    <p className="text-xs font-bold text-slate-800">{selectedProgja.picName}</p>
                    <p className="text-[10px] text-slate-500 font-mono capitalize">Role: {selectedProgja.picRole.replace(/_/g, ' ')}</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-2.5">
                  <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Anggaran & Sumber</p>
                    <p className="text-xs font-bold text-slate-800">Rp {selectedProgja.budget.toLocaleString('id-ID')}</p>
                    <p className="text-[10px] text-slate-500 truncate">{selectedProgja.fundingSource}</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-2.5">
                  <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Target Tanggal Pelaksanaan</p>
                    <p className="text-xs font-bold text-slate-800">{selectedProgja.targetDate}</p>
                    <p className="text-[10px] text-slate-500">Dibuat: {selectedProgja.createdAt}</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-2.5">
                  <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Rencana Kolaborator</p>
                    <p className="text-xs font-bold text-slate-800">
                      {selectedProgja.collaborators.length > 0
                        ? selectedProgja.collaborators.map(r => r.replace(/_/g, ' ')).join(', ')
                        : 'Tanpa kolaborasi'}
                    </p>
                    <p className="text-[10px] text-slate-500">Kolaborasi antar pengurus</p>
                  </div>
                </div>
              </div>

              {/* Description & Success Indicators */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Deskripsi Rencana Kegiatan</h4>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                    {selectedProgja.description || 'Tidak ada deskripsi rinci.'}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Indikator Keberhasilan</h4>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                    {selectedProgja.indicators || 'Tidak ada indikator keberhasilan yang diisi.'}
                  </div>
                </div>
              </div>

              {/* Checklist & Delegasi Sub-Tugas */}
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ListTodo className="w-4.5 h-4.5 text-emerald-600" />
                    Checklist & Delegasi Sub-Tugas ({ (selectedProgja.subTasks || []).length })
                  </h4>
                  {(selectedProgja.picNik === currentUser.nik || currentUser.role === 'admin_master') && (
                    <button
                      onClick={() => setShowAddSubTaskForm(!showAddSubTaskForm)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-200/50 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      {showAddSubTaskForm ? 'Sembunyikan' : 'Tambah Sub-Tugas'}
                    </button>
                  )}
                </div>

                {/* Progress bar */}
                {(() => {
                  const subs = selectedProgja.subTasks || [];
                  const total = subs.length;
                  const completed = subs.filter(s => s.isDone).length;
                  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
                  return (
                    <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600">Progress Delegasi Tugas</span>
                        <span className="font-bold text-emerald-700 font-mono">{completed} / {total} Selesai ({percent}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* Sub-task List */}
                {!(selectedProgja.subTasks && selectedProgja.subTasks.length > 0) ? (
                  <div className="p-6 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <ListTodo className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-500">Belum ada sub-tugas yang didelegasikan.</p>
                    {(selectedProgja.picNik === currentUser.nik || currentUser.role === 'admin_master') && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        Klik tombol "Tambah Sub-Tugas" di atas untuk memecah progja ini menjadi penugasan kecil bagi tim.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedProgja.subTasks.map((sub) => {
                      const isAssignee = currentUser.nik === sub.assignedToNik;
                      const isPic = currentUser.nik === selectedProgja.picNik;
                      const isAdmin = currentUser.role === 'admin_master';
                      const canToggle = isAssignee || isPic || isAdmin;

                      return (
                        <div
                          key={sub.id}
                          className={`flex items-start justify-between p-3 rounded-xl border transition-all ${
                            sub.isDone 
                              ? 'bg-slate-50/70 border-slate-150 text-slate-400' 
                              : 'bg-white border-slate-200 hover:border-slate-300 shadow-3xs'
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            {/* Checkbox */}
                            <button
                              disabled={!canToggle}
                              onClick={() => handleToggleSubTask(sub.id)}
                              className={`mt-0.5 w-4 h-4 rounded-sm border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                                !canToggle ? 'opacity-60 cursor-not-allowed' : ''
                              } ${
                                sub.isDone
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'border-slate-300 hover:border-slate-400 bg-white'
                              }`}
                              title={
                                canToggle 
                                  ? 'Klik untuk mengubah status sub-tugas' 
                                  : 'Hanya penerima tugas, PIC progja, atau Admin yang dapat mengubah status'
                              }
                            >
                              {sub.isDone && <Check className="w-3 h-3 stroke-[3px]" />}
                            </button>

                            <div className="space-y-1 min-w-0">
                              <p className={`text-xs font-semibold leading-snug break-words ${sub.isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                {sub.title}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px]">
                                <span className="text-slate-500 flex items-center gap-1 font-medium">
                                  <User className="w-3 h-3 text-slate-400" />
                                  {sub.assignedToName}
                                  <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-sm capitalize">
                                    {sub.assignedToRole.replace(/_/g, ' ')}
                                  </span>
                                </span>
                                {sub.dueDate && (
                                  <span className={`font-medium flex items-center gap-1 ${
                                    sub.isDone 
                                      ? 'text-slate-400' 
                                      : new Date(sub.dueDate) < new Date() 
                                        ? 'text-rose-600 font-bold' 
                                        : 'text-amber-700'
                                  }`}>
                                    <Calendar className="w-3 h-3" />
                                    Tenggat: {sub.dueDate}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Delete Button */}
                          {(isPic || isAdmin) && (
                            <button
                              onClick={() => {
                                if (confirm(`Apakah Anda yakin ingin menghapus sub-tugas "${sub.title}"?`)) {
                                  handleDeleteSubTask(sub.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors shrink-0 cursor-pointer"
                              title="Hapus sub-tugas"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add Sub-task Form (Expandable) */}
                <AnimatePresence>
                  {showAddSubTaskForm && (selectedProgja.picNik === currentUser.nik || currentUser.role === 'admin_master') && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 mt-1">
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Delegasikan Sub-Tugas Baru</p>
                        
                        <div className="space-y-1">
                          <label className="block text-[9px] font-bold text-slate-500 uppercase">Judul Sub-Tugas *</label>
                          <input
                            type="text"
                            placeholder="Tuliskan instruksi tugas spesifik..."
                            value={subTaskTitle}
                            onChange={(e) => setSubTaskTitle(e.target.value)}
                            required
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[9px] font-bold text-slate-500 uppercase">Penerima Tugas (Delegasi) *</label>
                            <select
                              value={subTaskAssignee}
                              onChange={(e) => setSubTaskAssignee(e.target.value)}
                              required
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden"
                            >
                              <option value="">-- Pilih Anggota Tim --</option>
                              {orgMembers.map((member) => (
                                <option key={member.id} value={member.nik}>
                                  {member.name} ({member.role.replace(/_/g, ' ')})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[9px] font-bold text-slate-500 uppercase">Tenggat Waktu</label>
                            <input
                              type="date"
                              value={subTaskDueDate}
                              onChange={(e) => setSubTaskDueDate(e.target.value)}
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                          <button
                            type="button"
                            onClick={() => setShowAddSubTaskForm(false)}
                            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!subTaskTitle.trim()) {
                                alert('Judul sub-tugas tidak boleh kosong.');
                                return;
                              }
                              if (!subTaskAssignee) {
                                alert('Silakan pilih penerima tugas.');
                                return;
                              }
                              handleAddSubTask(subTaskTitle, subTaskAssignee, subTaskDueDate);
                              setSubTaskTitle('');
                              setSubTaskAssignee('');
                              setSubTaskDueDate('');
                              setShowAddSubTaskForm(false);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Kirim Delegasi
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Notes from Ketua (Revisions or Approvals) */}
              {selectedProgja.notesFromKetua && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4" />
                    Catatan Penilaian / Catatan Ketua:
                  </h4>
                  <p className="text-xs text-amber-900 mt-2 italic leading-relaxed">"{selectedProgja.notesFromKetua}"</p>
                </div>
              )}

              {/* Sirkulasi Alur Actions */}
              <div className="pt-5 border-t border-slate-100 space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <FileCheck2 className="w-4.5 h-4.5 text-blue-600" />
                  Panel Aksi Alur Sirkulasi
                </h4>

                {/* Action Panel for DRAFT or REVISI */}
                {canModifyProgja(selectedProgja) && ['DRAFT', 'REVISI'].includes(selectedProgja.status) && (
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div className="text-xs text-slate-600 text-left">
                      Progja berstatus <span className="font-bold">{selectedProgja.status}</span>. Perbarui draf ini, ajukan ke Ketua, atau setujui langsung.
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setNewTitle(selectedProgja.title);
                          setNewSector(selectedProgja.sector);
                          setNewTargetDate(selectedProgja.targetDate);
                          setNewBudget(selectedProgja.budget.toString());
                          setNewFundingSource(selectedProgja.fundingSource);
                          setNewIndicators(selectedProgja.indicators);
                          setNewDescription(selectedProgja.description);
                          setNewCollaborators(selectedProgja.collaborators);
                          setNewPicNik(selectedProgja.picNik);
                          setIsEditMode(true);
                          setEditingId(selectedProgja.id);
                          setShowCreateModal(true);
                        }}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Edit Draft
                      </button>
                      <button
                        onClick={() => handleSubmitToKetua(selectedProgja)}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Kirim untuk Validasi
                      </button>
                      <button
                        onClick={() => {
                          const updated: Progja = {
                            ...selectedProgja,
                            status: 'DISETUJUI',
                            updatedAt: new Date().toISOString().split('T')[0],
                          };
                          onSaveProgja(updated);
                          onAddNotification(`Progja "${selectedProgja.title}" berhasil disetujui langsung!`, 'success');
                          setSelectedProgja(updated);
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Setujui Langsung
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Panel for DIAJUKAN or MENUNGGU_VALIDASI (Under Review) */}
                {canModifyProgja(selectedProgja) && ['DIAJUKAN', 'MENUNGGU_VALIDASI'].includes(selectedProgja.status) && (
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-blue-50/40 rounded-xl border border-blue-200/80">
                    <div className="text-xs text-blue-800 text-left">
                      Progja sedang <span className="font-bold">{selectedProgja.status === 'MENUNGGU_VALIDASI' ? 'MENUNGGU VALIDASI' : 'DITINJAU'}</span>. Anda dapat mengedit detail draf atau langsung menyetujuinya sendiri.
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setNewTitle(selectedProgja.title);
                          setNewSector(selectedProgja.sector);
                          setNewTargetDate(selectedProgja.targetDate);
                          setNewBudget(selectedProgja.budget.toString());
                          setNewFundingSource(selectedProgja.fundingSource);
                          setNewIndicators(selectedProgja.indicators);
                          setNewDescription(selectedProgja.description);
                          setNewCollaborators(selectedProgja.collaborators);
                          setNewPicNik(selectedProgja.picNik);
                          setIsEditMode(true);
                          setEditingId(selectedProgja.id);
                          setShowCreateModal(true);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Edit Detail Draft
                      </button>
                      <button
                        onClick={() => {
                          const updated: Progja = {
                            ...selectedProgja,
                            status: 'DISETUJUI',
                            updatedAt: new Date().toISOString().split('T')[0],
                          };
                          onSaveProgja(updated);
                          onAddNotification(`Progja "${selectedProgja.title}" berhasil disetujui langsung!`, 'success');
                          setSelectedProgja(updated);
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Setujui Langsung
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Panel for Approved/Published (DISETUJUI, DILAKSANAKAN, DIPUBLIKASIKAN) */}
                {canModifyProgja(selectedProgja) && ['DISETUJUI', 'DILAKSANAKAN', 'DIPUBLIKASIKAN'].includes(selectedProgja.status) && (
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200/80">
                    <div className="text-xs text-emerald-800 text-left">
                      Progja ini berstatus <span className="font-bold">{selectedProgja.status}</span>. Anda masih dapat mengedit rincian data (judul, anggaran, dll) jika diperlukan, perubahan akan langsung terupdate di sistem & portal.
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setNewTitle(selectedProgja.title);
                          setNewSector(selectedProgja.sector);
                          setNewTargetDate(selectedProgja.targetDate);
                          setNewBudget(selectedProgja.budget.toString());
                          setNewFundingSource(selectedProgja.fundingSource);
                          setNewIndicators(selectedProgja.indicators);
                          setNewDescription(selectedProgja.description);
                          setNewCollaborators(selectedProgja.collaborators);
                          setNewPicNik(selectedProgja.picNik);
                          setIsEditMode(true);
                          setEditingId(selectedProgja.id);
                          setShowCreateModal(true);
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Edit Rincian Program
                      </button>
                    </div>
                  </div>
                )}

                {/* KETUA ACTION: Approve / Revision (Only for DIAJUKAN state) */}
                {selectedProgja.status === 'DIAJUKAN' && (
                  <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
                    <p className="text-xs font-bold text-blue-900 flex items-center gap-1">
                      <Info className="w-4 h-4 text-blue-600" />
                      Otorisasi Ketua: Peninjauan Program Kerja
                    </p>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Masukkan catatan penilaian, anggaran disetujui, atau instruksi revisi..."
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 outline-hidden min-h-[80px]"
                    />
                    {currentUser.role === 'ketua' || currentUser.role === 'admin_master' ? (
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => handleKetuaRevisi(selectedProgja)}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          Minta Revisi
                        </button>
                        <button
                          onClick={() => handleKetuaApprove(selectedProgja)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Setujui Progja
                        </button>
                      </div>
                    ) : (
                      <p className="text-[10px] text-amber-600 italic">
                        *Hanya Ketua Koperasi atau Admin yang berhak menyetujui program kerja ini.
                      </p>
                    )}
                  </div>
                )}

                {/* KETUA ACTION: Approve / Reject (Only for MENUNGGU_VALIDASI state) */}
                {selectedProgja.status === 'MENUNGGU_VALIDASI' && (
                  <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-200 space-y-4">
                    <p className="text-xs font-bold text-orange-950 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-orange-600 animate-pulse" />
                      Persetujuan & Validasi Ketua Koperasi (Progja Baru/Edit)
                    </p>
                    <p className="text-[11px] text-orange-800 leading-relaxed">
                      Program kerja ini diinput/diperbarui oleh pengurus dan memerlukan persetujuan Ketua Koperasi sebelum tayang otomatis di Portal Publik.
                    </p>

                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Masukkan catatan penilaian, anggaran disetujui, atau alasan jika meminta revisi..."
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-orange-500 outline-hidden min-h-[80px]"
                    />

                    {currentUser.role === 'ketua' || currentUser.role === 'admin_master' ? (
                      <div className="flex flex-wrap items-center gap-2 justify-end">
                        <button
                          onClick={() => handleKetuaValidateNewProgja(selectedProgja, 'REJECT')}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          Tolak & Minta Revisi
                        </button>
                        <button
                          onClick={() => handleKetuaValidateNewProgja(selectedProgja, 'APPROVE_PLAN')}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Setujui rencana progja agar bisa dilaksanakan tapi belum dipost ke publik"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Setujui Rencana
                        </button>
                        <button
                          onClick={() => handleKetuaValidateNewProgja(selectedProgja, 'PUBLISH')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Setujui & publish langsung ke Portal Publik"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Setujui & Publish Publik
                        </button>
                      </div>
                    ) : (
                      <p className="text-[10px] text-amber-600 italic">
                        *Menunggu Ketua Koperasi memvalidasi dan memberikan persetujuan (approve/reject) program kerja ini sebelum dapat dipublikasikan ke Portal Publik.
                      </p>
                    )}
                  </div>
                )}

                {/* KETUA ACTION: Approve Deletion / Reject Deletion (Only for MENUNGGU_VALIDASI_PENGHAPUSAN state) */}
                {selectedProgja.status === 'MENUNGGU_VALIDASI_PENGHAPUSAN' && (
                  <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-200 space-y-4">
                    <p className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                      <Trash2 className="w-4 h-4 text-rose-600 animate-pulse" />
                      Otorisasi Ketua: Permintaan Penghapusan Program Kerja
                    </p>
                    <p className="text-[11px] text-rose-800 leading-relaxed">
                      Program kerja ini diusulkan untuk <span className="font-bold">dihapus</span> oleh Penanggung Jawab ({selectedProgja.picName}). Ketua Koperasi wajib memvalidasi alasan penghapusan.
                    </p>

                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Masukkan catatan persetujuan atau alasan jika menolak permohonan penghapusan..."
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-rose-500 outline-hidden min-h-[80px]"
                    />

                    {currentUser.role === 'ketua' || currentUser.role === 'admin_master' ? (
                      <div className="flex flex-wrap items-center gap-2 justify-end">
                        <button
                          onClick={() => {
                            // Reject Deletion -> Revert back to DISETUJUI status
                            const updated: Progja = {
                              ...selectedProgja,
                              status: 'DISETUJUI',
                              notesFromKetua: reviewComment ? `Penolakan Penghapusan: ${reviewComment}` : selectedProgja.notesFromKetua,
                              updatedAt: new Date().toISOString().split('T')[0],
                            };
                            onSaveProgja(updated);
                            onAddNotification(`Permintaan penghapusan untuk progja "${selectedProgja.title}" DITOLAK oleh Ketua. Status dikembalikan ke DISETUJUI.`, 'info');
                            setReviewComment('');
                            setSelectedProgja(updated);
                          }}
                          className="px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          Tolak Penghapusan
                        </button>
                        <button
                          onClick={() => {
                            // Approve Deletion -> Call onDeleteProgja
                            if (confirm(`Apakah Anda (Ketua) yakin menyetujui penghapusan program "${selectedProgja.title}" secara permanen?`)) {
                              onDeleteProgja(selectedProgja.id);
                              onAddNotification(`Penghapusan program "${selectedProgja.title}" berhasil disetujui secara permanen oleh Ketua Koperasi.`, 'success');
                              setReviewComment('');
                              setSelectedProgja(null);
                            }
                          }}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Setujui & Hapus Permanen
                        </button>
                      </div>
                    ) : (
                      <p className="text-[10px] text-rose-600 italic">
                        *Menunggu Ketua Koperasi memvalidasi dan menyetujui permintaan penghapusan program kerja ini.
                      </p>
                    )}
                  </div>
                )}

                {/* PROGRAM EXECUTION: Upload proof (Only for DISETUJUI state) */}
                {selectedProgja.status === 'DISETUJUI' && (
                  <div className="p-4 bg-purple-50/30 rounded-xl border border-purple-100 space-y-4">
                    <p className="text-xs font-bold text-purple-900 flex items-center gap-1">
                      <Upload className="w-4 h-4 text-purple-600" />
                      Pelaksanaan & Unggah Dokumentasi (Bukti Kegiatan)
                    </p>

                    {/* Check if current user is the PIC or Admin Master */}
                    {currentUser.nik === selectedProgja.picNik || currentUser.role === 'admin_master' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Deskripsi Laporan Hasil Pelaksanaan (Bukti Nyata) *
                          </label>
                          <textarea
                            value={proofDesc}
                            onChange={(e) => setProofDesc(e.target.value)}
                            placeholder="Tuliskan secara ringkas hasil kegiatan, tanggal pelaksanaan aktual, dampak, dan kesimpulan..."
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-purple-500 outline-hidden min-h-[80px]"
                          />
                        </div>

                         <div className="sm:col-span-2 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                           <div className="flex items-center justify-between">
                             <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                               Galeri Foto Dokumentasi Pelaksanaan (Bukti Kegiatan)
                             </label>
                             <span className="text-[10px] text-slate-500 font-medium">
                               {proofGallery.length} foto ditambahkan
                             </span>
                           </div>

                           <div className="flex gap-2">
                             <input
                               type="text"
                               value={proofPhoto}
                               onChange={(e) => setProofPhoto(e.target.value)}
                               placeholder="Masukkan URL foto dokumentasi (https://images.unsplash.com/...)"
                               className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-purple-500 outline-hidden"
                             />
                             <button
                               type="button"
                               onClick={() => {
                                 if (!proofPhoto) return;
                                 if (proofGallery.includes(proofPhoto)) {
                                   alert('Foto ini sudah ada di galeri!');
                                   return;
                                 }
                                 setProofGallery([...proofGallery, proofPhoto]);
                                 setProofPhoto('');
                               }}
                               className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold cursor-pointer shrink-0 transition-colors"
                             >
                               Tambah
                             </button>
                           </div>

                           {/* Predefined mock photo buttons for easier testing */}
                           <div className="space-y-1">
                             <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wide">Prefill Dokumentasi Cepat:</span>
                             <div className="flex flex-wrap gap-1.5">
                               {[
                                 { name: 'Rapat Pengurus', url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=600' },
                                 { name: 'Koperasi Minimarket', url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=600' },
                                 { name: 'Bakti Sosial', url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=600' },
                                 { name: 'Audit Keuangan', url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600' },
                                 { name: 'Penyuluhan Anggota', url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=600' },
                               ].map((mock, mIdx) => (
                                 <button
                                   key={mIdx}
                                   type="button"
                                   onClick={() => {
                                     if (proofGallery.includes(mock.url)) return;
                                     setProofGallery([...proofGallery, mock.url]);
                                   }}
                                   className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-md text-[9px] font-medium transition-all cursor-pointer"
                                 >
                                   + {mock.name}
                                 </button>
                               ))}
                             </div>
                           </div>

                           {/* Gallery Thumbnails List */}
                           {proofGallery.length > 0 && (
                             <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2">
                               {proofGallery.map((url, gIdx) => (
                                 <div key={gIdx} className="relative group aspect-video rounded-lg border border-slate-200 overflow-hidden bg-slate-100 shadow-3xs">
                                   <img
                                     src={url}
                                     alt={`Galeri ${gIdx + 1}`}
                                     className="w-full h-full object-cover"
                                     referrerPolicy="no-referrer"
                                   />
                                   <button
                                     type="button"
                                     onClick={() => setProofGallery(proofGallery.filter((_, idx) => idx !== gIdx))}
                                     className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full text-[8px] font-bold shadow-sm cursor-pointer"
                                     title="Hapus"
                                   >
                                     ✕
                                   </button>
                                 </div>
                               ))}
                             </div>
                           )}
                         </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Nama File Laporan (Lampiran)
                          </label>
                          <input
                            type="text"
                            value={proofReportFile}
                            onChange={(e) => setProofReportFile(e.target.value)}
                            placeholder="laporan_kegiatan.pdf"
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-purple-500 outline-hidden"
                          />
                        </div>

                        <div className="sm:col-span-2 flex justify-end">
                          <button
                            onClick={() => handleUploadProof(selectedProgja)}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Unggah & Ajukan Validasi
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic">
                        *Hanya penanggung jawab kegiatan ({selectedProgja.picName}) yang dapat meluncurkan & melaporkan bukti penyelesaian progja ini.
                      </p>
                    )}
                  </div>
                )}

                {/* KETUA ACTION: Validate proof (Only for DILAKSANAKAN state) */}
                {selectedProgja.status === 'DILAKSANAKAN' && (
                  <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200 space-y-4">
                    <p className="text-xs font-bold text-amber-900 flex items-center gap-1">
                      <FileCheck2 className="w-4 h-4 text-amber-600" />
                      Pemeriksaan & Validasi Hasil Kegiatan oleh Ketua
                    </p>

                    {/* Display submitted proof */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                      <div className="space-y-3">
                        {/* Photo Gallery Grid */}
                        {((selectedProgja.proofGallery && selectedProgja.proofGallery.length > 0) || selectedProgja.proofPhoto) && (
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Galeri Dokumentasi Pelaksanaan</span>
                            <div className="flex flex-wrap gap-2">
                              {selectedProgja.proofGallery && selectedProgja.proofGallery.length > 0 ? (
                                selectedProgja.proofGallery.map((imgUrl, i) => (
                                  <img
                                    key={i}
                                    src={imgUrl}
                                    alt={`Dokumentasi ${i + 1}`}
                                    referrerPolicy="no-referrer"
                                    className="w-24 h-16 object-cover rounded-md border border-slate-200 cursor-pointer hover:scale-105 transition-transform"
                                  />
                                ))
                              ) : (
                                <img
                                  src={selectedProgja.proofPhoto}
                                  alt="Bukti Dokumentasi"
                                  referrerPolicy="no-referrer"
                                  className="w-24 h-16 object-cover rounded-md border border-slate-200"
                                />
                              )}
                            </div>
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-700">Laporan Hasil:</p>
                          <p className="text-slate-600 leading-normal">{selectedProgja.proofDescription}</p>
                          <p className="text-[10px] text-slate-400 mt-1 font-mono">
                            Lampiran File: {selectedProgja.proofReport || 'laporan_kegiatan_terselenggara.pdf'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Masukkan alasan jika menolak, atau catatan tambahan jika disetujui..."
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 outline-hidden min-h-[60px]"
                    />

                    {currentUser.role === 'ketua' || currentUser.role === 'admin_master' ? (
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => handleKetuaValidate(selectedProgja, false)}
                          className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          Tolak & Revisi
                        </button>
                        <button
                          onClick={() => handleKetuaValidate(selectedProgja, true)}
                          className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Validasi & Publish Publik
                        </button>
                      </div>
                    ) : (
                      <p className="text-[10px] text-amber-600 italic">
                        *Menunggu Ketua Koperasi memvalidasi bukti penyelesaian program kerja ini agar dipublish secara transparan ke publik.
                      </p>
                    )}
                  </div>
                )}

                {/* Published state display */}
                {selectedProgja.status === 'DIPUBLIKASIKAN' && (
                  <div className="p-4 bg-teal-50 rounded-xl border border-teal-200 flex items-start gap-3">
                    <div className="p-1.5 bg-teal-100 text-teal-800 rounded-full shrink-0">
                      <Sparkles className="w-4.5 h-4.5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-teal-950">Program Kerja Sukses Dipublikasikan!</h4>
                      <p className="text-xs text-teal-800 mt-1 leading-relaxed">
                        Seluruh anggota koperasi dan masyarakat umum dapat mengakses bukti dokumentasi kegiatan ini di halaman beranda utama (publik) secara transparan. Kinerja pengurus terverifikasi akuntabel.
                      </p>
                      {selectedProgja.proofDescription && (
                        <div className="mt-3 p-2.5 bg-white/70 rounded-lg border border-teal-100 text-xs">
                          <p className="font-semibold text-slate-800">Laporan Aktual:</p>
                          <p className="text-slate-600 mt-0.5">{selectedProgja.proofDescription}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 h-full flex flex-col justify-center items-center">
              <Briefcase className="w-14 h-14 text-slate-300 mb-3 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-800">Detail Program Kerja</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Pilih salah satu program kerja dari kolom kiri untuk melihat rincian rencana, progres alur sirkulasi, penilaian ketua, dan lampiran dokumentasi kegiatan.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: CREATE NEW PROGJA (DRAFT PENGINPUTAN PROGJA) */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-100 text-left"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isEditMode ? 'Form Edit Draft Program Kerja (Progja)' : 'Form Penginputan Draft Program Kerja (Progja)'}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Isi draf program kerja dengan lengkap, detail, dan terstruktur.</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Penanggung Jawab (PIC) */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Penanggung Jawab (PIC) *
                  </label>
                  <select
                    value={newPicNik}
                    onChange={(e) => setNewPicNik(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
                  >
                    {orgMembers.map((member) => (
                      <option key={member.id} value={member.nik}>
                        {member.name} ({member.role.replace(/_/g, ' ')})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Anggota atau pengurus koperasi yang ditunjuk sebagai penanggung jawab utama atas pelaksanaan program kerja ini.
                  </p>
                </div>

                {/* Judul & Sektor */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Nama Program Kerja *
                    </label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Contoh: Pengadaan Mesin POS kasir retail..."
                      className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-xs outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Bidang / Sektor Kegiatan
                    </label>
                    <select
                      value={newSector}
                      onChange={(e) => setNewSector(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
                    >
                      <option value="Unit Usaha">Unit Usaha (Gerai)</option>
                      <option value="Keanggotaan">Keanggotaan</option>
                      <option value="Keuangan">Keuangan</option>
                      <option value="Pengawasan">Pengawasan</option>
                      <option value="Administrasi">Administrasi</option>
                      <option value="Humas & Sosial">Humas & Sosial</option>
                    </select>
                  </div>
                </div>

                {/* Target Date & Budget */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Target Pelaksanaan Tanggal *
                    </label>
                    <input
                      type="date"
                      value={newTargetDate}
                      onChange={(e) => setNewTargetDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-xs outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Anggaran Yang Dibutuhkan (Rupiah) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">Rp</span>
                      <input
                        type="number"
                        value={newBudget}
                        onChange={(e) => setNewBudget(e.target.value)}
                        placeholder="Jumlah rupiah"
                        className="w-full pl-8 pr-3 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-xs outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Source of Fund */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Rencana Sumber Pendanaan
                  </label>
                  <input
                    type="text"
                    value={newFundingSource}
                    onChange={(e) => setNewFundingSource(e.target.value)}
                    placeholder="Contoh: Kas Operasional Koperasi, Donasi Corporate, Subsidi Anggota..."
                    className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-xs outline-hidden"
                  />
                </div>

                {/* Indikator Keberhasilan */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Indikator Keberhasilan Kegiatan
                  </label>
                  <textarea
                    value={newIndicators}
                    onChange={(e) => setNewIndicators(e.target.value)}
                    placeholder="Contoh: Selesainya laporan pertanggungjawaban fisik tepat waktu, minimal 50 anggota terbantu..."
                    className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-xs outline-hidden min-h-[60px]"
                  />
                </div>

                {/* Deskripsi */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Detail Deskripsi Rencana Kegiatan
                  </label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Tuliskan secara lengkap strategi, langkah eksekusi, serta hal-hal teknis mengenai program kerja ini..."
                    className="w-full p-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-xs outline-hidden min-h-[100px]"
                  />
                </div>

                {/* Collaborators */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Undang Kolaborator (Rekan Pengurus Terkait)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {rolesList
                      .filter((r) => r.value !== 'admin_master' && r.value !== currentUser.role)
                      .map((role) => {
                        const isSelected = newCollaborators.includes(role.value);
                        return (
                          <button
                            type="button"
                            key={role.value}
                            onClick={() => toggleCollaborator(role.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {role.label}
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex items-center justify-between">
                <span className="text-[10px] text-slate-500">
                  {currentUser.role === 'ketua' || currentUser.role === 'admin_master' ? (
                    isEditMode && editingId && progjaList.find((p) => p.id === editingId) && !['DRAFT', 'REVISI', 'DIAJUKAN', 'MENUNGGU_VALIDASI'].includes(progjaList.find((p) => p.id === editingId)!.status)
                      ? '* Perubahan akan langsung diperbarui di portal publik'
                      : '* Harap simpan draf sebelum memvalidasi'
                  ) : (
                    isEditMode && editingId && progjaList.find((p) => p.id === editingId) && !['DRAFT', 'REVISI', 'DIAJUKAN', 'MENUNGGU_VALIDASI'].includes(progjaList.find((p) => p.id === editingId)!.status)
                      ? '* Perubahan memerlukan validasi ulang Ketua sebelum tampil di Portal Publik'
                      : '* Simpan draft atau ajukan validasi ke Ketua Koperasi'
                  )}
                </span>
                <div className="flex items-center gap-2">
                  {isEditMode && editingId && progjaList.find((p) => p.id === editingId) && !['DRAFT', 'REVISI', 'DIAJUKAN', 'MENUNGGU_VALIDASI'].includes(progjaList.find((p) => p.id === editingId)!.status) ? (
                    <button
                      onClick={() => {
                        const orig = progjaList.find((p) => p.id === editingId)!;
                        handleCreateProgja(orig.status);
                      }}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                    >
                      Simpan Perubahan & Terapkan
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleCreateProgja('DRAFT')}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Simpan Draft
                      </button>
                      <button
                        onClick={() => handleCreateProgja('MENUNGGU_VALIDASI')}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                      >
                        Kirim untuk Validasi
                      </button>
                      <button
                        onClick={() => handleCreateProgja('DISETUJUI')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                      >
                        Simpan & Setujui Langsung
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PRINT PREVIEW / PDF MODAL */}
      <AnimatePresence>
        {showPrintModal && (
          <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 text-left p-8 print:p-0 print:shadow-none print:border-0 relative"
            >
              {/* Close Button & Print Trigger */}
              <div className="absolute top-4 right-4 flex items-center gap-2 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Cetak / Simpan PDF
                </button>
                <button
                  onClick={() => setShowPrintModal(null)}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Document Container */}
              <div id="printed-document" className="space-y-6 pt-6 font-serif">
                {/* Header Kop Surat */}
                <div className="text-center border-b-4 border-double border-slate-800 pb-4 relative">
                  <h1 className="text-xl font-extrabold uppercase text-slate-950 tracking-wider">
                    KOPERASI KARYAWAN MERAH PUTIH SEJAHTERA
                  </h1>
                  <p className="text-xs text-slate-600 mt-1 not-italic font-sans">
                    Jl. Jenderal Sudirman No. 45, Jakarta Pusat, DKI Jakarta | Telp: 021-5551234
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono tracking-tight mt-0.5">
                    Email: info@koperasimerahputih.co.id | Keputusan Hukum No: AHU-120032.AH.01.26
                  </p>
                </div>

                {/* Title */}
                <div className="text-center pt-2">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 underline">
                    SURAT PERSETUJUAN PROGRAM KERJA (SPK-PROGJA)
                  </h2>
                  <p className="text-xs font-mono text-slate-500 mt-1">
                    Nomor Dokumen: KMP/PROGJA/{showPrintModal.id.toUpperCase()}/{new Date(showPrintModal.createdAt).getFullYear()}
                  </p>
                </div>

                {/* Main Data Table */}
                <div className="text-xs text-slate-800 space-y-4 font-sans">
                  <div className="grid grid-cols-12 gap-x-2 border-b border-slate-200 pb-2">
                    <div className="col-span-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Nama Program Kerja</div>
                    <div className="col-span-8 font-semibold text-slate-900 text-sm">{showPrintModal.title}</div>
                  </div>

                  <div className="grid grid-cols-12 gap-x-2 border-b border-slate-200 pb-2">
                    <div className="col-span-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Bidang / Sektor Kerja</div>
                    <div className="col-span-8 font-semibold text-indigo-700 uppercase tracking-wide text-xs">{showPrintModal.sector}</div>
                  </div>

                  <div className="grid grid-cols-12 gap-x-2 border-b border-slate-200 pb-2">
                    <div className="col-span-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Penanggung Jawab (PIC)</div>
                    <div className="col-span-8">
                      <span className="font-bold text-slate-800">{showPrintModal.picName}</span> 
                      <span className="text-slate-500"> ({showPrintModal.picRole.replace(/_/g, ' ')})</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-x-2 border-b border-slate-200 pb-2">
                    <div className="col-span-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Detail Anggaran</div>
                    <div className="col-span-8 font-bold text-slate-900">
                      Rp {showPrintModal.budget.toLocaleString('id-ID')}
                      <span className="text-xs font-normal text-slate-500 font-serif italic"> (Dibiayai dari: {showPrintModal.fundingSource})</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-x-2 border-b border-slate-200 pb-2">
                    <div className="col-span-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Target Tanggal Pelaksanaan</div>
                    <div className="col-span-8 font-medium">{showPrintModal.targetDate}</div>
                  </div>

                  <div className="grid grid-cols-12 gap-x-2 border-b border-slate-200 pb-2">
                    <div className="col-span-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Rencana Kolaborasi</div>
                    <div className="col-span-8">
                      {showPrintModal.collaborators.length > 0
                        ? showPrintModal.collaborators.map(r => r.replace(/_/g, ' ')).join(', ')
                        : 'Dilaksanakan Mandiri'}
                    </div>
                  </div>

                  {/* Substantial content blocks */}
                  <div className="space-y-2 pt-2">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-300 pb-1">Deskripsi & Tujuan Rencana</h4>
                    <p className="text-xs leading-relaxed text-slate-700 text-justify">{showPrintModal.description || 'Tidak ada deskripsi rencana.'}</p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-300 pb-1">Indikator Keberhasilan Kegiatan</h4>
                    <p className="text-xs leading-relaxed text-slate-700 text-justify">{showPrintModal.indicators || 'Tidak ada indikator.'}</p>
                  </div>

                  {showPrintModal.proofDescription && (
                    <div className="space-y-2 pt-2">
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-300 pb-1">Laporan Hasil Realisasi Pelaksanaan</h4>
                      <p className="text-xs leading-relaxed text-slate-700 text-justify">{showPrintModal.proofDescription}</p>
                    </div>
                  )}

                  {showPrintModal.notesFromKetua && (
                    <div className="space-y-2 pt-2 border border-slate-200 p-3 bg-slate-50 rounded-lg">
                      <h4 className="font-bold text-amber-800 text-[10px] uppercase tracking-wider">Catatan Tambahan Ketua Koperasi:</h4>
                      <p className="text-xs text-slate-700 italic">"{showPrintModal.notesFromKetua}"</p>
                    </div>
                  )}
                </div>

                {/* Signatures Blocks */}
                <div className="pt-10 grid grid-cols-2 text-center text-xs font-sans">
                  {/* Penanggung Jawab Signature */}
                  <div className="space-y-16">
                    <p className="text-slate-600">Dibuat Oleh,</p>
                    <div>
                      <p className="font-bold text-slate-900 underline">{showPrintModal.picName}</p>
                      <p className="text-[10px] text-slate-500 capitalize">{showPrintModal.picRole.replace(/_/g, ' ')}</p>
                    </div>
                  </div>

                  {/* Ketua Signature */}
                  <div className="space-y-16 relative">
                    <p className="text-slate-600">Mengetahui & Menyetujui,</p>
                    
                    {/* Visual Stamp when Approved / Validated */}
                    {['DISETUJUI', 'DILAKSANAKAN', 'DIPUBLIKASIKAN'].includes(showPrintModal.status) && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 border-4 border-double border-teal-600 text-teal-600 font-black uppercase text-[10px] tracking-widest py-1 px-3.5 rounded bg-white/95 pointer-events-none select-none">
                        APPROVED KMP
                        <p className="text-[7px] font-mono font-medium text-teal-500 tracking-normal mt-0.5">VALIDATED: {showPrintModal.updatedAt}</p>
                      </div>
                    )}

                    <div>
                      <p className="font-bold text-slate-900 underline">Ir. Budi Santoso, M.M.</p>
                      <p className="text-[10px] text-slate-500">Ketua Koperasi</p>
                    </div>
                  </div>
                </div>

                {/* Footer disclaimer */}
                <div className="pt-12 text-center border-t border-slate-200 text-[10px] text-slate-400 font-sans">
                  * Dokumen ini dibuat dan disahkan secara digital dalam Sistem Aplikasi Koperasi Digital Merah Putih.
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
