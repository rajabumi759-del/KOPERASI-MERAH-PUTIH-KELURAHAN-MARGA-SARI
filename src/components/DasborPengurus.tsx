import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Briefcase,
  Wallet,
  Users,
  Download,
  Building,
  AlertOctagon,
  Store,
  FolderLock,
  Lock,
  LogOut,
  Save,
  Plus,
  Trash2,
  Edit2,
  Check,
  FileText,
  MapPin,
  Compass,
  AlertTriangle,
  UploadCloud,
  X,
  FileCheck2,
  Calendar,
  Users2,
  Info,
  Bell,
  History,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  CheckCheck,
  CheckCircle2,
  BellOff,
  Clock,
  XCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { jsPDF } from 'jspdf';
import {
  User as UserType,
  Progja,
  News,
  Himbauan,
  KeuanganState,
  KeuanganTransaction,
  GeraiOutlet,
  KoperasiBiodata,
  OrgMember,
  SystemSettings,
  RoleAccess,
  Role,
  ActivityLog,
  VotingItem,
  VoteType,
} from '../types';
import SirkulasiProgja from './SirkulasiProgja';
import VotingPengurusView from './VotingPengurusView';

interface DasborPengurusProps {
  currentUser: UserType;
  progjaList: Progja[];
  newsList: News[];
  himbauanList: Himbauan[];
  keuangan: KeuanganState;
  geraiList: GeraiOutlet[];
  biodata: KoperasiBiodata;
  orgMembers: OrgMember[];
  roleAccess: Record<Role, RoleAccess>;
  systemSettings: SystemSettings;
  filesList: any[];
  administrasiList: any[];
  usersBase: UserType[];
  activityLogs: ActivityLog[];
  votingList: VotingItem[];
  onLogout: () => void;
  onUpdateState: (newState: any) => void;
  onAddNotification: (content: string, type: string) => void;
  autoSelectProgjaId?: string | null;
  autoSelectVotingId?: string | null;
  onClearAutoSelect?: () => void;
  googleAccessToken: string | null;
  setGoogleAccessToken: (token: string | null) => void;
  isSyncing: boolean;
  onSyncNow: (token: string, sid: string) => void;
  onGoogleLogin: () => void;
}

export default function DasborPengurus({
  currentUser,
  progjaList,
  newsList,
  himbauanList,
  keuangan,
  geraiList,
  biodata,
  orgMembers,
  roleAccess,
  systemSettings,
  filesList,
  administrasiList,
  usersBase,
  activityLogs,
  votingList,
  onLogout,
  onUpdateState,
  onAddNotification,
  autoSelectProgjaId,
  autoSelectVotingId,
  onClearAutoSelect,
  googleAccessToken,
  setGoogleAccessToken,
  isSyncing,
  onSyncNow,
  onGoogleLogin,
}: DasborPengurusProps) {
  // Determine accessible tabs for current user based on roleAccess
  const currentAccess = roleAccess[currentUser.role];
  
  // List of all possible menu keys and their labels/icons
  const allMenus = [
    { key: 'dashboard_pengurus', label: 'Dasbor Pengurus', icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: 'sirkulasi_prokja', label: 'Sirkulasi Progja', icon: <Briefcase className="w-4 h-4" /> },
    { key: 'voting', label: 'Voting Pengurus', icon: <CheckCircle2 className="w-4 h-4 text-red-600" /> },
    { key: 'keuangan', label: 'Keuangan', icon: <Wallet className="w-4 h-4" /> },
    { key: 'anggota', label: 'Struktur & Anggota', icon: <Users className="w-4 h-4" /> },
    { key: 'file_download', label: 'File Download', icon: <Download className="w-4 h-4" /> },
    { key: 'biodata_koperasi', label: 'Biodata Koperasi', icon: <Building className="w-4 h-4" /> },
    { key: 'himbauan', label: 'Himbauan Pengawas', icon: <AlertOctagon className="w-4 h-4" /> },
    { key: 'gerai', label: 'Gerai Koperasi', icon: <Store className="w-4 h-4" /> },
    { key: 'administrasi_koperasi', label: 'Administrasi', icon: <FileText className="w-4 h-4" /> },
    { key: 'akses', label: 'Pengaturan Akses', icon: <FolderLock className="w-4 h-4" /> },
    { key: 'log_aktivitas', label: 'Log Aktivitas Pengurus', icon: <History className="w-4 h-4 text-emerald-600" /> },
    { key: 'sheets_sync', label: 'Google Sheets DB', icon: <FileCheck2 className="w-4 h-4 text-emerald-600" /> },
    { key: 'panduan_penggunaan', label: 'Panduan Penggunaan', icon: <Compass className="w-4 h-4 text-indigo-600" /> },
  ];

  // Filter menu list to only show what is allowed
  const allowedMenus = allMenus.filter(m => {
    if (m.key === 'panduan_penggunaan') return true;
    if (m.key === 'sheets_sync') return currentUser.role === 'admin_master';
    if (m.key === 'voting') return true; // Accessible to all board members
    if (m.key === 'log_aktivitas') return currentUser.role === 'admin_master' || currentUser.role === 'pengawas';
    if (m.key === 'gerai' && (currentUser.role === 'ketua' || currentUser.role === 'wakil_ketua_usaha')) return true;
    if (currentUser.role === 'admin_master') return true;
    return (currentAccess as any)[m.key];
  });

  // State of the active menu tab
  const [activeMenu, setActiveMenu] = useState<string>(allowedMenus[0]?.key || 'dashboard_pengurus');

  // Synchronize active tab menu with external routing trigger from public screen
  React.useEffect(() => {
    if (autoSelectProgjaId) {
      setActiveMenu('sirkulasi_prokja');
    } else if (autoSelectVotingId) {
      setActiveMenu('voting');
    }
  }, [autoSelectProgjaId, autoSelectVotingId]);

  // Memoized chart data for progja completion trend
  const chartData = React.useMemo(() => {
    const monthsId = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const data = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIndex = d.getMonth();
      const monthNum = String(monthIndex + 1).padStart(2, '0');
      const monthYearStr = `${year}-${monthNum}`;
      
      const label = `${monthsId[monthIndex]} ${String(year).slice(-2)}`;
      
      const actualInMonth = progjaList.filter(p => p.createdAt && p.createdAt.startsWith(monthYearStr));
      const actualCompletedInMonth = progjaList.filter(p => p.status === 'DIPUBLIKASIKAN' && p.updatedAt && p.updatedAt.startsWith(monthYearStr));
      
      let total = actualInMonth.length;
      let selesai = actualCompletedInMonth.length;
      
      // Inject some elegant mock data for previous months if no actual data exists there
      if (i > 0 && total === 0 && selesai === 0) {
        const seedValues = [
          { total: 4, selesai: 3 }, // 5 months ago
          { total: 5, selesai: 4 }, // 4 months ago
          { total: 3, selesai: 2 }, // 3 months ago
          { total: 7, selesai: 5 }, // 2 months ago
          { total: 6, selesai: 4 }, // 1 month ago
        ];
        const seedIndex = 5 - i;
        total = seedValues[seedIndex].total;
        selesai = seedValues[seedIndex].selesai;
      }
      
      data.push({
        name: label,
        'Total Program': total,
        'Selesai': selesai,
      });
    }
    
    return data;
  }, [progjaList]);

  // Memoized chart data for monthly financial transaction summary (Pemasukan vs Pengeluaran)
  const keuanganChartData = React.useMemo(() => {
    const monthsId = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const data = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIndex = d.getMonth();
      const monthNum = String(monthIndex + 1).padStart(2, '0');
      const monthYearStr = `${year}-${monthNum}`;
      
      const label = `${monthsId[monthIndex]} ${String(year).slice(-2)}`;
      
      const txsInMonth = keuangan.transactions.filter(tx => tx.date && tx.date.startsWith(monthYearStr));
      
      let pemasukan = txsInMonth
        .filter(tx => tx.type === 'IN')
        .reduce((sum, tx) => sum + tx.amount, 0);
        
      let pengeluaran = txsInMonth
        .filter(tx => tx.type === 'OUT')
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      // If there are no actual transactions for some past months, let's inject elegant seed data
      // so the chart isn't empty on initial load
      if (i > 0 && pemasukan === 0 && pengeluaran === 0) {
        const seedValues = [
          { pemasukan: 12000000, pengeluaran: 8000000 },  // 5 months ago
          { pemasukan: 15500000, pengeluaran: 11000000 }, // 4 months ago
          { pemasukan: 9800000, pengeluaran: 10500000 },  // 3 months ago
          { pemasukan: 24000000, pengeluaran: 18000000 }, // 2 months ago
          { pemasukan: 19500000, pengeluaran: 14000000 }, // 1 month ago
        ];
        const seedIndex = 5 - i;
        pemasukan = seedValues[seedIndex].pemasukan;
        pengeluaran = seedValues[seedIndex].pengeluaran;
      }
      
      data.push({
        name: label,
        'Pemasukan (Kas Masuk)': pemasukan,
        'Pengeluaran (Kas Keluar)': pengeluaran,
      });
    }
    
    return data;
  }, [keuangan.transactions]);

  // State for user guide target role selection
  const [selectedGuideRole, setSelectedGuideRole] = useState<Role>(currentUser.role);

  // States for NIK / Registration management (Admin Master)
  const [newNik, setNewNik] = useState('');
  const [newNikName, setNewNikName] = useState('');
  const [newNikRole, setNewNikRole] = useState<Role>('sekretaris');
  const [showAddNikForm, setShowAddNikForm] = useState(false);

  // States for Log Aktivitas
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logSelectedCategory, setLogSelectedCategory] = useState<string>('all');
  const [logSelectedRole, setLogSelectedRole] = useState<string>('all');

  // Notification center states
  const [readAlertIds, setReadAlertIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('koperasi_read_alerts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [notifCategoryFilter, setNotifCategoryFilter] = useState<'semua' | 'penting' | 'umum'>('semua');
  const [notifStatusFilter, setNotifStatusFilter] = useState<'belum_dibaca' | 'sudah_dibaca' | 'semua'>('belum_dibaca');

  // Pending Gerai approvals state
  const [pendingGeraiList, setPendingGeraiList] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('koperasi_pending_gerai');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // State variables for Gerai form
  const [newGeraiName, setNewGeraiName] = useState('');
  const [newGeraiLocation, setNewGeraiLocation] = useState('');
  const [newGeraiBudget, setNewGeraiBudget] = useState('');
  const [newGeraiFundingSource, setNewGeraiFundingSource] = useState('Dana Investasi Koperasi');
  const [newGeraiStock, setNewGeraiStock] = useState('100');
  const [newGeraiDescription, setNewGeraiDescription] = useState('');
  const [newGeraiPhotoUrl, setNewGeraiPhotoUrl] = useState('https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=600');
  const [showAddGeraiForm, setShowAddGeraiForm] = useState(false);
  const [activeGeraiSubTab, setActiveGeraiSubTab] = useState<'aktif' | 'pengajuan' | 'persetujuan'>('aktif');

  // Editing and deleting Gerai state variables
  const [editingGerai, setEditingGerai] = useState<any | null>(null);
  const [deletingGerai, setDeletingGerai] = useState<any | null>(null);
  const [editGeraiName, setEditGeraiName] = useState('');
  const [editGeraiLocation, setEditGeraiLocation] = useState('');
  const [editGeraiSales, setEditGeraiSales] = useState('');
  const [editGeraiProfit, setEditGeraiProfit] = useState('');
  const [editGeraiStock, setEditGeraiStock] = useState('');
  const [editGeraiBudget, setEditGeraiBudget] = useState('');
  const [editGeraiFundingSource, setEditGeraiFundingSource] = useState('Dana Investasi Koperasi');
  const [editGeraiDescription, setEditGeraiDescription] = useState('');
  const [editGeraiPhotoUrl, setEditGeraiPhotoUrl] = useState('');
  const [deleteReason, setDeleteReason] = useState('');

  // Generate alerts dynamically based on actual application states
  const alerts = React.useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      description: string;
      type: 'warning' | 'info' | 'success' | 'danger';
      time: string;
      category: string;
      targetMenu?: string;
      importance: 'penting' | 'umum';
    }> = [];

    // 1. Pending approval alerts for Ketua and Admin Master
    if (currentUser.role === 'ketua' || currentUser.role === 'admin_master') {
      const pendingProgja = progjaList.filter(p => p.status === 'DIAJUKAN');
      pendingProgja.forEach(p => {
        list.push({
          id: `progja-pending-${p.id}`,
          title: 'Persetujuan Program Kerja',
          description: `"${p.title}" diajukan oleh ${p.picName} memerlukan persetujuan ketua.`,
          type: 'warning',
          time: 'Baru saja',
          category: 'Sirkulasi Progja',
          targetMenu: 'sirkulasi_prokja',
          importance: 'penting',
        });
      });

      const pendingGerai = pendingGeraiList.filter(g => g.status === 'DIAJUKAN');
      pendingGerai.forEach(g => {
        let title = 'Pengajuan Gerai Baru';
        let desc = `Wakil Ketua Usaha mengajukan gerai "${g.name}" di ${g.location} (Rp ${g.budgetPlanned?.toLocaleString('id-ID') || 0})`;
        if (g.type === 'EDIT') {
          title = 'Pengajuan Edit Gerai';
          desc = `Wakil Ketua Usaha mengajukan perubahan data gerai "${g.name}" (Stok: ${g.stock}, Laba: Rp ${g.profit?.toLocaleString('id-ID') || 0})`;
        } else if (g.type === 'HAPUS') {
          title = 'Pengajuan Penutupan Gerai';
          desc = `Wakil Ketua Usaha mengajukan penutupan gerai "${g.name}" di ${g.location}. Alasan: "${g.description}"`;
        }
        list.push({
          id: `gerai-pending-${g.id}`,
          title: title,
          description: desc,
          type: 'warning',
          time: g.createdAt || 'Baru saja',
          category: 'Gerai Koperasi',
          targetMenu: 'gerai',
          importance: 'penting',
        });
      });
    }

    // 1b. Progja waiting for validation (MENUNGGU_VALIDASI status)
    const validatingProgja = progjaList.filter(p => p.status === 'MENUNGGU_VALIDASI');
    validatingProgja.forEach(p => {
      list.push({
        id: `progja-validate-${p.id}`,
        title: 'Validasi Program Kerja Terlaksana',
        description: `Progja "${p.title}" (PIC: ${p.picName}) telah selesai dilaksanakan dan menunggu validasi Ketua Koperasi.`,
        type: 'warning',
        time: 'Baru saja',
        category: 'Sirkulasi Progja',
        targetMenu: 'sirkulasi_prokja',
        importance: 'penting',
      });
    });

    // 1c. Financial Change Proposals (Pending Transactions)
    const pendingTxs = keuangan.pendingTransactions || [];
    const activePendingTxs = pendingTxs.filter(t => t.status === 'MENUNGGU_PERSETUJUAN');
    activePendingTxs.forEach(t => {
      list.push({
        id: `keuangan-pending-${t.id}`,
        title: `Pengajuan Perubahan Keuangan (${t.changeType})`,
        description: `Pengajuan ${t.changeType === 'BARU' ? 'transaksi baru' : t.changeType === 'EDIT' ? 'edit data' : 'hapus data'} senilai Rp ${t.amount.toLocaleString('id-ID')} (${t.category}) oleh ${t.requesterName} memerlukan validasi pengurus.`,
        type: 'warning',
        time: 'Menunggu Persetujuan',
        category: 'Keuangan',
        targetMenu: 'keuangan',
        importance: 'penting',
      });
    });

    // 2. Budget disbursement alerts for Bendahara and Admin Master
    if (currentUser.role === 'bendahara' || currentUser.role === 'admin_master') {
      const approvedProgja = progjaList.filter(p => p.status === 'DISETUJUI' && p.budget > 0);
      approvedProgja.forEach(p => {
        list.push({
          id: `progja-disburse-${p.id}`,
          title: 'Disbursement Dana Progja',
          description: `Progja "${p.title}" telah disetujui. Siapkan pencairan dana Rp ${p.budget.toLocaleString('id-ID')}.`,
          type: 'info',
          time: 'Hari ini',
          category: 'Keuangan',
          targetMenu: 'keuangan',
          importance: 'umum',
        });
      });
    }

    // 3. Progja in Revision status for the author
    const revisionProgja = progjaList.filter(p => p.status === 'REVISI' && (currentUser.role === 'admin_master' || p.picNik === currentUser.nik));
    revisionProgja.forEach(p => {
      list.push({
        id: `progja-revisi-${p.id}`,
        title: 'Revisi Program Kerja',
        description: `Progja "${p.title}" memerlukan perbaikan: ${p.notesFromKetua || 'Harap perbaiki detail.'}`,
        type: 'danger',
        time: 'Kemarin',
        category: 'Sirkulasi Progja',
        targetMenu: 'sirkulasi_prokja',
        importance: 'penting',
      });
    });

    // 4. Deadline alerts for approaching progja (within system settings threshold or 10 days)
    const thresholdDays = systemSettings.alertDaysBefore || 5;
    const today = new Date('2026-07-10'); // Current local date as of mock time
    progjaList.forEach(p => {
      if (['DISETUJUI', 'DRAFT', 'REVISI'].includes(p.status)) {
        try {
          const targetDate = new Date(p.targetDate);
          const diffTime = targetDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays <= thresholdDays) {
            list.push({
              id: `progja-deadline-${p.id}`,
              title: 'Peringatan H-Mendekati Pelaksanaan',
              description: `Progja "${p.title}" dijadwalkan tanggal ${p.targetDate} (${diffDays} hari lagi).`,
              type: 'danger',
              time: `${diffDays} hari lagi`,
              category: 'Peringatan Progja',
              targetMenu: 'sirkulasi_prokja',
              importance: 'penting',
            });
          }
        } catch (e) {
          // ignore date parse errors
        }
      }
    });

    // 5. Supervisor admonitions (Himbauan Pengawas)
    himbauanList.forEach(h => {
      list.push({
        id: `himbauan-${h.id}`,
        title: 'Himbauan Pengawas Koperasi',
        description: h.content.length > 80 ? `${h.content.substring(0, 80)}...` : h.content,
        type: 'danger',
        time: `Berlaku s/d ${h.endDate}`,
        category: 'Himbauan Pengawas',
        targetMenu: 'himbauan',
        importance: 'penting',
      });
    });

    // 6. Newly uploaded administrative letters or files
    filesList.slice(0, 3).forEach((f, idx) => {
      list.push({
        id: `file-uploaded-${idx}`,
        title: 'Dokumen Koperasi Baru',
        description: `File "${f.name}" (${f.size || 'KB'}) telah diarsipkan dalam folder ${f.category}.`,
        type: 'success',
        time: f.date,
        category: 'Administrasi',
        targetMenu: 'file_download',
        importance: 'umum',
      });
    });

    return list;
  }, [progjaList, currentUser, himbauanList, filesList, systemSettings, keuangan]);

  // Filter out read alerts
  const unreadAlerts = alerts.filter(a => !readAlertIds.includes(a.id));

  // Filter and process alerts based on category and status
  const filteredAlerts = React.useMemo(() => {
    return alerts.filter(a => {
      const isRead = readAlertIds.includes(a.id);
      if (notifStatusFilter === 'belum_dibaca' && isRead) return false;
      if (notifStatusFilter === 'sudah_dibaca' && !isRead) return false;

      if (notifCategoryFilter === 'penting' && a.importance !== 'penting') return false;
      if (notifCategoryFilter === 'umum' && a.importance !== 'umum') return false;

      return true;
    });
  }, [alerts, readAlertIds, notifCategoryFilter, notifStatusFilter]);

  const handleMarkAsRead = (id: string) => {
    const updated = [...readAlertIds, id];
    setReadAlertIds(updated);
    try {
      localStorage.setItem('koperasi_read_alerts', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleMarkRead = (id: string) => {
    let updated;
    if (readAlertIds.includes(id)) {
      updated = readAlertIds.filter(x => x !== id);
      onAddNotification('Notifikasi ditandai belum dibaca.', 'info');
    } else {
      updated = [...readAlertIds, id];
      onAddNotification('Notifikasi ditandai sudah dibaca.', 'success');
    }
    setReadAlertIds(updated);
    try {
      localStorage.setItem('koperasi_read_alerts', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllAsRead = () => {
    const allIds = alerts.map(a => a.id);
    setReadAlertIds(allIds);
    try {
      localStorage.setItem('koperasi_read_alerts', JSON.stringify(allIds));
    } catch (e) {
      console.error(e);
    }
    onAddNotification('Semua peringatan dan pesan ditandai telah dibaca.', 'success');
  };

  // Forms state inside different submenus
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [txType, setTxType] = useState<'IN' | 'OUT'>('OUT');
  const [txCategory, setTxCategory] = useState('Peralatan Kantor');
  const [txAmount, setTxAmount] = useState('');
  const [txDescription, setTxDescription] = useState('');
  const [editingTxId, setEditingTxId] = useState<string | null>(null);

  const [showAddHimbauan, setShowAddHimbauan] = useState(false);
  const [himbauanContent, setHimbauanContent] = useState('');
  const [himbauanEndDate, setHimbauanEndDate] = useState('');

  // Drag-and-drop files upload mock
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit cooperative biodata state
  const [editBioName, setEditBioName] = useState(biodata.name);
  const [editBioAddress, setEditBioAddress] = useState(biodata.address);
  const [editBioPhone, setEditBioPhone] = useState(biodata.phone);
  const [editBioEmail, setEditBioEmail] = useState(biodata.email);
  const [editBioFb, setEditBioFb] = useState(biodata.facebook);
  const [editBioIg, setEditBioIg] = useState(biodata.instagram);

  // Edit Member biodata state
  const [selectedMemberToEdit, setSelectedMemberToEdit] = useState<OrgMember | null>(null);
  const [editMemberPhone, setEditMemberPhone] = useState('');
  const [editMemberName, setEditMemberName] = useState('');

  // Letter writing / Administrasi state
  const [showAddLetter, setShowAddLetter] = useState(false);
  const [letterType, setLetterType] = useState('Surat Keluar');
  const [letterNumber, setLetterNumber] = useState('');
  const [letterSubject, setLetterSubject] = useState('');
  const [letterDate, setLetterDate] = useState('');

  // Custom alert settings state
  const [customAlertDays, setCustomAlertDays] = useState(systemSettings.alertDaysBefore);

  // Roles list mapping Indonesian friendly names
  const rolesList: { label: string; value: Role }[] = [
    { label: 'Admin Master (ardi)', value: 'admin_master' },
    { label: 'Ketua Koperasi', value: 'ketua' },
    { label: 'Pengawas Koperasi', value: 'pengawas' },
    { label: 'Bendahara Koperasi', value: 'bendahara' },
    { label: 'Wakil Ketua Bidang Usaha', value: 'wakil_ketua_usaha' },
    { label: 'Wakil Ketua Bidang Anggota', value: 'wakil_ketua_anggota' },
    { label: 'Sekretaris', value: 'sekretaris' },
  ];

  // -----------------------------------------------------
  // LOGIC HANDLERS
  // -----------------------------------------------------

  // Helper to construct a standard Activity Log entry
  const createActivityLogEntry = (
    category: 'progja' | 'keuangan' | 'auth' | 'system',
    action: string,
    description: string
  ): ActivityLog => {
    const now = new Date();
    const formattedTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    return {
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      timestamp: formattedTime,
      userNik: currentUser.nik,
      userName: currentUser.name,
      userRole: currentUser.role,
      category,
      action,
      description,
    };
  };

  // Handler to generate and download Monthly Financial Health PDF Report
  const handleDownloadKeuanganPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      let y = 20;
      const margin = 15;
      const pageWidth = 210;
      const pageHeight = 297;
      const usableWidth = pageWidth - (margin * 2);

      // Helper function to handle custom borders and headers on page addition
      const drawPageBorder = (colorHex: [number, number, number] = [99, 102, 241]) => {
        doc.setDrawColor(colorHex[0], colorHex[1], colorHex[2]); // Indigo or Slate
        doc.setLineWidth(0.6);
        doc.rect(margin - 4, margin - 4, usableWidth + 8, pageHeight - (margin * 2) + 8);
      };

      const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - margin - 15) {
          doc.addPage();
          drawPageBorder([203, 213, 225]); // Slate-300 border for subsequent pages
          y = margin + 10;
        }
      };

      // Draw border frame on the first page
      drawPageBorder([99, 102, 241]);

      // Koperasi Header Info
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(30, 41, 59); // slate-800
      doc.text((biodata.name || 'Koperasi Indonesia').toUpperCase(), margin, y);
      y += 6;

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139); // slate-500
      const bioContact = `Alamat: ${biodata.address || '-'} | Telp: ${biodata.phone || '-'} | Email: ${biodata.email || '-'}`;
      doc.text(bioContact, margin, y);
      y += 4;

      // Elegant Separator Line
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(margin, y, margin + usableWidth, y);
      y += 8;

      // Report Title
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(79, 70, 229); // indigo-600
      doc.text('LAPORAN RINGKASAN KESEHATAN FINANSIAL BULANAN', margin, y);
      y += 5;

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // slate-500
      const currentDate = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(`Dicetak pada: ${currentDate} | Pengunduh: ${currentUser.name} (${currentUser.role.toUpperCase()}) | Klasifikasi: Arsip Internal Koperasi`, margin, y);
      y += 10;

      // SECTION I: RINGKASAN SALDO UTAMA
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text('I. RINGKASAN SALDO UTAMA KOPERASI', margin, y);
      y += 6;

      // Card 1: Sisa Kas Total Koperasi
      doc.setFillColor(240, 253, 244); // bg-emerald-50
      doc.setDrawColor(187, 247, 208); // border-emerald-200
      doc.rect(margin, y, usableWidth / 2 - 2, 22, 'FD');
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(6, 95, 70); // emerald-800
      doc.text('SISA KAS TOTAL KOPERASI', margin + 4, y + 6);
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(4, 120, 87); // emerald-700
      doc.text(`Rp ${(keuangan.totalCash || 0).toLocaleString('id-ID')}`, margin + 4, y + 13);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(5, 150, 105); // emerald-600
      doc.text('Likuiditas kas terverifikasi Bendahara', margin + 4, y + 18);

      // Card 2: Sisa Hasil Usaha (SHU)
      doc.setFillColor(239, 246, 255); // bg-blue-50
      doc.setDrawColor(191, 219, 254); // border-blue-200
      doc.rect(margin + usableWidth / 2 + 2, y, usableWidth / 2 - 2, 22, 'FD');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 64, 175); // blue-800
      doc.text('SISA HASIL USAHA (SHU)', margin + usableWidth / 2 + 6, y + 6);

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(29, 78, 216); // blue-700
      doc.text(`Rp ${(keuangan.totalSHU || 0).toLocaleString('id-ID')}`, margin + usableWidth / 2 + 6, y + 13);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(37, 99, 235); // blue-600
      doc.text('Net profit bersih terdistribusi', margin + usableWidth / 2 + 6, y + 18);

      y += 28;

      // SECTION II: KESEHATAN ANGGARAN
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text('II. PERBANDINGAN ANGGARAN PROGRAM KERJA', margin, y);
      y += 6;

      // Budget Box Row
      doc.setFillColor(248, 250, 252); // bg-slate-50
      doc.setDrawColor(226, 232, 240); // border-slate-200
      doc.rect(margin, y, usableWidth, 14, 'FD');

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text('Total Anggaran Direncanakan (Planned):', margin + 4, y + 8.5);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`Rp ${(keuangan.budgetPlanned || 0).toLocaleString('id-ID')}`, margin + 58, y + 8.5);

      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('Realisasi Anggaran Terpakai (Realisasi):', margin + 98, y + 8.5);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(225, 29, 72); // rose-600
      doc.text(`Rp ${(keuangan.budgetUsed || 0).toLocaleString('id-ID')}`, margin + 152, y + 8.5);

      y += 20;

      // SECTION III: TREN BULANAN
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text('III. ANALISIS TREN KAS BULANAN (6 BULAN TERAKHIR)', margin, y);
      y += 6;

      // Trend Table Header
      doc.setFillColor(224, 231, 255); // indigo-100
      doc.setDrawColor(199, 210, 254); // indigo-200
      doc.rect(margin, y, usableWidth, 7, 'FD');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(49, 46, 129); // indigo-900
      doc.text('Periode Bulan', margin + 4, y + 5);
      doc.text('Kas Masuk (Pemasukan)', margin + 45, y + 5);
      doc.text('Kas Keluar (Pengeluaran)', margin + 95, y + 5);
      doc.text('Selisih Kas Bersih (Net Flow)', margin + 145, y + 5);
      y += 7;

      // Loop month trends
      keuanganChartData.forEach((row, index) => {
        const isAlternate = index % 2 === 1;
        if (isAlternate) {
          doc.setFillColor(248, 250, 252); // bg-slate-50
          doc.rect(margin, y, usableWidth, 7, 'F');
        }
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85); // slate-700
        doc.text(row.name, margin + 4, y + 5);

        const inAmt = row['Pemasukan (Kas Masuk)'] || 0;
        const outAmt = row['Pengeluaran (Kas Keluar)'] || 0;

        doc.setFont('Helvetica', 'medium');
        doc.setTextColor(16, 185, 129); // emerald-500
        doc.text(`+Rp ${inAmt.toLocaleString('id-ID')}`, margin + 45, y + 5);

        doc.setTextColor(239, 68, 68); // rose-500
        doc.text(`-Rp ${outAmt.toLocaleString('id-ID')}`, margin + 95, y + 5);

        const net = inAmt - outAmt;
        if (net >= 0) {
          doc.setTextColor(4, 120, 87); // emerald-700
          doc.text(`+Rp ${net.toLocaleString('id-ID')}`, margin + 145, y + 5);
        } else {
          doc.setTextColor(190, 24, 74); // rose-700
          doc.text(`-Rp ${Math.abs(net).toLocaleString('id-ID')}`, margin + 145, y + 5);
        }
        y += 7;
      });

      y += 12;

      // SECTION IV: LEDGER TRANSAKSI TERBARU
      checkPageBreak(50);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text('IV. BUKU LEDGER RIWAYAT TRANSAKSI TERBARU', margin, y);
      y += 6;

      // Table Header
      doc.setFillColor(241, 245, 249); // slate-100
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.rect(margin, y, usableWidth, 8, 'FD');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text('Tanggal', margin + 3, y + 5.5);
      doc.text('Kategori & Jenis', margin + 25, y + 5.5);
      doc.text('Keterangan / Deskripsi Transaksi', margin + 68, y + 5.5);
      doc.text('Nominal Kas', margin + 142, y + 5.5);
      y += 8;

      const txList = keuangan.transactions || [];
      if (txList.length === 0) {
        doc.setFont('Helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text('Belum ada riwayat transaksi keuangan yang tercatat.', margin + 4, y + 5);
        y += 8;
      } else {
        const sortedTransactions = [...txList].sort((a, b) => b.date.localeCompare(a.date));
        
        // Take latest 20 transactions to fit beautifully
        const printTransactions = sortedTransactions.slice(0, 20);

        printTransactions.forEach((tx) => {
          checkPageBreak(10);
          
          doc.setFillColor(tx.type === 'IN' ? 240 : 254, tx.type === 'IN' ? 253 : 242, tx.type === 'IN' ? 244 : 244); // soft green or soft red
          doc.rect(margin, y, usableWidth, 7.5, 'F');

          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(100, 116, 139); // slate-500
          doc.text(tx.date || '-', margin + 3, y + 5);

          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(7);
          if (tx.type === 'IN') {
            doc.setTextColor(5, 150, 105); // emerald-600
            doc.text(`[MASUK] ${tx.category || '-'}`, margin + 25, y + 5);
          } else {
            doc.setTextColor(225, 29, 72); // rose-600
            doc.text(`[KELUAR] ${tx.category || '-'}`, margin + 25, y + 5);
          }

          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(15, 23, 42); // slate-900
          const shortDesc = tx.description && tx.description.length > 40 ? tx.description.slice(0, 40) + '...' : tx.description || '-';
          doc.text(shortDesc, margin + 68, y + 5);

          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(7.5);
          if (tx.type === 'IN') {
            doc.setTextColor(4, 120, 87); // emerald-700
            doc.text(`+Rp ${(tx.amount || 0).toLocaleString('id-ID')}`, margin + 142, y + 5);
          } else {
            doc.setTextColor(190, 24, 74); // rose-700
            doc.text(`-Rp ${(tx.amount || 0).toLocaleString('id-ID')}`, margin + 142, y + 5);
          }
          y += 8;
        });

        if (sortedTransactions.length > 20) {
          checkPageBreak(8);
          doc.setFont('Helvetica', 'italic');
          doc.setFontSize(7);
          doc.setTextColor(100, 116, 139);
          doc.text(`* Menampilkan 20 dari total ${sortedTransactions.length} histori transaksi terbaru demi efisiensi halaman.`, margin + 3, y + 5);
          y += 8;
        }
      }

      // SECTION V: TANDA TANGAN VALIDASI
      checkPageBreak(38);
      y += 5;
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.line(margin, y, margin + usableWidth, y);
      y += 8;

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text('Divalidasi Oleh:', margin + 6, y);
      doc.text('Disetujui Oleh:', margin + 115, y);
      y += 13;

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('BENDAHARA KOPERASI', margin + 6, y);
      doc.text('KETUA KOPERASI', margin + 115, y);
      
      doc.setFont('Helvetica', 'italic');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184); // slate-400
      y += 3.5;
      doc.text('Tanda tangan elektronik divalidasi sistem', margin + 6, y);
      doc.text('Tanda tangan elektronik disahkan sistem', margin + 115, y);

      // Post-pass page numbers
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Halaman ${i} dari ${totalPages} | Dokumen Laporan Keuangan Internal ${biodata.name || 'Koperasi'}`,
          margin,
          pageHeight - 8
        );
      }

      const fileDate = new Date().toISOString().split('T')[0];
      doc.save(`Laporan_Keuangan_Koperasi_${fileDate}.pdf`);
      onAddNotification('Laporan ringkasan kesehatan finansial berhasil diunduh sebagai file PDF.', 'success');
    } catch (err) {
      console.error('PDF Generation Error:', err);
      alert('Gagal membuat dokumen PDF. Mohon coba lagi.');
    }
  };

  // Save manual transaction entry (supports add and edit)
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || !txDescription) {
      alert('Mohon isi semua bidang transaksi keuangan.');
      return;
    }
    const amt = parseFloat(txAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Jumlah transaksi harus valid.');
      return;
    }

    if (editingTxId) {
      // EDIT MODE
      const oldTx = keuangan.transactions.find(t => t.id === editingTxId);
      if (!oldTx) return;

      // Calculate cash balance changes
      let newCash = keuangan.totalCash;
      // Revert old transaction cash effect
      if (oldTx.type === 'IN') {
        newCash -= oldTx.amount;
      } else {
        newCash += oldTx.amount;
      }
      // Apply new transaction cash effect
      if (txType === 'IN') {
        newCash += amt;
      } else {
        newCash -= amt;
      }

      const updatedTxList = keuangan.transactions.map(tx => {
        if (tx.id === editingTxId) {
          return {
            ...tx,
            type: txType,
            category: txCategory,
            amount: amt,
            description: txDescription,
          };
        }
        return tx;
      });

      const logDesc = `Mengedit transaksi keuangan [${oldTx.description}] (Kategori: ${oldTx.category}, Rp ${oldTx.amount}) menjadi [${txDescription}] (Kategori: ${txCategory}, Rp ${amt}, tipe: ${txType === 'IN' ? 'KAS MASUK' : 'KAS KELUAR'}).`;
      const newLog = createActivityLogEntry('keuangan', 'Edit Transaksi', logDesc);

      onUpdateState({
        keuangan: {
          ...keuangan,
          totalCash: newCash,
          transactions: updatedTxList,
        },
        activityLogs: [newLog, ...activityLogs],
      });

      onAddNotification('Transaksi keuangan berhasil diperbarui.', 'success');
      setEditingTxId(null);
    } else {
      // ADD MODE
      const newTx = {
        id: 'tx-' + Math.random().toString(36).substr(2, 9),
        type: txType,
        category: txCategory,
        amount: amt,
        description: txDescription,
        date: new Date().toISOString().split('T')[0],
        requester: `${currentUser.name} (${currentUser.role.replace(/_/g, ' ')})`,
      };

      // Update balances
      let newCash = keuangan.totalCash;
      if (txType === 'IN') {
        newCash += amt;
      } else {
        newCash -= amt;
      }

      const logDesc = txType === 'IN'
        ? `Memasukkan penerimaan kas senilai Rp ${amt.toLocaleString('id-ID')} untuk: ${txDescription} (${txCategory}).`
        : `Mengeluarkan kas senilai Rp ${amt.toLocaleString('id-ID')} untuk: ${txDescription} (${txCategory}).`;
      
      const newLog = createActivityLogEntry('keuangan', txType === 'IN' ? 'Kas Masuk' : 'Kas Keluar', logDesc);

      onUpdateState({
        keuangan: {
          ...keuangan,
          totalCash: newCash,
          transactions: [newTx, ...keuangan.transactions],
        },
        activityLogs: [newLog, ...activityLogs],
      });

      onAddNotification(`Transaksi ${txType === 'IN' ? 'Kas Masuk' : 'Kas Keluar'} berhasil diinput.`, 'success');
    }

    setTxAmount('');
    setTxDescription('');
    setShowAddTransaction(false);
  };

  const handleStartEditTransaction = (tx: KeuanganTransaction) => {
    setEditingTxId(tx.id);
    setTxType(tx.type);
    setTxCategory(tx.category);
    setTxAmount(tx.amount.toString());
    setTxDescription(tx.description);
    setShowAddTransaction(true);
  };

  const handleDeleteTransaction = (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus transaksi ini secara permanen dari ledger?')) {
      return;
    }
    const tx = keuangan.transactions.find(t => t.id === id);
    if (!tx) return;

    let cashChange = 0;
    if (tx.type === 'IN') {
      cashChange = -tx.amount;
    } else {
      cashChange = tx.amount;
    }

    const updatedTxList = keuangan.transactions.filter(t => t.id !== id);

    const logDesc = `Menghapus transaksi keuangan [${tx.description}] senilai Rp ${tx.amount.toLocaleString('id-ID')} (${tx.category}).`;
    const newLog = createActivityLogEntry('keuangan', 'Hapus Transaksi', logDesc);

    onUpdateState({
      keuangan: {
        ...keuangan,
        totalCash: keuangan.totalCash + cashChange,
        transactions: updatedTxList,
      },
      activityLogs: [newLog, ...activityLogs],
    });

    onAddNotification('Transaksi keuangan berhasil dihapus dari ledger.', 'success');
  };

  // Create appeal (Himbauan) from Pengawas
  const handleAddHimbauan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!himbauanContent || !himbauanEndDate) {
      alert('Mohon lengkapi isi himbauan dan tanggal berakhir.');
      return;
    }

    const newHimbauan: Himbauan = {
      id: 'h-' + Math.random().toString(36).substr(2, 9),
      content: himbauanContent,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      date: new Date().toISOString().split('T')[0],
      endDate: himbauanEndDate,
    };

    onUpdateState({
      himbauanList: [newHimbauan, ...himbauanList],
    });

    onAddNotification('Himbauan baru dari Pengawas berhasil dirilis ke publik dan pengurus.', 'success');
    setHimbauanContent('');
    setHimbauanEndDate('');
    setShowAddHimbauan(false);
  };

  // Delete appeal
  const handleDeleteHimbauan = (id: string) => {
    onUpdateState({
      himbauanList: himbauanList.filter(h => h.id !== id),
    });
    onAddNotification('Himbauan berhasil dihapus.', 'info');
  };

  // Save modified cooperative info (Biodata)
  const handleSaveBiodata = () => {
    onUpdateState({
      biodata: {
        ...biodata,
        name: editBioName,
        address: editBioAddress,
        phone: editBioPhone,
        email: editBioEmail,
        facebook: editBioFb,
        instagram: editBioIg,
      },
    });
    onAddNotification('Biodata Koperasi berhasil diperbarui dan dipublish ke Beranda.', 'success');
  };

  // Edit / update member phone or name
  const handleSaveMemberEdit = () => {
    if (!selectedMemberToEdit) return;
    const updatedMembers = orgMembers.map(m => {
      if (m.id === selectedMemberToEdit.id) {
        return {
          ...m,
          name: editMemberName,
          phone: editMemberPhone,
        };
      }
      return m;
    });

    onUpdateState({
      orgMembers: updatedMembers,
    });
    onAddNotification(`Profil pengurus ${editMemberName} berhasil diperbarui.`, 'success');
    setSelectedMemberToEdit(null);
  };

  // Toggle single access privilege checkbox
  const handleToggleAccess = (role: Role, menuKey: keyof RoleAccess) => {
    const updatedAccess = { ...roleAccess };
    updatedAccess[role] = {
      ...updatedAccess[role],
      [menuKey]: !updatedAccess[role][menuKey],
    };

    onUpdateState({
      roleAccess: updatedAccess,
    });
    onAddNotification(`Akses menu "${menuKey}" untuk role "${role.replace(/_/g, ' ')}" berhasil diperbarui.`, 'info');
  };

  // Save manual letter / administration entry
  const handleAddLetter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!letterNumber || !letterSubject || !letterDate) {
      alert('Mohon isi nomor surat, perihal, dan tanggal surat.');
      return;
    }

    const newLetter = {
      id: 'let-' + Math.random().toString(36).substr(2, 9),
      type: letterType,
      number: letterNumber,
      subject: letterSubject,
      date: letterDate,
      sender: currentUser.name,
    };

    onUpdateState({
      administrasiList: [newLetter, ...administrasiList],
    });

    onAddNotification('Surat resmi berhasil dimasukkan ke draf kearsipan administrasi.', 'success');
    setLetterNumber('');
    setLetterSubject('');
    setLetterDate('');
    setShowAddLetter(false);
  };

  // Delete letters
  const handleDeleteLetter = (id: string) => {
    onUpdateState({
      administrasiList: administrasiList.filter(l => l.id !== id),
    });
    onAddNotification('Arsip surat berhasil dihapus.', 'info');
  };

  // Submit new Gerai proposal (Wakil Ketua Bidang Usaha)
  const handleAddGeraiProposal = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newGeraiName || !newGeraiLocation || !newGeraiBudget || !newGeraiDescription) {
      onAddNotification('Harap lengkapi semua isian formulir.', 'warning');
      return;
    }

    const budgetVal = parseFloat(newGeraiBudget);
    if (isNaN(budgetVal) || budgetVal <= 0) {
      onAddNotification('Nominal rencana anggaran harus lebih besar dari 0.', 'warning');
      return;
    }

    const stockVal = parseInt(newGeraiStock);
    if (isNaN(stockVal) || stockVal < 0) {
      onAddNotification('Jumlah persediaan awal tidak valid.', 'warning');
      return;
    }

    const proposalId = 'g-prop-' + Math.random().toString(36).substr(2, 9);
    
    const newProposal = {
      id: proposalId,
      name: newGeraiName,
      location: newGeraiLocation,
      budgetPlanned: budgetVal,
      fundingSource: newGeraiFundingSource,
      initialStock: stockVal,
      description: newGeraiDescription,
      photoUrl: newGeraiPhotoUrl,
      status: 'DIAJUKAN',
      submittedByNik: currentUser.nik,
      submittedByName: currentUser.name,
      createdAt: new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    };

    // 1. Save to local pending list
    const updatedList = [newProposal, ...pendingGeraiList];
    setPendingGeraiList(updatedList);
    localStorage.setItem('koperasi_pending_gerai', JSON.stringify(updatedList));

    // 2. Create program kerja (Progja) in status "DIAJUKAN"
    const newProgjaId = 'p-gerai-' + Math.random().toString(36).substr(2, 9);
    const newProgjaItem = {
      id: newProgjaId,
      title: `Pembangunan & Operasional Gerai: ${newGeraiName}`,
      picNik: currentUser.nik,
      picName: currentUser.name,
      picRole: currentUser.role,
      sector: 'Unit Usaha',
      targetDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0], // 30 days from now
      budget: budgetVal,
      fundingSource: newGeraiFundingSource,
      indicators: `Terbukanya gerai baru di ${newGeraiLocation}, tersedianya stok awal ${stockVal} Pcs.`,
      description: `Program kerja penambahan cabang gerai baru untuk meningkatkan pendapatan usaha koperasi. Rincian: ${newGeraiDescription}`,
      collaborators: ['ketua', 'bendahara'] as Role[],
      status: 'DIAJUKAN' as const,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      subTasks: [
        {
          id: `${newProgjaId}-t1`,
          title: 'Persiapan Tempat & Desain Interior',
          assignedToNik: currentUser.nik,
          assignedToName: currentUser.name,
          assignedToRole: currentUser.role,
          isDone: false
        },
        {
          id: `${newProgjaId}-t2`,
          title: 'Pengadaan Inventaris & Stocking Barang',
          assignedToNik: currentUser.nik,
          assignedToName: currentUser.name,
          assignedToRole: currentUser.role,
          isDone: false
        }
      ]
    };

    // Save progja and log activity atomically
    const updatedProgjas = [newProgjaItem, ...progjaList];

    // 3. Log Activity
    const newLog = {
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userNik: currentUser.nik,
      userName: currentUser.name,
      userRole: currentUser.role,
      category: 'progja' as const,
      action: 'Pengajuan Gerai Baru',
      description: `Mengajukan pembangunan gerai "${newGeraiName}" di ${newGeraiLocation} dengan anggaran Rp ${budgetVal.toLocaleString('id-ID')}`
    };
    onUpdateState({
      progjaList: updatedProgjas,
      activityLogs: [newLog, ...activityLogs]
    });

    // Reset Form
    setNewGeraiName('');
    setNewGeraiLocation('');
    setNewGeraiBudget('');
    setNewGeraiDescription('');
    setShowAddGeraiForm(false);
    onAddNotification('Proposal penambahan gerai berhasil diajukan & dikirim ke Ketua!', 'success');
  };

  const handleStartEdit = (g: any) => {
    setEditingGerai(g);
    setEditGeraiName(g.name);
    setEditGeraiLocation(g.location);
    setEditGeraiSales(g.sales.toString());
    setEditGeraiProfit(g.profit.toString());
    setEditGeraiStock(g.stock.toString());
    setEditGeraiBudget('10000000');
    setEditGeraiFundingSource('Dana Investasi Koperasi');
    setEditGeraiDescription(`Usulan pembaruan operasional untuk gerai ${g.name}. Penyesuaian ketersediaan stok, optimalisasi laba, dan pemeliharaan outlet.`);
    setEditGeraiPhotoUrl('https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=600');
    // Switch to pengajuan tab to see/fill the edit proposal form
    setActiveGeraiSubTab('pengajuan');
    setDeletingGerai(null); // clear deleting if editing
  };

  const handleStartDelete = (g: any) => {
    setDeletingGerai(g);
    setDeleteReason(`Kinerja penjualan dan sirkulasi stok di gerai ${g.name} kurang optimal, usulan relokasi aset ke gerai utama.`);
    // Switch to pengajuan tab to see/fill the delete proposal form
    setActiveGeraiSubTab('pengajuan');
    setEditingGerai(null); // clear editing if deleting
  };

  const handleAddEditProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGerai) return;

    const budgetVal = parseFloat(editGeraiBudget);
    const salesVal = parseFloat(editGeraiSales) || 0;
    const profitVal = parseFloat(editGeraiProfit) || 0;
    const stockVal = parseInt(editGeraiStock) || 0;

    if (isNaN(budgetVal) || budgetVal < 0) {
      onAddNotification('Rencana anggaran edit tidak valid.', 'warning');
      return;
    }

    const proposalId = 'g-prop-' + Math.random().toString(36).substr(2, 9);
    const newProposal = {
      id: proposalId,
      type: 'EDIT',
      geraiId: editingGerai.id,
      name: editGeraiName,
      location: editGeraiLocation,
      sales: salesVal,
      profit: profitVal,
      stock: stockVal,
      budgetPlanned: budgetVal,
      fundingSource: editGeraiFundingSource,
      description: editGeraiDescription,
      photoUrl: editGeraiPhotoUrl,
      status: 'DIAJUKAN',
      submittedByNik: currentUser.nik,
      submittedByName: currentUser.name,
      createdAt: new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      oldData: {
        name: editingGerai.name,
        location: editingGerai.location,
        sales: editingGerai.sales,
        profit: editingGerai.profit,
        stock: editingGerai.stock
      }
    };

    const updatedList = [newProposal, ...pendingGeraiList];
    setPendingGeraiList(updatedList);
    localStorage.setItem('koperasi_pending_gerai', JSON.stringify(updatedList));

    // Create activity log
    const newLog = {
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userNik: currentUser.nik,
      userName: currentUser.name,
      userRole: currentUser.role,
      category: 'progja' as const,
      action: 'Pengajuan Edit Gerai',
      description: `Mengajukan perubahan data gerai "${editingGerai.name}" ke "${editGeraiName}"`
    };
    onUpdateState({ activityLogs: [newLog, ...activityLogs] });

    setEditingGerai(null);
    onAddNotification(`Proposal edit gerai "${editingGerai.name}" berhasil dikirim ke Ketua untuk divalidasi!`, 'success');
  };

  const handleAddDeleteProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletingGerai) return;

    if (!deleteReason.trim()) {
      onAddNotification('Harap isi alasan penghapusan gerai.', 'warning');
      return;
    }

    const proposalId = 'g-prop-' + Math.random().toString(36).substr(2, 9);
    const newProposal = {
      id: proposalId,
      type: 'HAPUS',
      geraiId: deletingGerai.id,
      name: deletingGerai.name,
      location: deletingGerai.location,
      budgetPlanned: 0,
      fundingSource: 'N/A',
      description: deleteReason,
      photoUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=600',
      status: 'DIAJUKAN',
      submittedByNik: currentUser.nik,
      submittedByName: currentUser.name,
      createdAt: new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    };

    const updatedList = [newProposal, ...pendingGeraiList];
    setPendingGeraiList(updatedList);
    localStorage.setItem('koperasi_pending_gerai', JSON.stringify(updatedList));

    // Create activity log
    const newLog = {
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userNik: currentUser.nik,
      userName: currentUser.name,
      userRole: currentUser.role,
      category: 'progja' as const,
      action: 'Pengajuan Hapus Gerai',
      description: `Mengajukan penutupan gerai "${deletingGerai.name}"`
    };
    onUpdateState({ activityLogs: [newLog, ...activityLogs] });

    setDeletingGerai(null);
    onAddNotification(`Proposal penutupan gerai "${deletingGerai.name}" berhasil dikirim ke Ketua untuk divalidasi!`, 'success');
  };

  // Validate / Approve Gerai proposal (Ketua / Admin Master)
  const handleApproveGeraiProposal = (proposalId: string) => {
    const proposal = pendingGeraiList.find(g => g.id === proposalId);
    if (!proposal) return;

    // 1. Update status in pendingGeraiList to 'DISETUJUI'
    const updatedPending = pendingGeraiList.map(g => {
      if (g.id === proposalId) {
        return { ...g, status: 'DISETUJUI' };
      }
      return g;
    });
    setPendingGeraiList(updatedPending);
    localStorage.setItem('koperasi_pending_gerai', JSON.stringify(updatedPending));

    // Handle different types
    const proposalType = proposal.type || 'BARU';
    let updatedGeraiList = [...geraiList];
    let updatedProgjas = [...progjaList];
    let updatedNewsList = [...newsList];
    let logDescription = '';

    if (proposalType === 'BARU') {
      // Add as a real active outlet in geraiList!
      const newOutlet = {
        id: 'gr-' + Math.random().toString(36).substr(2, 5),
        name: proposal.name,
        location: proposal.location,
        sales: 0,
        profit: 0,
        stock: proposal.initialStock
      };
      updatedGeraiList = [...geraiList, newOutlet];

      // Update the corresponding Program Kerja to 'DIPUBLIKASIKAN' (or 'DISETUJUI')
      updatedProgjas = progjaList.map(p => {
        if (p.title.includes(proposal.name) && p.picNik === proposal.submittedByNik) {
          return { ...p, status: 'DIPUBLIKASIKAN' as const };
        }
        return p;
      });

      // Create and publish a news article on the public portal!
      const newNews = {
        id: 'news-gerai-' + Math.random().toString(36).substr(2, 9),
        title: `Koperasi Resmikan Unit Usaha Baru: ${proposal.name}`,
        content: `Koperasi Digital Merah Putih Sejahtera secara resmi mengumumkan pembukaan cabang unit usaha baru, yaitu ${proposal.name}. Gerai yang berlokasi di ${proposal.location} ini dibangun dengan matang berdasarkan rencana kerja Wakil Ketua Bidang Usaha yang telah disetujui penuh oleh Ketua Koperasi.\n\nUnit usaha ini didanai melalui sumber dana "${proposal.fundingSource}" dengan rencana anggaran sebesar Rp ${proposal.budgetPlanned.toLocaleString('id-ID')}. Pada tahap awal operasional, gerai ini didukung persediaan stock sebanyak ${proposal.initialStock} Pcs barang kebutuhan anggota.\n\nKetua Koperasi menyampaikan bahwa ekspansi bisnis ini adalah langkah strategis dalam mengoptimalkan Sisa Hasil Usaha (SHU) dan memberikan pelayanan prima serta kemudahan bagi seluruh anggota koperasi. Mari kita dukung dan manfaatkan gerai baru ini untuk kesejahteraan bersama!`,
        photo: proposal.photoUrl,
        date: new Date().toISOString().split('T')[0],
        shares: 0,
        likes: 0
      };
      updatedNewsList = [newNews, ...newsList];
      logDescription = `Ketua Koperasi (${currentUser.name} - NIK: ${currentUser.nik}) menyetujui & memvalidasi pembangunan gerai baru "${proposal.name}" di ${proposal.location} dengan Anggaran Operasional Rp ${proposal.budgetPlanned.toLocaleString('id-ID')}. Usulan diajukan oleh Wakil Ketua Bidang Usaha (${proposal.submittedByName} - NIK: ${proposal.submittedByNik}).`;
    } else if (proposalType === 'EDIT') {
      // Edit an existing outlet in geraiList
      updatedGeraiList = geraiList.map(g => {
        if (g.id === proposal.geraiId) {
          return {
            ...g,
            name: proposal.name,
            location: proposal.location,
            sales: proposal.sales,
            profit: proposal.profit,
            stock: proposal.stock
          };
        }
        return g;
      });

      // Create and publish a news article for editing/operational update!
      const newNews = {
        id: 'news-gerai-edit-' + Math.random().toString(36).substr(2, 9),
        title: `Pembaruan Kinerja & Operasional Gerai: ${proposal.name}`,
        content: `Koperasi mengumumkan pembaruan data operasional untuk unit usaha "${proposal.name}" (${proposal.location}) setelah divalidasi oleh Ketua Koperasi.\n\nBerdasarkan pengajuan usulan program penyesuaian oleh Wakil Ketua Bidang Usaha, gerai ini saat ini memiliki status kinerja terupdate:\n- Estimasi Omzet Penjualan: Rp ${proposal.sales.toLocaleString('id-ID')}\n- Laba Bersih Operasional: Rp ${proposal.profit.toLocaleString('id-ID')}\n- Sisa Persediaan Barang: ${proposal.stock} Pcs.\n\nRencana anggaran penyesuaian operasional sebesar Rp ${proposal.budgetPlanned?.toLocaleString('id-ID') || 0} didanai menggunakan "${proposal.fundingSource}".\n\nPenyesuaian ini dirancang agar pelayanan unit dagangan koperasi tetap prima, transparan, serta efisien demi kesejahteraan seluruh anggota.`,
        photo: proposal.photoUrl,
        date: new Date().toISOString().split('T')[0],
        shares: 0,
        likes: 0
      };
      updatedNewsList = [newNews, ...newsList];
      logDescription = `Ketua Koperasi (${currentUser.name} - NIK: ${currentUser.nik}) menyetujui & memvalidasi perubahan data operasional gerai "${proposal.name}" (ID Gerai: ${proposal.geraiId}). Usulan diajukan oleh Wakil Ketua Bidang Usaha (${proposal.submittedByName} - NIK: ${proposal.submittedByNik}). Detail penyesuaian data baru: Omzet Rp ${proposal.sales.toLocaleString('id-ID')}, Laba Rp ${proposal.profit.toLocaleString('id-ID')}, Stok ${proposal.stock} Pcs.`;
    } else if (proposalType === 'HAPUS') {
      // Remove outlet from geraiList
      updatedGeraiList = geraiList.filter(g => g.id !== proposal.geraiId);

      // Create and publish a news article for restrukturisasi/penutupan!
      const newNews = {
        id: 'news-gerai-hapus-' + Math.random().toString(36).substr(2, 9),
        title: `Restrukturisasi Usaha: Penutupan/Peralihan Gerai ${proposal.name}`,
        content: `Setelah melalui proses evaluasi komprehensif atas kinerja operasional dan atas recommendation tertulis dari Wakil Ketua Bidang Usaha yang telah disetujui sah oleh Ketua Koperasi, diumumkan restrukturisasi unit usaha koperasional berikut:\n\nUnit Usaha: ${proposal.name}\nLokasi: ${proposal.location}\nAlasan/Evaluasi: "${proposal.description}"\n\nManajemen Koperasi mengonfirmasi bahwa seluruh inventaris, sisa stok, dan pos keuangan dari unit usaha ini akan dialihkan dan dikonsolidasikan ke gerai utama koperasi guna efisiensi biaya operasional dan optimalisasi dividen/SHU anggota. Terima kasih kepada seluruh pelanggan setia atas dukungannya selama ini.`,
        photo: proposal.photoUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=600',
        date: new Date().toISOString().split('T')[0],
        shares: 0,
        likes: 0
      };
      updatedNewsList = [newNews, ...newsList];
      logDescription = `Ketua Koperasi (${currentUser.name} - NIK: ${currentUser.nik}) menyetujui & memvalidasi penutupan gerai "${proposal.name}" (ID Gerai: ${proposal.geraiId}) untuk restrukturisasi usaha. Usulan diajukan oleh Wakil Ketua Bidang Usaha (${proposal.submittedByName} - NIK: ${proposal.submittedByNik}) dengan alasan: "${proposal.description}".`;
    }

    // 5. Add to activity log
    const newLog = {
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userNik: currentUser.nik,
      userName: currentUser.name,
      userRole: currentUser.role,
      category: 'progja' as const,
      action: proposalType === 'BARU' ? 'Validasi Gerai Baru' : proposalType === 'EDIT' ? 'Validasi Edit Gerai' : 'Validasi Hapus Gerai',
      description: logDescription
    };

    onUpdateState({
      geraiList: updatedGeraiList,
      progjaList: updatedProgjas,
      newsList: updatedNewsList,
      activityLogs: [newLog, ...activityLogs]
    });

    const successMsg = proposalType === 'BARU'
      ? `Berhasil memvalidasi gerai "${proposal.name}". Program kerja terpublikasi dan berita dirilis!`
      : proposalType === 'EDIT'
      ? `Berhasil memvalidasi pembaruan gerai "${proposal.name}". Data terupdate dan berita rilis!`
      : `Berhasil memvalidasi penutupan gerai "${proposal.name}". Gerai dinonaktifkan dan restrukturisasi dipublikasikan!`;

    onAddNotification(successMsg, 'success');
  };

  // Reject Gerai proposal (Ketua / Admin Master)
  const handleRejectGeraiProposal = (proposalId: string) => {
    const proposal = pendingGeraiList.find(g => g.id === proposalId);
    if (!proposal) return;

    // Update status in pendingGeraiList to 'DITOLAK'
    const updatedPending = pendingGeraiList.map(g => {
      if (g.id === proposalId) {
        return { ...g, status: 'DITOLAK' };
      }
      return g;
    });
    setPendingGeraiList(updatedPending);
    localStorage.setItem('koperasi_pending_gerai', JSON.stringify(updatedPending));

    const proposalType = proposal.type || 'BARU';
    let updatedProgjas = [...progjaList];

    if (proposalType === 'BARU') {
      // Update the corresponding Program Kerja to 'REVISI'
      updatedProgjas = progjaList.map(p => {
        if (p.title.includes(proposal.name) && p.picNik === proposal.submittedByNik) {
          return { ...p, status: 'REVISI' as const, notesFromKetua: 'Proposal gerai ditolak oleh Ketua. Harap revisi anggaran atau detail lokasi.' };
        }
        return p;
      });
    }

    // Add to activity log
    const rejectTypeLabel = proposalType === 'BARU' ? 'pembangunan gerai baru' : proposalType === 'EDIT' ? 'perubahan data gerai' : 'penutupan gerai';
    const newLog = {
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userNik: currentUser.nik,
      userName: currentUser.name,
      userRole: currentUser.role,
      category: 'progja' as const,
      action: proposalType === 'BARU' ? 'Penolakan Gerai Baru' : proposalType === 'EDIT' ? 'Penolakan Edit Gerai' : 'Penolakan Hapus Gerai',
      description: `Ketua Koperasi (${currentUser.name} - NIK: ${currentUser.nik}) menolak pengajuan ${rejectTypeLabel} untuk "${proposal.name}" yang diajukan oleh Wakil Ketua Bidang Usaha (${proposal.submittedByName} - NIK: ${proposal.submittedByNik}).`
    };

    onUpdateState({
      progjaList: updatedProgjas,
      activityLogs: [newLog, ...activityLogs]
    });

    onAddNotification(`Pengajuan ${proposalType.toLowerCase()} gerai "${proposal.name}" ditolak oleh Ketua.`, 'warning');
  };

  // Mock File Drag-and-Drop / Upload
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      addMockFile(files[0].name, files[0].size);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addMockFile(files[0].name, files[0].size);
    }
  };

  const addMockFile = (name: string, sizeInBytes: number) => {
    const sizeStr = sizeInBytes > 1024 * 1024 
      ? (sizeInBytes / (1024 * 1024)).toFixed(1) + ' MB'
      : (sizeInBytes / 1024).toFixed(0) + ' KB';

    const newFile = {
      name,
      size: sizeStr,
      category: 'Dokumen Unggahan',
      date: new Date().toISOString().split('T')[0],
    };

    onUpdateState({
      filesList: [newFile, ...filesList],
    });
    onAddNotification(`File "${name}" berhasil diunggah ke server koperasi.`, 'success');
  };

  // Custom H-5 alert warning settings save
  const handleSaveAlertSettings = () => {
    onUpdateState({
      systemSettings: {
        alertDaysBefore: customAlertDays,
      },
    });
    onAddNotification(`Aturan prapelaksanaan berhasil diubah menjadi H-${customAlertDays} hari.`, 'success');
  };

  // Add a new NIK to the registry allowed to activate/register
  const handleAddNikRegistry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNik || !newNikName) {
      alert('Mohon lengkapi NIK dan Nama pengurus.');
      return;
    }
    const exists = usersBase.some(u => u.nik === newNik);
    if (exists) {
      alert('NIK ini sudah terdaftar dalam sistem.');
      return;
    }

    const newUserRegistry: UserType = {
      nik: newNik,
      name: newNikName,
      role: newNikRole,
      isRegistered: false,
      photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
    };

    const updatedUsers = [...usersBase, newUserRegistry];
    
    // Also automatically add to OrgMembers so they can show up in the structure/members tab!
    const newMember: OrgMember = {
      id: 'm-' + Math.random().toString(36).substr(2, 9),
      nik: newNik,
      name: newNikName,
      role: newNikRole,
      phone: '-',
      photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
    };

    onUpdateState({
      usersBase: updatedUsers,
      orgMembers: [...orgMembers, newMember],
    });

    onAddNotification(`NIK ${newNik} (${newNikName}) berhasil ditambahkan ke daftar izin registrasi.`, 'success');
    setNewNik('');
    setNewNikName('');
    setShowAddNikForm(false);
  };

  // Revoke / delete NIK authorization
  const handleDeleteNikRegistry = (nikToDelete: string) => {
    if (nikToDelete === 'admin_master_001' || nikToDelete === currentUser.nik) {
      alert('Anda tidak bisa menghapus akun admin master aktif.');
      return;
    }
    const updatedUsers = usersBase.filter(u => u.nik !== nikToDelete);
    const updatedMembers = orgMembers.filter(m => m.nik !== nikToDelete);
    onUpdateState({
      usersBase: updatedUsers,
      orgMembers: updatedMembers,
    });
    onAddNotification(`Akses NIK ${nikToDelete} berhasil dihapus dari sistem.`, 'info');
  };

  // -----------------------------------------------------
  // RENDER SECTIONS
  // -----------------------------------------------------

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      {/* Top Header bar with user profile */}
      <div className="bg-white border border-slate-200/85 p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm mb-6 text-left">
        <div className="flex items-center gap-3">
          <img
            src={currentUser.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}
            alt="Foto Profil"
            className="w-12 h-12 rounded-2xl object-cover border-2 border-indigo-100"
          />
          <div>
            <h2 className="text-base font-bold text-slate-900">{currentUser.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                Role: {currentUser.role.replace(/_/g, ' ')}
              </span>
              <span className="text-[10px] font-mono text-slate-400">NIK: {currentUser.nik}</span>
            </div>
          </div>
        </div>

        {/* Global Save and Logout actions */}
        <div className="flex items-center gap-2">
          {/* Notification Bell Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
              className="relative p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-xl transition-all cursor-pointer border border-slate-200/80 flex items-center justify-center focus:outline-hidden"
              title="Pusat Notifikasi & Peringatan"
            >
              <Bell className="w-4 h-4" />
              {unreadAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white animate-pulse">
                  {unreadAlerts.length}
                </span>
              )}
            </button>

            {/* Click away backdrop to close dropdown */}
            {showNotificationsDropdown && (
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowNotificationsDropdown(false)} 
              />
            )}

            {/* Dropdown panel */}
            <AnimatePresence>
              {showNotificationsDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden text-xs"
                >
                  <div className="p-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">Pusat Notifikasi</h4>
                      <p className="text-[10px] text-slate-400 font-medium">Ada {unreadAlerts.length} peringatan aktif</p>
                    </div>
                    {unreadAlerts.length > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        Tandai Semua Dibaca
                      </button>
                    )}
                  </div>

                  {/* Filter Kontrol */}
                  <div className="p-2.5 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-bold uppercase tracking-wider shrink-0">Kategori:</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setNotifCategoryFilter('semua')}
                          className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                            notifCategoryFilter === 'semua'
                              ? 'bg-slate-900 text-white'
                              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Semua ({alerts.length})
                        </button>
                        <button
                          onClick={() => setNotifCategoryFilter('penting')}
                          className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                            notifCategoryFilter === 'penting'
                              ? 'bg-red-600 text-white'
                              : 'bg-white text-red-600 border border-red-100 hover:bg-red-50'
                          }`}
                        >
                          Penting ({alerts.filter(a => a.importance === 'penting').length})
                        </button>
                        <button
                          onClick={() => setNotifCategoryFilter('umum')}
                          className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                            notifCategoryFilter === 'umum'
                              ? 'bg-sky-600 text-white'
                              : 'bg-white text-sky-600 border border-sky-100 hover:bg-sky-50'
                          }`}
                        >
                          Umum ({alerts.filter(a => a.importance === 'umum').length})
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-bold uppercase tracking-wider shrink-0">Status:</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setNotifStatusFilter('belum_dibaca')}
                          className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                            notifStatusFilter === 'belum_dibaca'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Belum Dibaca ({alerts.filter(a => !readAlertIds.includes(a.id)).length})
                        </button>
                        <button
                          onClick={() => setNotifStatusFilter('sudah_dibaca')}
                          className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                            notifStatusFilter === 'sudah_dibaca'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Sudah Dibaca ({alerts.filter(a => readAlertIds.includes(a.id)).length})
                        </button>
                        <button
                          onClick={() => setNotifStatusFilter('semua')}
                          className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                            notifStatusFilter === 'semua'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Semua
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {filteredAlerts.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 space-y-2">
                        <Bell className="w-8 h-8 mx-auto text-slate-200" />
                        <p className="font-medium text-[11px]">Tidak ada peringatan atau pesan</p>
                        <p className="text-[10px] text-slate-400">Tidak ada notifikasi yang cocok dengan filter yang Anda pilih.</p>
                      </div>
                    ) : (
                      filteredAlerts.map((alert) => {
                        const isRead = readAlertIds.includes(alert.id);
                        let iconBg = 'bg-slate-100 text-slate-600';
                        if (alert.type === 'warning') iconBg = 'bg-amber-50 text-amber-700 border border-amber-100';
                        if (alert.type === 'danger') iconBg = 'bg-rose-50 text-rose-700 border border-rose-100';
                        if (alert.type === 'info') iconBg = 'bg-sky-50 text-sky-700 border border-sky-100';
                        if (alert.type === 'success') iconBg = 'bg-emerald-50 text-emerald-700 border border-emerald-100';

                        return (
                          <div 
                            key={alert.id}
                            className={`p-3 hover:bg-slate-50/80 transition-colors flex gap-2.5 items-start text-left cursor-pointer group ${isRead ? 'opacity-65' : ''}`}
                            onClick={() => {
                              if (alert.targetMenu) {
                                setActiveMenu(alert.targetMenu);
                              }
                              if (!isRead) {
                                handleMarkAsRead(alert.id);
                              }
                              setShowNotificationsDropdown(false);
                              onAddNotification(`Membuka menu ${alert.category}`, 'info');
                            }}
                          >
                            <div className={`p-1.5 rounded-lg shrink-0 ${iconBg} mt-0.5`}>
                              <Bell className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 space-y-0.5 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className={`font-bold text-slate-900 truncate ${isRead ? 'line-through text-slate-400' : ''}`}>{alert.title}</span>
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className={`text-[8px] font-mono font-black uppercase px-1.5 py-0.5 rounded shrink-0 ${
                                    alert.importance === 'penting'
                                      ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                      : 'bg-sky-50 text-sky-600 border border-sky-100'
                                  }`}>
                                    {alert.importance}
                                  </span>
                                  <span className="text-[8px] font-mono font-bold uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                                    {alert.category}
                                  </span>
                                </div>
                              </div>
                              <p className="text-slate-600 leading-relaxed text-[11px] break-words">
                                {alert.description}
                              </p>
                              <div className="flex items-center justify-between pt-1">
                                <span className="text-[9px] text-slate-400 font-medium">{alert.time}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleMarkRead(alert.id);
                                  }}
                                  className={`text-[9px] font-bold border px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                                    isRead
                                      ? 'text-slate-500 border-slate-200 bg-white hover:bg-slate-50'
                                      : 'text-indigo-600 border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 hover:text-indigo-700'
                                  }`}
                                >
                                  {isRead ? 'Tandai Belum Dibaca' : 'Tandai Dibaca'}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="p-2 border-t border-slate-100 bg-slate-50/50 text-center text-[10px] text-slate-400 font-medium">
                    Peringatan dinamis untuk role {currentUser.role.replace(/_/g, ' ')}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => {
              onAddNotification('Semua data perubahan berhasil disimpan ke memori penyimpanan lokal!', 'success');
            }}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
          >
            <Save className="w-4 h-4" />
            Save State
          </button>
          <button
            onClick={onLogout}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Keluar (Log Out)
          </button>
        </div>
      </div>

      {/* Main Grid Layout with sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SIDEBAR TABS (3 cols) */}
        <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-3xl p-4 shadow-2xs space-y-2 text-left">
          <div className="px-3 py-2 border-b border-slate-100 mb-2">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Navigasi Utama</h4>
          </div>
          {allowedMenus.map((menu) => {
            const isActive = activeMenu === menu.key;
            return (
              <button
                key={menu.key}
                onClick={() => setActiveMenu(menu.key)}
                className={`w-full relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-600 hover:bg-slate-50/70 hover:text-slate-900'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="activeMenuPill"
                    className="absolute inset-0 bg-red-600 rounded-xl -z-10 shadow-xs"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="flex items-center gap-2.5 relative z-10">
                  {menu.icon}
                  {menu.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* CONTENT STAGE (9 cols) */}
        <div className="lg:col-span-9 bg-slate-50/30 rounded-3xl min-h-[600px] border border-slate-100/50 p-1">
          <AnimatePresence mode="wait">
            {/* 1. DASHBOARD OVERVIEW */}
            {activeMenu === 'dashboard_pengurus' && (
              <motion.div
                key="dashboard_pengurus"
                initial={{ opacity: 0, y: 15, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.985 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6 text-left"
              >
                {/* Stats Panel */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-3xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Program Kerja</span>
                    <span className="text-2xl font-black text-slate-900 block mt-1">{progjaList.length}</span>
                    <p className="text-[10px] text-slate-500 mt-2">Seluruh usulan pengurus</p>
                  </div>

                  <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-3xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Progja Terpublish</span>
                    <span className="text-2xl font-black text-teal-600 block mt-1">
                      {progjaList.filter(p => p.status === 'DIPUBLIKASIKAN').length}
                    </span>
                    <p className="text-[10px] text-teal-600 font-semibold mt-2">Berhasil divalidasi publik</p>
                  </div>

                  <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-3xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rasio Keberhasilan</span>
                    <span className="text-2xl font-black text-indigo-600 block mt-1">
                      {progjaList.length > 0 
                        ? Math.round((progjaList.filter(p => p.status === 'DIPUBLIKASIKAN').length / progjaList.length) * 100)
                        : 0}%
                    </span>
                    <p className="text-[10px] text-slate-500 mt-2">Berdasarkan total draf disetujui</p>
                  </div>
                </div>

                {/* 🔔 Papan Pusat Notifikasi & Tindakan Pengurus */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                          {unreadAlerts.length > 0 && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          )}
                          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${unreadAlerts.length > 0 ? 'bg-rose-500' : 'bg-slate-300'}`}></span>
                        </span>
                        Pusat Notifikasi & Tindakan Pengurus
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Kelola peringatan penting dan informasi umum yang disesuaikan khusus untuk jabatan Anda ({currentUser.role.replace(/_/g, ' ')}).
                      </p>
                    </div>

                    {unreadAlerts.length > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-200/50 cursor-pointer transition-all self-start sm:self-center shrink-0 flex items-center gap-1.5"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Tandai Semua Dibaca
                      </button>
                    )}
                  </div>

                  {/* Filter Kontrol Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                    {/* Filter Kategori */}
                    <div className="space-y-2 text-left">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kategori Kepentingan:</span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setNotifCategoryFilter('semua')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            notifCategoryFilter === 'semua'
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Semua Notifikasi
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${notifCategoryFilter === 'semua' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            {alerts.length}
                          </span>
                        </button>

                        <button
                          onClick={() => setNotifCategoryFilter('penting')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            notifCategoryFilter === 'penting'
                              ? 'bg-red-600 text-white shadow-xs'
                              : 'bg-white text-red-600 border border-red-200/40 hover:bg-red-50'
                          }`}
                        >
                          ⚠️ Penting
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${notifCategoryFilter === 'penting' ? 'bg-white/20 text-white' : 'bg-red-50 text-red-600'}`}>
                            {alerts.filter(a => a.importance === 'penting').length}
                          </span>
                        </button>

                        <button
                          onClick={() => setNotifCategoryFilter('umum')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            notifCategoryFilter === 'umum'
                              ? 'bg-sky-600 text-white shadow-xs'
                              : 'bg-white text-sky-600 border border-sky-200/40 hover:bg-sky-50'
                          }`}
                        >
                          ℹ️ Informasi Umum
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${notifCategoryFilter === 'umum' ? 'bg-white/20 text-white' : 'bg-sky-50 text-sky-600'}`}>
                            {alerts.filter(a => a.importance === 'umum').length}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Filter Status Baca */}
                    <div className="space-y-2 text-left">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status Keterbacaan:</span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setNotifStatusFilter('belum_dibaca')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            notifStatusFilter === 'belum_dibaca'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Belum Dibaca
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${notifStatusFilter === 'belum_dibaca' ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                            {alerts.filter(a => !readAlertIds.includes(a.id)).length}
                          </span>
                        </button>

                        <button
                          onClick={() => setNotifStatusFilter('sudah_dibaca')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            notifStatusFilter === 'sudah_dibaca'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Sudah Dibaca
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${notifStatusFilter === 'sudah_dibaca' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            {alerts.filter(a => readAlertIds.includes(a.id)).length}
                          </span>
                        </button>

                        <button
                          onClick={() => setNotifStatusFilter('semua')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            notifStatusFilter === 'semua'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Tampilkan Semua
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* List of Filtered Alerts */}
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {filteredAlerts.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl space-y-2">
                        <BellOff className="w-10 h-10 mx-auto text-slate-200" />
                        <p className="font-bold text-xs text-slate-700">Tidak ada notifikasi ditemukan</p>
                        <p className="text-[11px] text-slate-400">Ganti pilihan filter kategori atau status keterbacaan di atas.</p>
                      </div>
                    ) : (
                      filteredAlerts.map((alert) => {
                        const isRead = readAlertIds.includes(alert.id);
                        
                        let iconBg = 'bg-slate-100 text-slate-600';
                        let icon = <Bell className="w-4 h-4" />;
                        
                        if (alert.type === 'warning') {
                          iconBg = 'bg-amber-50 text-amber-700 border border-amber-200/50';
                          icon = <AlertTriangle className="w-4 h-4" />;
                        } else if (alert.type === 'danger') {
                          iconBg = 'bg-rose-50 text-rose-700 border border-rose-200/50';
                          icon = <AlertOctagon className="w-4 h-4" />;
                        } else if (alert.type === 'info') {
                          iconBg = 'bg-sky-50 text-sky-700 border border-sky-200/50';
                          icon = <Info className="w-4 h-4" />;
                        } else if (alert.type === 'success') {
                          iconBg = 'bg-emerald-50 text-emerald-700 border border-emerald-200/50';
                          icon = <CheckCircle2 className="w-4 h-4" />;
                        }

                        return (
                          <div
                            key={`list-notif-${alert.id}`}
                            className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                              isRead 
                                ? 'bg-slate-50/60 border-slate-200 opacity-60' 
                                : 'bg-white border-slate-200 hover:border-slate-300 shadow-3xs'
                            }`}
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div className={`p-2 rounded-xl shrink-0 ${iconBg} mt-0.5`}>
                                {icon}
                              </div>
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`font-bold text-slate-900 text-xs ${isRead ? 'line-through text-slate-400 font-medium' : ''}`}>
                                    {alert.title}
                                  </span>
                                  <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded ${
                                    alert.importance === 'penting'
                                      ? 'bg-red-50 text-red-600 border border-red-100'
                                      : 'bg-sky-50 text-sky-600 border border-sky-100'
                                  }`}>
                                    {alert.importance}
                                  </span>
                                  <span className="text-[9px] font-mono font-bold uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {alert.category}
                                  </span>
                                </div>
                                <p className="text-slate-600 text-xs leading-relaxed max-w-xl break-words">
                                  {alert.description}
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono">
                                  Waktu: {alert.time}
                                </p>
                              </div>
                            </div>

                            {/* Actions area inside card */}
                            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                              {alert.targetMenu && (
                                <button
                                  onClick={() => {
                                    setActiveMenu(alert.targetMenu!);
                                    if (!isRead) {
                                      handleMarkAsRead(alert.id);
                                    }
                                    onAddNotification(`Beralih ke menu ${alert.category}`, 'info');
                                  }}
                                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
                                >
                                  Buka Menu
                                </button>
                              )}
                              
                              <button
                                onClick={() => handleToggleMarkRead(alert.id)}
                                className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg border cursor-pointer transition-all ${
                                  isRead
                                    ? 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                                    : 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100'
                                }`}
                              >
                                {isRead ? 'Tandai Belum Dibaca' : 'Tandai Selesai Dibaca'}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Tren Penyelesaian Program Kerja per Bulan (Bar Chart) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-emerald-600" />
                        Tren Penyelesaian Program Kerja per Bulan
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Perbandingan program kerja yang dicanangkan (total) dengan yang telah diselesaikan & dipublikasikan.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl self-start sm:self-center">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-xs bg-indigo-500 block" />
                        <span className="text-slate-600">Total Program</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 block" />
                        <span className="text-slate-600">Selesai (Dipublikasi)</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-64 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
                        barGap={6}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                          allowDecimals={false}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-md space-y-1.5 text-left text-[11px]">
                                  <p className="font-bold text-slate-800 border-b border-slate-100 pb-1">{label}</p>
                                  {payload.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-4 justify-between font-medium">
                                      <span className="flex items-center gap-1.5 text-slate-500">
                                        <span
                                          className="w-2 h-2 rounded-full block"
                                          style={{ backgroundColor: item.color }}
                                        />
                                        {item.name}:
                                      </span>
                                      <span className="font-bold text-slate-800">{item.value} Progja</span>
                                    </div>
                                  ))}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar
                          dataKey="Total Program"
                          fill="#6366f1"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={32}
                        />
                        <Bar
                          dataKey="Selesai"
                          fill="#10b981"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={32}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-center border-t border-slate-100 text-xs">
                    <div className="p-2.5 bg-slate-50/60 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Aktif</span>
                      <span className="text-sm font-black text-slate-800 block mt-0.5">
                        {progjaList.filter(p => p.status !== 'DIPUBLIKASIKAN' && p.status !== 'DRAFT').length} Progja
                      </span>
                    </div>
                    <div className="p-2.5 bg-emerald-50/30 rounded-xl border border-emerald-100/50">
                      <span className="text-[10px] text-emerald-600 font-bold uppercase block">Berhasil Selesai</span>
                      <span className="text-sm font-black text-emerald-700 block mt-0.5">
                        {progjaList.filter(p => p.status === 'DIPUBLIKASIKAN').length} Progja
                      </span>
                    </div>
                    <div className="p-2.5 bg-amber-50/30 rounded-xl border border-amber-100/50">
                      <span className="text-[10px] text-amber-600 font-bold uppercase block">Menunggu Review</span>
                      <span className="text-sm font-black text-amber-700 block mt-0.5">
                        {progjaList.filter(p => p.status === 'DIAJUKAN').length} Progja
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-50/60 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Tingkat Penyelesaian</span>
                      <span className="text-sm font-black text-indigo-700 block mt-0.5">
                        {progjaList.length > 0
                          ? Math.round((progjaList.filter(p => p.status === 'DIPUBLIKASIKAN').length / progjaList.length) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Presentation Review Grid for Ketua */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Review Progres Pencapaian Pengurus (Presentasi Ketua)</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">Metrik peninjauan langsung persentase progres yang dipersiapkan untuk rapat pleno.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {orgMembers.map(member => {
                      const memberProgjas = progjaList.filter((p) => p.picNik === member.nik);
                      const total = memberProgjas.length;
                      const completed = memberProgjas.filter((p) => p.status === 'DIPUBLIKASIKAN').length;
                      const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;
                      return (
                        <div key={member.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img src={member.photoUrl} alt={member.name} className="w-10 h-10 rounded-lg object-cover" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{member.name}</p>
                              <p className="text-[10px] text-slate-400 capitalize">{member.role.replace(/_/g, ' ')}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 shrink-0">
                            <div className="text-right">
                              <p className="text-xs font-bold text-indigo-600">{successRate}% Berhasil</p>
                              <p className="text-[9px] text-slate-400 font-mono">{completed} Selesai / {total} Progja</p>
                            </div>
                            <div className="w-20 bg-slate-200 rounded-full h-2">
                              <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${successRate}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Visual Organizational Structure displayed internally */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                    <Users2 className="w-5 h-5 text-indigo-500" />
                    Struktur Organisasi Koperasi Merah Putih
                  </h3>

                  <div className="flex flex-col items-center justify-center space-y-6 pt-2">
                    {/* Level 1: Pengawas & Ketua */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
                      {orgMembers.filter(m => m.role === 'pengawas' || m.role === 'ketua').map(m => (
                        <div key={m.id} className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl text-center shadow-3xs">
                          <img src={m.photoUrl} alt={m.name} className="w-12 h-12 rounded-full object-cover mx-auto border-2 border-indigo-100" />
                          <h4 className="text-xs font-bold text-slate-900 mt-2">{m.name}</h4>
                          <p className="text-[10px] font-mono font-extrabold uppercase text-indigo-700 tracking-wider mt-0.5">
                            {m.role.toUpperCase()}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Level 2: Sekretaris & Bendahara */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
                      {orgMembers.filter(m => m.role === 'sekretaris' || m.role === 'bendahara').map(m => (
                        <div key={m.id} className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-center shadow-3xs">
                          <img src={m.photoUrl} alt={m.name} className="w-10 h-10 rounded-full object-cover mx-auto border border-emerald-100" />
                          <h4 className="text-xs font-bold text-slate-900 mt-2">{m.name}</h4>
                          <p className="text-[10px] font-mono font-bold uppercase text-emerald-700 tracking-wider mt-0.5">
                            {m.role.replace(/_/g, ' ').toUpperCase()}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Level 3: Wakil Ketua Usaha & Anggota */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
                      {orgMembers.filter(m => m.role.startsWith('wakil')).map(m => (
                        <div key={m.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center shadow-3xs">
                          <img src={m.photoUrl} alt={m.name} className="w-10 h-10 rounded-full object-cover mx-auto border border-slate-200" />
                          <h4 className="text-xs font-bold text-slate-900 mt-2">{m.name}</h4>
                          <p className="text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider mt-0.5">
                            {m.role.replace(/_/g, ' ').toUpperCase()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Admin master custom modification setting block */}
                {currentUser.role === 'admin_master' && (
                  <div className="p-5 bg-linear-to-r from-slate-900 to-indigo-950 rounded-2xl text-white space-y-4 shadow-sm border border-slate-800">
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-blue-300">Setelan Admin Master (Pemberitahuan Kinerja)</h4>
                    <p className="text-xs text-slate-300">Ubah jumlah hari pengingat (alert otomatis) prapelaksanaan Program Kerja pengurus di portal depan publik.</p>
                    
                    <div className="flex items-center gap-3">
                      <div className="relative w-32">
                        <input
                          type="number"
                          value={customAlertDays}
                          onChange={(e) => setCustomAlertDays(parseInt(e.target.value) || 0)}
                          className="w-full p-2.5 bg-white/10 text-white rounded-xl text-xs border border-white/20 focus:ring-1 focus:ring-blue-500 outline-hidden pl-4 pr-10"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">Hari</span>
                      </div>
                      <button
                        onClick={handleSaveAlertSettings}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Terapkan Konfigurasi
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* 2.5 VOTING PENGURUS EMBED */}
            {activeMenu === 'voting' && (
              <motion.div
                key="voting"
                initial={{ opacity: 0, y: 15, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.985 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                <VotingPengurusView
                  currentUser={currentUser}
                  votingList={votingList}
                  progjaList={progjaList}
                  orgMembers={orgMembers}
                  onUpdateState={onUpdateState}
                  onAddNotification={onAddNotification}
                  initialSelectedVotingId={autoSelectVotingId}
                  onClearInitialSelectedVotingId={onClearAutoSelect}
                />
              </motion.div>
            )}

            {/* 2. SIRKULASI PROGJA EMBED */}
            {activeMenu === 'sirkulasi_prokja' && (
              <motion.div
                key="sirkulasi_prokja"
                initial={{ opacity: 0, y: 15, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.985 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                <SirkulasiProgja
                  progjaList={progjaList}
                  currentUser={currentUser}
                  rolesList={rolesList}
                  orgMembers={orgMembers}
                  onSaveProgja={(updated) => {
                    const exists = progjaList.some(p => p.id === updated.id);
                    let newList;
                    let logAction = 'Tambah Progja';
                    let logDesc = `Membuat Program Kerja baru: "${updated.title}" dengan penanggung jawab ${updated.picName} (${updated.picRole.replace(/_/g, ' ')}) dan anggaran Rp ${updated.budget.toLocaleString('id-ID')}.`;
                    
                    if (exists) {
                      const old = progjaList.find(p => p.id === updated.id);
                      logAction = 'Ubah Progja';
                      logDesc = `Memperbarui data Program Kerja: "${updated.title}" (Status: ${updated.status}).`;
                      if (old && old.status !== updated.status) {
                        logAction = 'Status Progja';
                        logDesc = `Mengubah status Program Kerja "${updated.title}" dari ${old.status} menjadi ${updated.status}.`;
                      }
                      newList = progjaList.map(p => p.id === updated.id ? updated : p);
                    } else {
                      newList = [updated, ...progjaList];
                    }

                    const newLog = createActivityLogEntry('progja', logAction, logDesc);

                    onUpdateState({
                      progjaList: newList,
                      activityLogs: [newLog, ...activityLogs],
                    });
                  }}
                  onDeleteProgja={(id) => {
                    const target = progjaList.find(p => p.id === id);
                    const title = target ? target.title : id;
                    const logDesc = `Menghapus Program Kerja: "${title}".`;
                    const newLog = createActivityLogEntry('progja', 'Hapus Progja', logDesc);

                    onUpdateState({
                      progjaList: progjaList.filter(p => p.id !== id),
                      activityLogs: [newLog, ...activityLogs],
                    });
                  }}
                  onAddNotification={onAddNotification}
                  initialSelectedProgjaId={autoSelectProgjaId}
                  onClearInitialSelectedProgjaId={onClearAutoSelect}
                />
              </motion.div>
            )}

            {/* 3. KEUANGAN KOPERASI */}
            {activeMenu === 'keuangan' && (
              <motion.div
                key="keuangan"
                initial={{ opacity: 0, y: 15, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.985 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6 text-left"
              >
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Manajemen Keuangan Koperasi</h2>
                    <p className="text-xs text-slate-500 mt-1">Pantau sisa kas total, Sisa Hasil Usaha, dan catat riwayat pengeluaran/pemasukan.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleDownloadKeuanganPDF}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                      title="Unduh Laporan Ringkasan Keuangan PDF"
                    >
                      <Download className="w-4 h-4" />
                      Unduh PDF Keuangan
                    </button>
                    <button
                      onClick={() => setShowAddTransaction(!showAddTransaction)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Input Transaksi Baru
                    </button>
                  </div>
                </div>

                {/* Financial Summary Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-linear-to-b from-emerald-50 to-white border border-emerald-200 rounded-2xl p-5 shadow-2xs">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Sisa Kas Total Koperasi</span>
                    <span className="text-3xl font-black text-emerald-700 mt-1 block">Rp {keuangan.totalCash.toLocaleString('id-ID')}</span>
                    <p className="text-[10px] text-emerald-600 font-medium mt-2">Likuiditas kas terverifikasi oleh Bendahara</p>
                  </div>

                  <div className="bg-linear-to-b from-blue-50 to-white border border-blue-200 rounded-2xl p-5 shadow-2xs">
                    <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">Sisa Hasil Usaha (SHU)</span>
                    <span className="text-3xl font-black text-blue-700 mt-1 block">Rp {keuangan.totalSHU.toLocaleString('id-ID')}</span>
                    <p className="text-[10px] text-blue-600 font-medium mt-2">Net profit bersih terdistribusi</p>
                  </div>
                </div>

                {/* Monthly Financial Visualization */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 font-display flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-indigo-600" />
                        Visualisasi Arus Kas Bulanan (Pemasukan vs Pengeluaran)
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Laporan perbandingan kas masuk (pemasukan) dan kas keluar (pengeluaran) koperasi untuk memantau tren likuiditas.
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl self-start sm:self-center">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 block" />
                        <span className="text-slate-600">Pemasukan (Kas Masuk)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 block" />
                        <span className="text-slate-600">Pengeluaran (Kas Keluar)</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-64 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={keuanganChartData}
                        margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
                        barGap={6}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ 
                            fill: '#64748b', 
                            fontSize: 10, 
                            fontWeight: 500,
                            formatter: (value: number) => {
                              if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(1)}jt`;
                              if (value >= 1000) return `Rp ${(value / 1000).toFixed(0)}rb`;
                              return `Rp ${value}`;
                            }
                          }}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-md space-y-1.5 text-left text-[11px]">
                                  <p className="font-bold text-slate-800 border-b border-slate-100 pb-1">{label}</p>
                                  {payload.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-4 justify-between font-medium">
                                      <span className="flex items-center gap-1.5 text-slate-500">
                                        <span
                                          className="w-2 h-2 rounded-full block"
                                          style={{ backgroundColor: item.color }}
                                        />
                                        {item.name}:
                                      </span>
                                      <span className="font-black text-slate-800">
                                        Rp {Number(item.value).toLocaleString('id-ID')}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar
                          dataKey="Pemasukan (Kas Masuk)"
                          fill="#10b981"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={32}
                        />
                        <Bar
                          dataKey="Pengeluaran (Kas Keluar)"
                          fill="#f43f5e"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={32}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Add transaction form panel */}
                {showAddTransaction && (
                  <form onSubmit={handleAddTransaction} className="p-5 bg-white border border-slate-200 rounded-2xl space-y-4">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {editingTxId ? 'Form Pembaruan Transaksi Keuangan' : 'Form Penginputan Transaksi Keuangan'}
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Jenis Transaksi</label>
                        <select
                          value={txType}
                          onChange={(e) => setTxType(e.target.value as any)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
                        >
                          <option value="OUT">PENGELUARAN (KAS KELUAR)</option>
                          <option value="IN">PEMASUKAN (KAS MASUK)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Kategori</label>
                        <select
                          value={txCategory}
                          onChange={(e) => setTxCategory(e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
                        >
                          <option value="Operasional Kantor">Operasional Kantor</option>
                          <option value="Peralatan Kantor">Peralatan Kantor</option>
                          <option value="Pembelian Inventaris Retail">Pembelian Inventaris Retail</option>
                          <option value="Simpanan Wajib">Simpanan Wajib</option>
                          <option value="Simpanan Pokok">Simpanan Pokok</option>
                          <option value="Penyaluran Kredit">Penyaluran Kredit</option>
                          <option value="Hasil Usaha Gerai">Hasil Usaha Gerai</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Jumlah Anggaran (Rupiah)</label>
                        <input
                          type="number"
                          value={txAmount}
                          onChange={(e) => setTxAmount(e.target.value)}
                          placeholder="Rp..."
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Deskripsi Ringkas</label>
                        <input
                          type="text"
                          value={txDescription}
                          onChange={(e) => setTxDescription(e.target.value)}
                          placeholder="Membeli printer, kertas, dll..."
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddTransaction(false);
                          setEditingTxId(null);
                          setTxAmount('');
                          setTxDescription('');
                        }}
                        className="px-3.5 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        {editingTxId ? 'Simpan Pembaruan' : 'Simpan Transaksi'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Ledger transaction history list */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Histori Aliran Kas (Ledger Transaksi)</h3>
                  
                  <div className="space-y-3">
                    {keuangan.transactions.map((tx) => (
                      <div key={tx.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-4">
                        <div className="text-left space-y-0.5">
                          <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold ${tx.type === 'IN' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                            {tx.type === 'IN' ? 'KAS MASUK' : 'KAS KELUAR'}
                          </span>
                          <p className="text-xs font-bold text-slate-800 mt-1">{tx.description}</p>
                          <p className="text-[10px] text-slate-400">Penginput: {tx.requester} • {tx.date}</p>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <div className="text-right">
                            <span className={`text-xs font-extrabold ${tx.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {tx.type === 'IN' ? '+' : '-'} Rp {tx.amount.toLocaleString('id-ID')}
                            </span>
                            <p className="text-[10px] text-slate-500 mt-0.5">{tx.category}</p>
                          </div>
                          
                          <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                            <button
                              onClick={() => handleStartEditTransaction(tx)}
                              className="p-1.5 hover:bg-blue-50 text-blue-600 hover:text-blue-700 rounded-lg transition-colors cursor-pointer"
                              title="Edit Transaksi"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTransaction(tx.id)}
                              className="p-1.5 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Transaksi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 4. ANGGOTA & STRUKTUR */}
            {activeMenu === 'anggota' && (
              <motion.div
                key="anggota"
                initial={{ opacity: 0, y: 15, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.985 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6 text-left"
              >
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <h2 className="text-base font-bold text-slate-900">Manajemen Pengurus & Struktur Organisasi</h2>
                  <p className="text-xs text-slate-500 mt-1">Input, perbarui biodata, nomor handphone, dan pantau representasi visual kepengurusan.</p>
                </div>

                {/* Edit Form Modal/Panel */}
                {selectedMemberToEdit && (
                  <div className="p-5 bg-white border-2 border-indigo-200 rounded-2xl space-y-4">
                    <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1">
                      <Edit2 className="w-3.5 h-3.5" />
                      Ubah Informasi Pengurus ({selectedMemberToEdit.role.replace(/_/g, ' ')})
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Nama Lengkap & Gelar</label>
                        <input
                          type="text"
                          value={editMemberName}
                          onChange={(e) => setEditMemberName(e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Nomor Handphone Aktif</label>
                        <input
                          type="text"
                          value={editMemberPhone}
                          onChange={(e) => setEditMemberPhone(e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedMemberToEdit(null)}
                        className="px-3.5 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveMemberEdit}
                        className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Simpan Perubahan
                      </button>
                    </div>
                  </div>
                )}

                {/* Profiles Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {orgMembers.map((member) => (
                    <div key={member.id} className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img src={member.photoUrl} alt={member.name} className="w-12 h-12 rounded-xl object-cover border" />
                        <div className="text-left min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{member.name}</p>
                          <p className="text-[10px] text-slate-500 capitalize">{member.role.replace(/_/g, ' ')}</p>
                          <p className="text-[10px] text-indigo-600 font-mono mt-1">Telp: {member.phone}</p>
                        </div>
                      </div>

                      {/* Authorized editor check */}
                      {currentUser.role === 'admin_master' || currentUser.role === 'wakil_ketua_anggota' ? (
                        <button
                          onClick={() => {
                            setSelectedMemberToEdit(member);
                            setEditMemberName(member.name);
                            setEditMemberPhone(member.phone);
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                          title="Ubah Profil"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 5. FILE DOWNLOAD */}
            {activeMenu === 'file_download' && (
              <motion.div
                key="file_download"
                initial={{ opacity: 0, y: 15, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.985 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6 text-left"
              >
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <h2 className="text-base font-bold text-slate-900 font-sans">Perpustakaan File Koperasi (Download Center)</h2>
                  <p className="text-xs text-slate-500 mt-1">Unduh draf regulasi AD/ART, form pengajuan kredit, SOP, dan berkas administrasi.</p>
                </div>

                {/* Drag-and-drop container mock */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDropFile}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                    isDragging ? 'bg-indigo-50 border-indigo-500' : 'border-slate-300 hover:bg-slate-50/50 hover:border-slate-400'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                  <UploadCloud className="w-10 h-10 mx-auto text-slate-400 mb-2 animate-bounce" />
                  <p className="text-xs font-bold text-slate-700">Drag & Drop Berkas di Sini untuk Mengunggah</p>
                  <p className="text-[10px] text-slate-400 mt-1">atau klik untuk menelusuri folder komputer Anda (Simulasi)</p>
                </div>

                {/* File list */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Arsip Berkas Siap Unduh</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filesList.map((file, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 hover:bg-slate-100/50 rounded-xl border border-slate-100 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 bg-blue-100 text-blue-800 rounded-lg shrink-0">
                            <FileText className="w-4.5 h-4.5" />
                          </div>
                          <div className="min-w-0 text-left">
                            <p className="text-xs font-bold text-slate-800 truncate">{file.name}</p>
                            <p className="text-[9px] text-slate-400 font-mono">Ukuran: {file.size} • Kategori: {file.category}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            onAddNotification(`Mengunduh file ${file.name} (Simulasi sukses)...`, 'success');
                          }}
                          className="p-1.5 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg cursor-pointer transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 6. BIODATA KOPERASI */}
            {activeMenu === 'biodata_koperasi' && (
              <motion.div
                key="biodata_koperasi"
                initial={{ opacity: 0, y: 15, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.985 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6 text-left"
              >
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Biodata & Informasi Publik Koperasi</h2>
                    <p className="text-xs text-slate-500 mt-1">Modifikasi detail alamat fisik, nama, nomor telepon, dan tautan sosial media.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] text-slate-500 uppercase font-bold">Nama Koperasi Resmi</label>
                      <input
                        type="text"
                        value={editBioName}
                        onChange={(e) => setEditBioName(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] text-slate-500 uppercase font-bold">Nomor Telepon Kantor</label>
                      <input
                        type="text"
                        value={editBioPhone}
                        onChange={(e) => setEditBioPhone(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="block text-[10px] text-slate-500 uppercase font-bold">Alamat Fisik Lengkap</label>
                      <input
                        type="text"
                        value={editBioAddress}
                        onChange={(e) => setEditBioAddress(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] text-slate-500 uppercase font-bold">Email Informasi</label>
                      <input
                        type="text"
                        value={editBioEmail}
                        onChange={(e) => setEditBioEmail(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] text-slate-500 uppercase font-bold">Link Facebook</label>
                      <input
                        type="text"
                        value={editBioFb}
                        onChange={(e) => setEditBioFb(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={handleSaveBiodata}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Perbarui Informasi Koperasi
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 7. HIMBAUAN PENGAWAS */}
            {activeMenu === 'himbauan' && (
              <motion.div
                key="himbauan"
                initial={{ opacity: 0, y: 15, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.985 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6 text-left"
              >
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Gerbang Himbauan & Instruksi Pengawas</h2>
                    <p className="text-xs text-slate-500 mt-1">Pengawas dapat memposting instruksi, audit alert, penghematan anggaran yang muncul di notif pengurus.</p>
                  </div>

                  {currentUser.role === 'pengawas' || currentUser.role === 'admin_master' ? (
                    <button
                      onClick={() => setShowAddHimbauan(!showAddHimbauan)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Buat Himbauan Baru
                    </button>
                  ) : null}
                </div>

                {/* New Himbauan form */}
                {showAddHimbauan && (
                  <form onSubmit={handleAddHimbauan} className="p-5 bg-white border border-slate-200 rounded-2xl space-y-4">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Form Penginputan Himbauan</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Isi Pesan Himbauan / Instruksi</label>
                        <textarea
                          value={himbauanContent}
                          onChange={(e) => setHimbauanContent(e.target.value)}
                          placeholder="Tulis himbauan penting di sini..."
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 outline-hidden min-h-[80px]"
                        />
                      </div>

                      <div className="w-48">
                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Tanggal Berakhir (Expired)</label>
                        <input
                          type="date"
                          value={himbauanEndDate}
                          onChange={(e) => setHimbauanEndDate(e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddHimbauan(false)}
                        className="px-3.5 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Terbitkan Himbauan
                      </button>
                    </div>
                  </form>
                )}

                {/* Himbauan list */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Daftar Himbauan Aktif</h3>
                  
                  <div className="space-y-4">
                    {himbauanList.map((h) => (
                      <div key={h.id} className="p-4 bg-amber-50/55 rounded-xl border border-amber-200 flex items-start gap-3 justify-between">
                        <div className="flex items-start gap-3 text-left">
                          <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg mt-0.5 shrink-0">
                            <AlertTriangle className="w-4 h-4 fill-amber-100" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-800 leading-relaxed font-medium">{h.content}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-2">
                              Rilis: {h.date} | Berakhir: {h.endDate} | Oleh: {h.senderName}
                            </p>
                          </div>
                        </div>

                        {(currentUser.role === 'pengawas' || currentUser.role === 'admin_master') && (
                          <button
                            onClick={() => handleDeleteHimbauan(h.id)}
                            className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-md cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 8. GERAI (RETAIL OUTLETS) */}
            {activeMenu === 'gerai' && (
              <motion.div
                key="gerai"
                initial={{ opacity: 0, y: 15, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.985 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6 text-left"
              >
                {/* Header Banner */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Store className="w-5 h-5 text-indigo-600" />
                      Pengembangan & Operasional Gerai Koperasi
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Pantau kinerja retail, sirkulasi pengajuan unit usaha baru, rencana anggaran, dan rilis berita peresmian.
                    </p>
                  </div>

                  {currentUser.role === 'wakil_ketua_usaha' && (
                    <button
                      onClick={() => {
                        setActiveGeraiSubTab('pengajuan');
                        setShowAddGeraiForm(true);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                    >
                      <Plus className="w-4 h-4" />
                      Ajukan Gerai Baru
                    </button>
                  )}
                </div>

                {/* Sub navigation Tabs */}
                <div className="flex border-b border-slate-200/80 gap-1 overflow-x-auto pb-px">
                  <button
                    onClick={() => setActiveGeraiSubTab('aktif')}
                    className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                      activeGeraiSubTab === 'aktif'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Gerai Aktif ({geraiList.length})
                  </button>

                  <button
                    onClick={() => setActiveGeraiSubTab('pengajuan')}
                    className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                      activeGeraiSubTab === 'pengajuan'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {currentUser.role === 'wakil_ketua_usaha' ? 'Form & Histori Pengajuan' : 'Histori Pengajuan'}
                    {pendingGeraiList.length > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-indigo-50 text-indigo-700 rounded-full font-semibold">
                        {pendingGeraiList.length}
                      </span>
                    )}
                  </button>

                  {(currentUser.role === 'ketua' || currentUser.role === 'admin_master') && (
                    <button
                      onClick={() => setActiveGeraiSubTab('persetujuan')}
                      className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                        activeGeraiSubTab === 'persetujuan'
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Validasi Ketua
                      {pendingGeraiList.filter(g => g.status === 'DIAJUKAN').length > 0 ? (
                        <span className="px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-800 rounded-full font-bold animate-pulse">
                          {pendingGeraiList.filter(g => g.status === 'DIAJUKAN').length}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-500 rounded-full">
                          0
                        </span>
                      )}
                    </button>
                  )}
                </div>

                {/* TAB 1: GERAI AKTIF */}
                {activeGeraiSubTab === 'aktif' && (
                  <div className="space-y-4">
                    {geraiList.length === 0 ? (
                      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
                        <Store className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-slate-500 font-medium">Belum ada gerai aktif yang terdaftar.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {geraiList.map((g) => (
                          <div key={g.id} className="bg-white p-4 rounded-2xl border border-slate-200/95 shadow-3xs hover:shadow-2xs transition-shadow space-y-4 relative overflow-hidden group">
                            {/* Decorative line color */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600/80" />
                            
                            <div className="text-left pt-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-sm uppercase">
                                  ID: {g.id.toUpperCase()}
                                </span>
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                  ● Beroperasi
                                </span>
                              </div>
                              <h4 className="text-xs font-bold text-slate-900 mt-2.5 leading-tight group-hover:text-indigo-600 transition-colors">
                                {g.name}
                              </h4>
                              <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                {g.location}
                              </p>
                            </div>

                            <div className="pt-3 border-t border-slate-100 text-xs text-left space-y-2 font-mono">
                              <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                                <span className="text-slate-400 text-[10px]">Omzet Penjualan:</span>
                                <span className="font-bold text-slate-800 text-[11px]">Rp {g.sales.toLocaleString('id-ID')}</span>
                              </div>
                              <div className="flex justify-between items-center bg-emerald-50/40 p-2 rounded-xl border border-emerald-100/50">
                                <span className="text-emerald-700 text-[10px] font-semibold">Laba Bersih:</span>
                                <span className="font-bold text-emerald-700 text-[11px]">Rp {g.profit.toLocaleString('id-ID')}</span>
                              </div>
                              <div className="flex justify-between items-center p-1 px-2">
                                <span className="text-slate-400 text-[10px]">Sisa Stok:</span>
                                <span className={`font-bold ${g.stock < 20 ? 'text-amber-600' : 'text-slate-800'}`}>
                                  {g.stock} Pcs {g.stock < 20 && '(Menipis!)'}
                                </span>
                              </div>
                            </div>

                            {currentUser.role === 'wakil_ketua_usaha' && (() => {
                              const pendingForGerai = pendingGeraiList.find(p => p.geraiId === g.id && p.status === 'DIAJUKAN');
                              if (pendingForGerai) {
                                return (
                                  <div className="pt-2.5 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-amber-700 bg-amber-50/70 px-2.5 py-1.5 rounded-xl border border-amber-100/50 mt-2">
                                    <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0" />
                                    <span>Menunggu validasi {pendingForGerai.type === 'EDIT' ? 'edit' : 'penutupan'}</span>
                                  </div>
                                );
                              }
                              return (
                                <div className="pt-2 border-t border-slate-100 flex justify-end gap-1.5 mt-2">
                                  <button
                                    onClick={() => handleStartEdit(g)}
                                    className="p-1 px-2.5 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors border border-transparent hover:border-indigo-100/40"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleStartDelete(g)}
                                    className="p-1 px-2.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors border border-transparent hover:border-rose-100/40"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Hapus
                                  </button>
                                </div>
                              );
                            })()}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: FORM & HISTORI PENGAJUAN */}
                {activeGeraiSubTab === 'pengajuan' && (
                  <div className="space-y-6">
                    
                    {/* Access banner for roles other than Wakil Ketua Usaha */}
                    {currentUser.role !== 'wakil_ketua_usaha' && !showAddGeraiForm && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3 text-left">
                        <Lock className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-800">Hak Akses Formulir Terbatas</p>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Formulir penambahan/pengajuan gerai koperasi baru hanya dapat diinput oleh 
                            <span className="font-bold text-indigo-700 bg-indigo-50 px-1 py-0.2 rounded mx-1 uppercase">Wakil Ketua Bidang Usaha</span> 
                            terkait sirkulasi rencana anggaran program kerja. Anda dapat memantau riwayat pengajuan di bawah ini.
                          </p>
                        </div>
                      </div>
                    )}

                     {/* Toggle form button for Wakil Ketua Usaha */}
                    {currentUser.role === 'wakil_ketua_usaha' && !showAddGeraiForm && !editingGerai && !deletingGerai && (
                      <button
                        onClick={() => setShowAddGeraiForm(true)}
                        className="w-full p-4 border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-2xl flex flex-col items-center justify-center gap-2 text-indigo-600 bg-indigo-50/20 hover:bg-indigo-50/50 transition-all cursor-pointer"
                      >
                        <Plus className="w-6 h-6" />
                        <span className="text-xs font-bold">Buat Proposal & Ajukan Pembangunan Gerai Baru</span>
                        <span className="text-[10px] text-slate-400">Rencana anggaran, sumber dana, inventaris, dan publikasi portal</span>
                      </button>
                    )}

                    {/* Propose Edit Form */}
                    {editingGerai && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-sm space-y-4 text-left relative"
                      >
                        <div className="flex items-center justify-between border-b border-indigo-50 pb-3">
                          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                            <Edit2 className="w-4 h-4 text-indigo-600" />
                            Usulan Pembaruan Data Gerai: {editingGerai.name}
                          </h3>
                          <button
                            onClick={() => setEditingGerai(null)}
                            className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <form onSubmit={handleAddEditProposal} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                            
                            <div className="space-y-1">
                              <label className="block text-[10px] text-slate-500 uppercase font-bold">Nama Gerai Baru</label>
                              <input
                                type="text"
                                value={editGeraiName}
                                onChange={(e) => setEditGeraiName(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden text-slate-800"
                                required
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[10px] text-slate-500 uppercase font-bold">Detail Lokasi / Alamat Baru</label>
                              <input
                                type="text"
                                value={editGeraiLocation}
                                onChange={(e) => setEditGeraiLocation(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden text-slate-800"
                                required
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[10px] text-slate-500 uppercase font-bold">Omzet Penjualan (Rupiah)</label>
                              <input
                                type="number"
                                value={editGeraiSales}
                                onChange={(e) => setEditGeraiSales(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden text-slate-800"
                                required
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[10px] text-slate-500 uppercase font-bold">Laba Bersih Operasional (Rupiah)</label>
                              <input
                                type="number"
                                value={editGeraiProfit}
                                onChange={(e) => setEditGeraiProfit(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden text-slate-800"
                                required
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[10px] text-slate-500 uppercase font-bold">Jumlah Sediaan/Stok (Pcs)</label>
                              <input
                                type="number"
                                value={editGeraiStock}
                                onChange={(e) => setEditGeraiStock(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden text-slate-800"
                                required
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[10px] text-slate-500 uppercase font-bold">Rencana Anggaran Operasional (Rupiah)</label>
                              <input
                                type="number"
                                value={editGeraiBudget}
                                onChange={(e) => setEditGeraiBudget(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden text-slate-800"
                                required
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[10px] text-slate-500 uppercase font-bold">Sumber Dana Anggaran</label>
                              <select
                                value={editGeraiFundingSource}
                                onChange={(e) => setEditGeraiFundingSource(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden text-slate-800"
                              >
                                <option value="Dana Investasi Koperasi">Dana Investasi Koperasi</option>
                                <option value="Sisa Hasil Usaha (SHU) Cadangan">Sisa Hasil Usaha (SHU) Cadangan</option>
                                <option value="Simpanan Sukarela Anggota">Simpanan Sukarela Khusus</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[10px] text-slate-500 uppercase font-bold">Gambar Gerai (Pilih Preset)</label>
                              <div className="grid grid-cols-4 gap-2">
                                {[
                                  { id: 'modern_mart', url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=300', label: 'Ritel' },
                                  { id: 'grocery', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300', label: 'Sembako' },
                                  { id: 'coop', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=300', label: 'Swalayan' },
                                  { id: 'cafe', url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=300', label: 'Kafe' },
                                ].map(preset => (
                                  <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => setEditGeraiPhotoUrl(preset.url)}
                                    className={`relative rounded-lg overflow-hidden border-2 h-14 transition-all cursor-pointer ${
                                      editGeraiPhotoUrl === preset.url ? 'border-indigo-600 ring-2 ring-indigo-500/20 scale-95' : 'border-slate-200 opacity-60 hover:opacity-100'
                                    }`}
                                  >
                                    <img src={preset.url} alt={preset.label} className="w-full h-full object-cover animate-none" />
                                    <span className="absolute bottom-0 inset-x-0 text-[8px] bg-black/60 text-white font-bold py-0.5 text-center">
                                      {preset.label}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1 text-left">
                            <label className="block text-[10px] text-slate-500 uppercase font-bold">Deskripsi / Alasan Perubahan Data Operasional</label>
                            <textarea
                              rows={3}
                              value={editGeraiDescription}
                              onChange={(e) => setEditGeraiDescription(e.target.value)}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden text-slate-800"
                              required
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => setEditingGerai(null)}
                              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                              Batal
                            </button>
                            <button
                              type="submit"
                              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <Check className="w-4 h-4" />
                              Ajukan Perubahan ke Ketua
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    )}

                    {/* Propose Delete Form */}
                    {deletingGerai && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-rose-50/20 p-5 rounded-2xl border border-rose-200 shadow-sm space-y-4 text-left relative"
                      >
                        <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                          <h3 className="text-xs font-bold text-rose-950 uppercase tracking-wider flex items-center gap-1.5">
                            <Trash2 className="w-4 h-4 text-rose-600" />
                            Usulan Penutupan / Penghapusan Gerai: {deletingGerai.name}
                          </h3>
                          <button
                            onClick={() => setDeletingGerai(null)}
                            className="p-1 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <form onSubmit={handleAddDeleteProposal} className="space-y-4">
                          <div className="space-y-1 text-left">
                            <label className="block text-[10px] text-rose-700 uppercase font-bold">Alasan Penutupan & Restrukturisasi Aset Gerai</label>
                            <textarea
                              rows={4}
                              value={deleteReason}
                              onChange={(e) => setDeleteReason(e.target.value)}
                              placeholder="Harap berikan evaluasi lengkap mengapa gerai ini perlu ditutup (misalnya: omzet tidak mencapai target, kendala operasional, atau penyatuan dengan gerai lain)..."
                              className="w-full p-2.5 bg-white border border-rose-200 rounded-xl text-xs focus:ring-1 focus:ring-rose-500 focus:border-rose-500 outline-hidden text-slate-800"
                              required
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-2 border-t border-rose-100">
                            <button
                              type="button"
                              onClick={() => setDeletingGerai(null)}
                              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                              Batal
                            </button>
                            <button
                              type="submit"
                              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <Check className="w-4 h-4" />
                              Ajukan Penutupan & Kirim Ke Ketua
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    )}

                    {/* Propose Form */}
                    {showAddGeraiForm && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-left relative"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                            <Plus className="w-4 h-4 text-indigo-600" />
                            Formulir Pengajuan Gerai Koperasi
                          </h3>
                          <button
                            onClick={() => setShowAddGeraiForm(false)}
                            className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {currentUser.role !== 'wakil_ketua_usaha' && (
                          <div className="p-3 bg-amber-50 text-amber-800 border border-amber-100 rounded-xl text-xs font-semibold mb-2">
                            ⚠️ Perhatian: Anda masuk sebagai {currentUser.role.replace(/_/g, ' ')}. Form ini hanya dapat disimpan secara sah oleh Wakil Ketua Bidang Usaha.
                          </div>
                        )}

                        <form onSubmit={handleAddGeraiProposal} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                            
                            <div className="space-y-1">
                              <label className="block text-[10px] text-slate-500 uppercase font-bold">Nama Gerai Rencana</label>
                              <input
                                type="text"
                                value={newGeraiName}
                                onChange={(e) => setNewGeraiName(e.target.value)}
                                placeholder="Contoh: Gerai Merah Putih Cabang Sukorejo"
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden text-slate-800"
                                required
                                disabled={currentUser.role !== 'wakil_ketua_usaha'}
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[10px] text-slate-500 uppercase font-bold">Detail Lokasi / Alamat</label>
                              <input
                                type="text"
                                value={newGeraiLocation}
                                onChange={(e) => setNewGeraiLocation(e.target.value)}
                                placeholder="Contoh: Jl. Diponegoro No. 45, Area Blok Industri Timur"
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden text-slate-800"
                                required
                                disabled={currentUser.role !== 'wakil_ketua_usaha'}
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[10px] text-slate-500 uppercase font-bold">Rencana Anggaran (Rupiah)</label>
                              <input
                                type="number"
                                value={newGeraiBudget}
                                onChange={(e) => setNewGeraiBudget(e.target.value)}
                                placeholder="Contoh: 15000000"
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden text-slate-800"
                                required
                                disabled={currentUser.role !== 'wakil_ketua_usaha'}
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[10px] text-slate-500 uppercase font-bold">Sumber Anggaran / Pendanaan</label>
                              <select
                                value={newGeraiFundingSource}
                                onChange={(e) => setNewGeraiFundingSource(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden text-slate-800"
                                disabled={currentUser.role !== 'wakil_ketua_usaha'}
                              >
                                <option value="Dana Investasi Koperasi">Dana Investasi Pengembangan Koperasi</option>
                                <option value="Sisa Hasil Usaha (SHU) Cadangan">Sisa Hasil Usaha (SHU) Cadangan</option>
                                <option value="Simpanan Sukarela Anggota">Simpanan Sukarela Khusus Usaha</option>
                                <option value="Dana Hibah Unit Usaha Dagang">Dana Hibah Unit Usaha Dagang</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[10px] text-slate-500 uppercase font-bold">Jumlah Sediaan Awal (Pcs)</label>
                              <input
                                type="number"
                                value={newGeraiStock}
                                onChange={(e) => setNewGeraiStock(e.target.value)}
                                placeholder="Contoh: 100"
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden text-slate-800"
                                required
                                disabled={currentUser.role !== 'wakil_ketua_usaha'}
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[10px] text-slate-500 uppercase font-bold">Visual Banner Gerai (Pilih Preset Gambar)</label>
                              <div className="grid grid-cols-4 gap-2">
                                {[
                                  { id: 'modern_mart', url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=300', label: 'Ritel' },
                                  { id: 'grocery', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300', label: 'Sembako' },
                                  { id: 'coop', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=300', label: 'Swalayan' },
                                  { id: 'cafe', url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=300', label: 'Kafe' },
                                ].map(preset => (
                                  <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => setNewGeraiPhotoUrl(preset.url)}
                                    className={`relative rounded-lg overflow-hidden border-2 h-14 transition-all cursor-pointer ${
                                      newGeraiPhotoUrl === preset.url ? 'border-indigo-600 ring-2 ring-indigo-500/20 scale-95' : 'border-slate-200 opacity-60 hover:opacity-100'
                                    }`}
                                    disabled={currentUser.role !== 'wakil_ketua_usaha'}
                                  >
                                    <img src={preset.url} alt={preset.label} className="w-full h-full object-cover animate-none" />
                                    <span className="absolute bottom-0 inset-x-0 text-[8px] bg-black/60 text-white font-bold py-0.5 text-center">
                                      {preset.label}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1 text-left">
                            <label className="block text-[10px] text-slate-500 uppercase font-bold">Rincian Deskripsi Program Kerja & Potensi Bisnis</label>
                            <textarea
                              rows={3}
                              value={newGeraiDescription}
                              onChange={(e) => setNewGeraiDescription(e.target.value)}
                              placeholder="Deskripsikan rencana pengembangan usaha retail ini, segmentasi pasar target, potensi keuntungan bersih bulanan, serta indikator program kerja..."
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden text-slate-800"
                              required
                              disabled={currentUser.role !== 'wakil_ketua_usaha'}
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setShowAddGeraiForm(false)}
                              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                              Batal
                            </button>
                            {currentUser.role === 'wakil_ketua_usaha' && (
                              <button
                                type="submit"
                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                              >
                                <Check className="w-4 h-4" />
                                Ajukan ke Ketua & Buat Progja
                              </button>
                            )}
                          </div>
                        </form>
                      </motion.div>
                    )}

                    {/* Proposed History */}
                    <div className="space-y-3 text-left">
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <History className="w-4 h-4 text-slate-400" />
                        Histori Usulan & Rencana Kerja Gerai Koperasi
                      </h3>

                      {pendingGeraiList.length === 0 ? (
                        <div className="bg-slate-50/55 border border-dashed border-slate-200 rounded-2xl p-6 text-center">
                          <p className="text-[11px] text-slate-400 font-medium">Belum ada riwayat pengajuan gerai.</p>
                        </div>
                      ) : (
                        <div className="space-y-3 text-left">
                          {pendingGeraiList.map((g) => {
                            const isEdit = g.type === 'EDIT';
                            const isHapus = g.type === 'HAPUS';
                            
                            return (
                              <div key={g.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs flex flex-col sm:flex-row items-start justify-between gap-4">
                                <div className="flex gap-3 items-start text-left">
                                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-200/80">
                                    <img src={g.photoUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=300'} alt="Store Thumbnail" className="w-full h-full object-cover" />
                                  </div>
                                  <div className="space-y-1 text-left">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-[8px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-sm">
                                        ID PROP: {g.id.toUpperCase()}
                                      </span>
                                      {isEdit && (
                                        <span className="text-[8px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-sm">
                                          USULAN EDIT
                                        </span>
                                      )}
                                      {isHapus && (
                                        <span className="text-[8px] font-bold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded-sm">
                                          USULAN PENUTUPAN
                                        </span>
                                      )}
                                    </div>
                                    <h4 className="text-xs font-bold text-slate-900">
                                      {g.name} {isHapus && <span className="text-rose-600">(Rencana Tutup)</span>}
                                    </h4>
                                    <p className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                      <MapPin className="w-3 h-3 text-slate-300" />
                                      {g.location}
                                    </p>
                                    
                                    {!isHapus ? (
                                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono pt-1 text-slate-500">
                                        <span>Anggaran Operasional: <strong className="text-slate-800">Rp {(g.budgetPlanned || 0).toLocaleString('id-ID')}</strong></span>
                                        {isEdit ? (
                                          <>
                                            <span>Sediaan Baru: <strong className="text-slate-800">{g.stock} Pcs</strong></span>
                                            <span>Estimasi Laba Baru: <strong className="text-slate-800">Rp {(g.profit || 0).toLocaleString('id-ID')}</strong></span>
                                          </>
                                        ) : (
                                          <span>Sediaan Awal: <strong className="text-slate-800">{g.initialStock} Pcs</strong></span>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="text-[10px] text-slate-500 pt-1">
                                        Status Gerai Saat Ini: <strong className="text-rose-600 font-mono">NON-AKTIF SEGERA</strong>
                                      </div>
                                    )}
                                    
                                    <p className="text-[10px] text-slate-400 line-clamp-1 pt-1 italic">
                                      "{g.description}"
                                    </p>
                                  </div>
                                </div>

                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                <span className="text-[9px] text-slate-400 font-mono">{g.createdAt}</span>
                                {g.status === 'DIAJUKAN' && (
                                  <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-amber-600 animate-none" />
                                    Menunggu Validasi Ketua
                                  </span>
                                )}
                                {g.status === 'DISETUJUI' && (
                                  <div className="flex flex-col items-end gap-1">
                                    <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      Valid Terpublikasi
                                    </span>
                                    <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-sm font-semibold">
                                      Progja Dipublish
                                    </span>
                                  </div>
                                )}
                                {g.status === 'DITOLAK' && (
                                  <span className="text-[10px] bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                    <XCircle className="w-3 h-3 text-rose-600" />
                                    Perlu Revisi
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: VALIDASI KETUA */}
                {activeGeraiSubTab === 'persetujuan' && (currentUser.role === 'ketua' || currentUser.role === 'admin_master') && (
                  <div className="space-y-4 text-left">
                    <div className="p-4 bg-indigo-50 text-indigo-950 rounded-2xl border border-indigo-100 flex items-start gap-3">
                      <Info className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                      <div className="space-y-0.5 text-left">
                        <p className="text-xs font-bold">Pusat Validasi Pengembangan Usaha</p>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          Sebagai Ketua Koperasi, Anda memiliki wewenang penuh untuk meninjau dan memvalidasi usulan penambahan gerai baru dari Wakil Ketua Bidang Usaha. 
                          Persetujuan Anda akan otomatis menerbitkan Program Kerja terkait, meluncurkan gerai ke sistem, dan mempublikasikan siaran berita peresmian berfoto di Portal Publik secara real-time.
                        </p>
                      </div>
                    </div>

                    {pendingGeraiList.filter(g => g.status === 'DIAJUKAN').length === 0 ? (
                      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                        <CheckCheck className="w-8 h-8 text-emerald-500 mx-auto" />
                        <p className="text-xs text-slate-800 font-bold">Semua Bersih & Aman!</p>
                        <p className="text-[11px] text-slate-400">Belum ada proposal gerai baru yang menunggu persetujuan Anda saat ini.</p>
                      </div>
                    ) : (
                      <div className="space-y-4 text-left">
                        {pendingGeraiList.filter(g => g.status === 'DIAJUKAN').map((g) => (
                          <div key={g.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs hover:shadow-xs transition-shadow flex flex-col md:flex-row text-left">
                            <div className="w-full md:w-64 h-44 shrink-0 relative bg-slate-100">
                              <img src={g.photoUrl} alt={g.name} className="w-full h-full object-cover" />
                              <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white px-2 py-0.5 rounded-md text-[9px] font-mono font-bold">
                                {g.type === 'HAPUS' ? 'Penutupan' : `Rp ${(g.budgetPlanned || 0).toLocaleString('id-ID')}`}
                              </div>
                            </div>

                            <div className="p-5 flex-1 flex flex-col justify-between gap-4 text-left">
                              <div className="space-y-2 text-left">
                                <div className="flex items-center gap-1.5 flex-wrap text-left">
                                  <span className={`text-[9px] font-bold border px-2 py-0.5 rounded-full uppercase ${
                                    g.type === 'HAPUS'
                                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                                      : g.type === 'EDIT'
                                      ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                      : 'bg-amber-50 text-amber-800 border-amber-200'
                                  }`}>
                                    {g.type === 'HAPUS' ? 'Validasi Penutupan' : g.type === 'EDIT' ? 'Validasi Edit' : 'Validasi Gerai Baru'}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-mono">
                                    Diusulkan oleh: {g.submittedByName} ({g.createdAt})
                                  </span>
                                </div>
                                
                                <h3 className="text-sm font-bold text-slate-900">{g.type === 'HAPUS' ? `Rencana Penutupan: ${g.name}` : g.type === 'EDIT' ? `Usulan Edit: ${g.name}` : `Gerai Baru: ${g.name}`}</h3>
                                <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                                  <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                  Lokasi: {g.location}
                                </p>
                                
                                {g.type === 'EDIT' && g.oldData ? (
                                  <div className="space-y-2 pt-1">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Perbandingan Perubahan Data:</div>
                                    <div className="grid grid-cols-2 gap-3 text-[10px] font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-left">
                                      <div className="space-y-0.5 border-r border-slate-200/60 pr-2">
                                        <div className="text-slate-400 font-semibold uppercase text-[8px]">Sebelumnya:</div>
                                        <div>Nama: <span className="text-slate-700">{g.oldData.name}</span></div>
                                        <div>Lokasi: <span className="text-slate-700">{g.oldData.location}</span></div>
                                        <div>Stok: <span className="text-slate-700">{g.oldData.stock} Pcs</span></div>
                                        <div>Laba: <span className="text-slate-700">Rp {g.oldData.profit.toLocaleString('id-ID')}</span></div>
                                      </div>
                                      <div className="space-y-0.5">
                                        <div className="text-indigo-600 font-semibold uppercase text-[8px]">Diusulkan Baru:</div>
                                        <div>Nama: <span className="text-indigo-700 font-bold">{g.name}</span></div>
                                        <div>Lokasi: <span className="text-indigo-700 font-bold">{g.location}</span></div>
                                        <div>Stok: <span className="text-indigo-700 font-bold">{g.stock} Pcs</span></div>
                                        <div>Laba: <span className="text-indigo-700 font-bold">Rp {g.profit.toLocaleString('id-ID')}</span></div>
                                      </div>
                                    </div>
                                  </div>
                                ) : g.type === 'HAPUS' ? (
                                  <div className="p-2.5 bg-rose-50/40 border border-rose-100 rounded-xl text-[11px] text-rose-800">
                                    ⚠️ Gerai ini akan dihapus permanen dari portal aktif dan dinonaktifkan dari daftar retail beroperasi.
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-left">
                                    <span>Sumber Dana: <strong className="text-slate-800">{g.fundingSource}</strong></span>
                                    <span>Persediaan Stok: <strong className="text-slate-800">{g.initialStock} Pcs</strong></span>
                                  </div>
                                )}

                                <p className="text-xs text-slate-600 leading-relaxed italic bg-slate-50/50 p-3 rounded-xl border border-dashed border-slate-200/85 text-left text-slate-500 text-slate-500">
                                  "{g.description}"
                                </p>
                              </div>

                              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                                <button
                                  onClick={() => handleRejectGeraiProposal(g.id)}
                                  className="px-4 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                  Tolak & Revisi
                                </button>
                                <button
                                  onClick={() => handleApproveGeraiProposal(g.id)}
                                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="w-4 h-4 text-white shrink-0" />
                                  Validasi & Publikasikan
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* 9. ADMINISTRASI KOPERASI */}
            {activeMenu === 'administrasi_koperasi' && (
              <motion.div
                key="administrasi_koperasi"
                initial={{ opacity: 0, y: 15, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.985 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6 text-left"
              >
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 font-sans">Administrasi Koperasi & Kearsipan</h2>
                    <p className="text-xs text-slate-500 mt-1">Registrasi nomor surat keluar masuk, penomoran surat keputusan, dan pengarsipan digital.</p>
                  </div>

                  <button
                    onClick={() => setShowAddLetter(!showAddLetter)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Registrasi Surat Baru
                  </button>
                </div>

                {/* Add Letter form */}
                {showAddLetter && (
                  <form onSubmit={handleAddLetter} className="p-5 bg-white border border-slate-200 rounded-2xl space-y-4">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Registrasi Nomor Surat Keluar/Masuk</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Jenis Surat</label>
                        <select
                          value={letterType}
                          onChange={(e) => setLetterType(e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
                        >
                          <option value="Surat Keluar">Surat Keluar</option>
                          <option value="Surat Masuk">Surat Masuk</option>
                          <option value="Surat Keputusan">Surat Keputusan</option>
                          <option value="Surat Tugas">Surat Tugas</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Nomor Kode Surat</label>
                        <input
                          type="text"
                          value={letterNumber}
                          onChange={(e) => setLetterNumber(e.target.value)}
                          placeholder="012/SK/KMP/V/2026"
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Perihal / Subjek Surat</label>
                        <input
                          type="text"
                          value={letterSubject}
                          onChange={(e) => setLetterSubject(e.target.value)}
                          placeholder="Undangan rapat pleno..."
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Tanggal Surat</label>
                        <input
                          type="date"
                          value={letterDate}
                          onChange={(e) => setLetterDate(e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddLetter(false)}
                        className="px-3.5 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Registrasikan Arsip
                      </button>
                    </div>
                  </form>
                )}

                {/* Letters table list */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Arsip Buku Agenda Surat</h3>
                  
                  <div className="space-y-3">
                    {administrasiList.map((letObj) => (
                      <div key={letObj.id} className="p-3 bg-slate-50 hover:bg-slate-100/30 rounded-xl border border-slate-100 flex items-center justify-between gap-4">
                        <div className="text-left space-y-0.5">
                          <span className="px-2 py-0.5 rounded-sm text-[9px] font-bold bg-slate-200 text-slate-700 font-mono">
                            {letObj.type.toUpperCase()}
                          </span>
                          <p className="text-xs font-bold text-slate-800 mt-1">{letObj.subject}</p>
                          <p className="text-[10px] text-slate-400">Nomor: {letObj.number} • Tanggal: {letObj.date}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 italic">Disusun: {letObj.sender.split(',')[0]}</span>
                          <button
                            onClick={() => handleDeleteLetter(letObj.id)}
                            className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-md cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 10. AKSES (ONLY FOR ADMIN_MASTER) */}
            {activeMenu === 'akses' && currentUser.role === 'admin_master' && (
              <motion.div
                key="akses"
                initial={{ opacity: 0, y: 15, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.985 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6 text-left"
              >
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <h2 className="text-base font-bold text-slate-900">Pengaturan Hak Akses User & Role (Admin Master)</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Aktifkan atau matikan hak akses menu secara dinamis untuk setiap posisi pengurus. Perubahan akan langsung diaplikasikan pada navigasi dasbor mereka.
                  </p>
                </div>

                {/* Matrix permissions grid */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="p-3 font-bold text-slate-600 uppercase tracking-wider text-[10px] rounded-l-xl">Role / Posisi</th>
                        <th className="p-3 font-bold text-slate-600 text-center uppercase tracking-wider text-[10px]">Dasbor</th>
                        <th className="p-3 font-bold text-slate-600 text-center uppercase tracking-wider text-[10px]">Sirkulasi</th>
                        <th className="p-3 font-bold text-slate-600 text-center uppercase tracking-wider text-[10px]">Keuangan</th>
                        <th className="p-3 font-bold text-slate-600 text-center uppercase tracking-wider text-[10px]">Anggota</th>
                        <th className="p-3 font-bold text-slate-600 text-center uppercase tracking-wider text-[10px]">Download</th>
                        <th className="p-3 font-bold text-slate-600 text-center uppercase tracking-wider text-[10px]">Biodata Kop</th>
                        <th className="p-3 font-bold text-slate-600 text-center uppercase tracking-wider text-[10px]">Himbauan</th>
                        <th className="p-3 font-bold text-slate-600 text-center uppercase tracking-wider text-[10px]">Gerai</th>
                        <th className="p-3 font-bold text-slate-600 text-center uppercase tracking-wider text-[10px]">Administrasi</th>
                        <th className="p-3 font-bold text-slate-600 text-center uppercase tracking-wider text-[10px] rounded-r-xl">Akses</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rolesList
                        .filter((r) => r.value !== 'admin_master')
                        .map((roleObj) => {
                          const rAccess = roleAccess[roleObj.value];
                          return (
                            <tr key={roleObj.value} className="hover:bg-slate-50/50">
                              <td className="p-3 font-bold text-slate-700 capitalize">
                                {roleObj.label.replace('Koperasi', '')}
                              </td>
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={rAccess.dashboard_pengurus}
                                  onChange={() => handleToggleAccess(roleObj.value, 'dashboard_pengurus')}
                                  className="w-4 h-4 accent-slate-900 cursor-pointer"
                                />
                              </td>
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={rAccess.sirkulasi_prokja}
                                  onChange={() => handleToggleAccess(roleObj.value, 'sirkulasi_prokja')}
                                  className="w-4 h-4 accent-slate-900 cursor-pointer"
                                />
                              </td>
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={rAccess.keuangan}
                                  onChange={() => handleToggleAccess(roleObj.value, 'keuangan')}
                                  className="w-4 h-4 accent-slate-900 cursor-pointer"
                                />
                              </td>
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={rAccess.anggota}
                                  onChange={() => handleToggleAccess(roleObj.value, 'anggota')}
                                  className="w-4 h-4 accent-slate-900 cursor-pointer"
                                />
                              </td>
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={rAccess.file_download}
                                  onChange={() => handleToggleAccess(roleObj.value, 'file_download')}
                                  className="w-4 h-4 accent-slate-900 cursor-pointer"
                                />
                              </td>
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={rAccess.biodata_koperasi}
                                  onChange={() => handleToggleAccess(roleObj.value, 'biodata_koperasi')}
                                  className="w-4 h-4 accent-slate-900 cursor-pointer"
                                />
                              </td>
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={rAccess.himbauan}
                                  onChange={() => handleToggleAccess(roleObj.value, 'himbauan')}
                                  className="w-4 h-4 accent-slate-900 cursor-pointer"
                                />
                              </td>
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={rAccess.gerai}
                                  onChange={() => handleToggleAccess(roleObj.value, 'gerai')}
                                  className="w-4 h-4 accent-slate-900 cursor-pointer"
                                />
                              </td>
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={rAccess.administrasi_koperasi}
                                  onChange={() => handleToggleAccess(roleObj.value, 'administrasi_koperasi')}
                                  className="w-4 h-4 accent-slate-900 cursor-pointer"
                                />
                              </td>
                              <td className="p-3 text-center font-mono font-bold text-rose-500">
                                {rAccess.akses ? 'ON' : 'OFF'}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                {/* NIK Registry & Approvals Panel */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Daftar Pre-Otorisasi NIK (Izin Registrasi)</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Daftar NIK pengurus yang disetujui untuk melakukan registrasi/aktivasi password pertama kali sebelum masuk sistem.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAddNikForm(!showAddNikForm)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Otorisasi NIK Baru
                    </button>
                  </div>

                  {/* Add NIK Form */}
                  {showAddNikForm && (
                    <form onSubmit={handleAddNikRegistry} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Form Pre-Otorisasi Registrasi Pengurus</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="block text-[10px] text-slate-500 uppercase font-bold">Nomor NIK Pengurus</label>
                          <input
                            type="text"
                            required
                            placeholder="Contoh: 77777"
                            value={newNik}
                            onChange={(e) => setNewNik(e.target.value)}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] text-slate-500 uppercase font-bold">Nama Lengkap</label>
                          <input
                            type="text"
                            required
                            placeholder="Contoh: Roni Wijaya, S.T."
                            value={newNikName}
                            onChange={(e) => setNewNikName(e.target.value)}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] text-slate-500 uppercase font-bold">Jabatan / Role Kerja</label>
                          <select
                            value={newNikRole}
                            onChange={(e) => setNewNikRole(e.target.value as Role)}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden"
                          >
                            {rolesList.map(r => (
                              <option key={r.value} value={r.value}>{r.label.split(' (')[0]}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAddNikForm(false)}
                          className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Simpan & Izinkan Registrasi
                        </button>
                      </div>
                    </form>
                  )}

                  {/* NIK List Table */}
                  <div className="border border-slate-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                          <th className="p-3">NIK</th>
                          <th className="p-3">Nama Pengurus</th>
                          <th className="p-3">Jabatan / Peran</th>
                          <th className="p-3 text-center">Status Aktivasi</th>
                          <th className="p-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {usersBase.map(user => (
                          <tr key={user.nik} className="hover:bg-slate-50/40">
                            <td className="p-3 font-mono font-bold text-slate-700">{user.nik}</td>
                            <td className="p-3 font-semibold text-slate-950">{user.name}</td>
                            <td className="p-3 text-slate-600 capitalize">{user.role.replace(/_/g, ' ')}</td>
                            <td className="p-3 text-center">
                              {user.isRegistered ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Sudah Registrasi / Aktif
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  Menunggu Aktivasi
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              {user.nik !== 'admin_master_001' && user.nik !== currentUser.nik ? (
                                <button
                                  onClick={() => handleDeleteNikRegistry(user.nik)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer inline-flex items-center"
                                  title="Cabut Izin Registrasi"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic font-medium">Bawaan Sistem</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 10. LOG AKTIVITAS */}
            {activeMenu === 'log_aktivitas' && (
              <motion.div
                key="log_aktivitas"
                initial={{ opacity: 0, y: 15, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.985 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6 text-left"
              >
                {/* Banner Header */}
                <div className="bg-linear-to-r from-emerald-900 to-slate-900 text-white p-6 rounded-3xl border border-emerald-850 relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/15 rounded-full blur-2xl -translate-y-8 translate-x-8 pointer-events-none" />
                  <div className="relative z-10 space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 rounded-full text-emerald-300 text-[10px] font-bold border border-emerald-500/30 uppercase tracking-wider">
                      <History className="w-3.5 h-3.5" />
                      Sistem Audit & Pelacakan Internal Koperasi
                    </div>
                    <h2 className="text-xl font-bold tracking-tight">Log Aktivitas Pengurus</h2>
                    <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                      Pantau riwayat perubahan data program kerja, status progja, transaksional keuangan, dan setelan operasional koperasi oleh para pengurus secara real-time demi menjaga asas transparansi dan akuntabilitas internal.
                    </p>
                  </div>
                </div>

                {/* Filter and Metrics Controls */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
                  {/* Summary Indicators */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Riwayat Log</span>
                      <span className="text-2xl font-extrabold text-slate-900 block mt-1">{activityLogs.length} Entri</span>
                    </div>
                    <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Perubahan Keuangan</span>
                      <span className="text-2xl font-extrabold text-emerald-900 block mt-1">
                        {activityLogs.filter(l => l.category === 'keuangan').length} Entri
                      </span>
                    </div>
                    <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                      <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">Sirkulasi Progja</span>
                      <span className="text-2xl font-extrabold text-indigo-900 block mt-1">
                        {activityLogs.filter(l => l.category === 'progja').length} Entri
                      </span>
                    </div>
                  </div>

                  {/* Filter Inputs Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
                    {/* Search Bar */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-[10px] text-slate-500 uppercase font-bold">Cari Berdasarkan Keyword</label>
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Cari nama pengurus, NIK, jenis aksi, atau detail..."
                          value={logSearchQuery}
                          onChange={(e) => setLogSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white outline-hidden transition-all"
                        />
                      </div>
                    </div>

                    {/* Category Selector */}
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-500 uppercase font-bold">Kategori Aktivitas</label>
                      <select
                        value={logSelectedCategory}
                        onChange={(e) => setLogSelectedCategory(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden"
                      >
                        <option value="all">Semua Kategori</option>
                        <option value="progja">Program Kerja (Progja)</option>
                        <option value="keuangan">Aliran Kas / Keuangan</option>
                        <option value="system">Setelan Sistem / Hak Akses</option>
                        <option value="auth">Aktivasi Akun / Registrasi</option>
                      </select>
                    </div>

                    {/* Role Selector */}
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-500 uppercase font-bold">Jabatan Pengurus</label>
                      <select
                        value={logSelectedRole}
                        onChange={(e) => setLogSelectedRole(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden"
                      >
                        <option value="all">Semua Jabatan</option>
                        <option value="admin_master">Admin Master</option>
                        <option value="ketua">Ketua Koperasi</option>
                        <option value="pengawas">Pengawas Koperasi</option>
                        <option value="bendahara">Bendahara</option>
                        <option value="sekretaris">Sekretaris</option>
                        <option value="wakil_ketua_usaha">Wakil Ketua Usaha</option>
                        <option value="wakil_ketua_anggota">Wakil Ketua Anggota</option>
                      </select>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-500 font-medium">
                      Menampilkan <strong className="text-slate-900">{
                        activityLogs.filter(log => {
                          const query = logSearchQuery.toLowerCase();
                          const matchesSearch = 
                            log.userName.toLowerCase().includes(query) ||
                            log.userNik.toLowerCase().includes(query) ||
                            log.action.toLowerCase().includes(query) ||
                            log.description.toLowerCase().includes(query);
                          const matchesCategory = logSelectedCategory === 'all' || log.category === logSelectedCategory;
                          const matchesRole = logSelectedRole === 'all' || log.userRole === logSelectedRole;
                          return matchesSearch && matchesCategory && matchesRole;
                        }).length
                      }</strong> dari {activityLogs.length} log audit internal.
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const filtered = activityLogs.filter(log => {
                            const query = logSearchQuery.toLowerCase();
                            const matchesSearch = 
                              log.userName.toLowerCase().includes(query) ||
                              log.userNik.toLowerCase().includes(query) ||
                              log.action.toLowerCase().includes(query) ||
                              log.description.toLowerCase().includes(query);
                            const matchesCategory = logSelectedCategory === 'all' || log.category === logSelectedCategory;
                            const matchesRole = logSelectedRole === 'all' || log.userRole === logSelectedRole;
                            return matchesSearch && matchesCategory && matchesRole;
                          });
                          
                          const headers = 'ID,Timestamp,NIK,Nama,Jabatan,Kategori,Aksi,Deskripsi\n';
                          const csvContent = filtered.map(log => 
                            `"${log.id}","${log.timestamp}","${log.userNik}","${log.userName}","${log.userRole}","${log.category}","${log.action}","${log.description.replace(/"/g, '""')}"`
                          ).join('\n');
                          
                          const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.setAttribute('href', url);
                          link.setAttribute('download', `Log_Aktivitas_Koperasi_${new Date().toISOString().split('T')[0]}.csv`);
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          onAddNotification('File ekspor log aktivitas berhasil diunduh.', 'success');
                        }}
                        disabled={activityLogs.length === 0}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-3xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Unduh Laporan Audit (CSV)
                      </button>

                      {currentUser.role === 'admin_master' && (
                        <button
                          onClick={() => {
                            if (confirm('Apakah Anda yakin ingin menghapus seluruh log aktivitas saat ini untuk audit internal baru? Tindakan ini tidak dapat dibatalkan.')) {
                              onUpdateState({ activityLogs: [] });
                              onAddNotification('Seluruh log audit berhasil dibersihkan dari sistem.', 'info');
                            }
                          }}
                          disabled={activityLogs.length === 0}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 disabled:opacity-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Bersihkan Log
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Audit Logs Lists */}
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                  {activityLogs.filter(log => {
                    const query = logSearchQuery.toLowerCase();
                    const matchesSearch = 
                      log.userName.toLowerCase().includes(query) ||
                      log.userNik.toLowerCase().includes(query) ||
                      log.action.toLowerCase().includes(query) ||
                      log.description.toLowerCase().includes(query);
                    const matchesCategory = logSelectedCategory === 'all' || log.category === logSelectedCategory;
                    const matchesRole = logSelectedRole === 'all' || log.userRole === logSelectedRole;
                    return matchesSearch && matchesCategory && matchesRole;
                  }).length === 0 ? (
                    <div className="p-12 text-center space-y-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                        <History className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-900">Tidak ada log aktivitas ditemukan</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          Coba bersihkan kata kunci pencarian atau ganti filter kategori/jabatan pengurus Anda.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {activityLogs.filter(log => {
                        const query = logSearchQuery.toLowerCase();
                        const matchesSearch = 
                          log.userName.toLowerCase().includes(query) ||
                          log.userNik.toLowerCase().includes(query) ||
                          log.action.toLowerCase().includes(query) ||
                          log.description.toLowerCase().includes(query);
                        const matchesCategory = logSelectedCategory === 'all' || log.category === logSelectedCategory;
                        const matchesRole = logSelectedRole === 'all' || log.userRole === logSelectedRole;
                        return matchesSearch && matchesCategory && matchesRole;
                      }).map((log) => {
                        const getCategoryStyle = (cat: string) => {
                          switch (cat) {
                            case 'keuangan':
                              return 'bg-emerald-50 text-emerald-700 border-emerald-100';
                            case 'progja':
                              return 'bg-indigo-50 text-indigo-700 border-indigo-100';
                            case 'system':
                              return 'bg-amber-50 text-amber-700 border-amber-100';
                            default:
                              return 'bg-slate-100 text-slate-700 border-slate-200';
                          }
                        };

                        return (
                          <div key={log.id} className="p-4 sm:p-5 hover:bg-slate-50/50 transition-all text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            {/* Left Side: Author, Details & Action */}
                            <div className="flex items-start gap-3.5 max-w-3xl">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-extrabold text-slate-600 uppercase shrink-0">
                                {log.userName.charAt(0)}
                              </div>

                              <div className="space-y-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                  <span className="text-xs font-bold text-slate-900 truncate">
                                    {log.userName}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    (NIK: {log.userNik})
                                  </span>
                                  <span className="inline-block text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                                    {log.userRole.replace(/_/g, ' ')}
                                  </span>
                                </div>

                                <div className="space-y-0.5">
                                  <p className="text-xs font-semibold text-slate-900">
                                    {log.action}
                                  </p>
                                  <p className="text-xs text-slate-600 leading-relaxed break-words">
                                    {log.description}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 gap-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${getCategoryStyle(log.category)}`}>
                                {log.category === 'progja' ? 'Program Kerja' : log.category}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 font-bold">
                                {log.timestamp}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* 11. PANDUAN PENGGUNAAN */}
            {activeMenu === 'sheets_sync' && currentUser.role === 'admin_master' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                      <FileCheck2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Sinkronisasi Google Sheets</h3>
                      <p className="text-xs text-slate-500">Gunakan Google Sheets sebagai database cadangan dan untuk pelaporan real-time.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Status Koneksi</h4>
                        
                        {!googleAccessToken ? (
                          <button
                            onClick={() => onGoogleLogin()}
                            className="w-full py-3 bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                          >
                            <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                            Hubungkan Akun Google
                          </button>
                        ) : (
                          <div className="flex items-center justify-between p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-xs font-bold">Terhubung ke Google</span>
                            </div>
                            <button 
                              onClick={() => setGoogleAccessToken(null)}
                              className="text-[10px] underline cursor-pointer"
                            >
                              Putus
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Spreadsheet ID</label>
                        <input
                          type="text"
                          value={systemSettings.spreadsheetId || ''}
                          onChange={(e) => onUpdateState({ systemSettings: { ...systemSettings, spreadsheetId: e.target.value } })}
                          placeholder="Masukkan Spreadsheet ID (dari URL sheet)"
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden"
                        />
                        <p className="text-[10px] text-slate-400">Contoh: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms</p>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div>
                          <h4 className="text-xs font-bold text-slate-700">Auto-Sync Otomatis</h4>
                          <p className="text-[10px] text-slate-500">Sinkronkan data setiap ada perubahan.</p>
                        </div>
                        <button
                          onClick={() => onUpdateState({ systemSettings: { ...systemSettings, isSheetsSyncEnabled: !systemSettings.isSheetsSyncEnabled } })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-hidden ${
                            systemSettings.isSheetsSyncEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              systemSettings.isSheetsSyncEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <button
                        disabled={!googleAccessToken || !systemSettings.spreadsheetId || isSyncing}
                        onClick={() => googleAccessToken && systemSettings.spreadsheetId && onSyncNow(googleAccessToken, systemSettings.spreadsheetId)}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        {isSyncing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Sedang Menyinkronkan...
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-4 h-4" />
                            Sinkronkan Sekarang
                          </>
                        )}
                      </button>
                    </div>

                    <div className="bg-slate-900 rounded-3xl p-6 text-slate-300 space-y-4">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Info className="w-4 h-4 text-emerald-400" />
                        Cara Penggunaan
                      </h4>
                      <ol className="text-xs space-y-3 list-decimal list-inside text-slate-400 leading-relaxed">
                        <li>Buat Spreadsheet baru di Google Drive Anda.</li>
                        <li>Salin <span className="text-emerald-400 font-mono">ID Spreadsheet</span> dari URL browser Anda.</li>
                        <li>Tempelkan ID tersebut ke kolom di samping.</li>
                        <li>Klik "Hubungkan Akun Google" dan izinkan akses.</li>
                        <li>Klik "Sinkronkan Sekarang" untuk membuat tab data pertama kali.</li>
                        <li>Aktifkan "Auto-Sync" untuk pembaruan otomatis.</li>
                      </ol>
                      <div className="pt-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Penting</p>
                        <p className="text-[10px] leading-normal italic">Pastikan Anda memiliki izin edit pada spreadsheet yang dituju.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeMenu === 'panduan_penggunaan' && (
              <motion.div
                key="panduan_penggunaan"
                initial={{ opacity: 0, y: 15, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.985 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6 text-left"
              >
                {/* Header Banner */}
                <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-slate-800 relative overflow-hidden shadow-md">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl -translate-y-8 translate-x-8 pointer-events-none" />
                  <div className="relative z-10 space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 rounded-full text-indigo-300 text-[10px] font-bold border border-indigo-500/30 uppercase tracking-wider">
                      <Compass className="w-3.5 h-3.5" />
                      Pusat Informasi & Buku Panduan Pengurus
                    </div>
                    <h2 className="text-xl font-bold tracking-tight">Panduan Penggunaan Aplikasi Koperasi Digital</h2>
                    <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                      Selamat datang di Pusat Navigasi & Pembelajaran Koperasi Merah Putih Sejahtera. Halaman ini dirancang untuk memberikan penuntun taktis bagi setiap pengurus guna menjalankan fungsi manajerial dengan transparan, akurat, dan akuntabel.
                    </p>
                  </div>
                </div>

                {/* Personalized Guide for Active User */}
                <div className="bg-indigo-50/55 border border-indigo-100 rounded-2xl p-5 space-y-3 shadow-3xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
                        <Info className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">Panduan Kilat Khusus Peran Anda</h3>
                        <p className="text-[10px] text-indigo-800">
                          Halo, <span className="font-bold">{currentUser.name}</span>. Anda terdaftar sebagai <span className="font-bold uppercase text-indigo-600">{currentUser.role.replace(/_/g, ' ')}</span>
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-indigo-200/50 text-indigo-950 rounded-full text-[10px] font-black uppercase">
                      Aktif
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2.5">
                    {/* Step 1 */}
                    <div className="bg-white p-3.5 rounded-xl border border-indigo-100/40 shadow-3xs text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-950">
                        <span className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-black">1</span>
                        <span>
                          {currentUser.role === 'admin_master' && 'Kelola Kontrol Akses'}
                          {currentUser.role === 'ketua' && 'Tinjau Usulan Progja'}
                          {currentUser.role === 'pengawas' && 'Terbitkan Himbauan'}
                          {currentUser.role === 'bendahara' && 'Input Arus Keuangan'}
                          {currentUser.role === 'sekretaris' && 'Arsip Surat Resmi'}
                          {currentUser.role === 'wakil_ketua_usaha' && 'Input Program Usaha'}
                          {currentUser.role === 'wakil_ketua_anggota' && 'Input Program Anggota'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal pl-6">
                        {currentUser.role === 'admin_master' && 'Buka tab "Pengaturan Akses" untuk memberikan atau mencabut izin menu bagi pengurus.'}
                        {currentUser.role === 'ketua' && 'Buka tab "Sirkulasi Progja" untuk meninjau usulan draf program kerja yang diajukan.'}
                        {currentUser.role === 'pengawas' && 'Buka tab "Himbauan Pengawas" untuk menulis maklumat penting yang tampil di beranda publik.'}
                        {currentUser.role === 'bendahara' && 'Buka tab "Keuangan" untuk mencatat kas masuk atau kas keluar demi transparansi saldo.'}
                        {currentUser.role === 'sekretaris' && 'Buka tab "Administrasi" untuk mencatat surat keluar/masuk dalam buku agenda digital.'}
                        {currentUser.role === 'wakil_ketua_usaha' && 'Klik "Sirkulasi Progja" lalu klik "Tambah Progja Baru" untuk merancang agenda unit usaha.'}
                        {currentUser.role === 'wakil_ketua_anggota' && 'Klik "Sirkulasi Progja" lalu klik "Tambah Progja Baru" untuk merancang agenda pemberdayaan.'}
                      </p>
                    </div>

                    {/* Step 2 */}
                    <div className="bg-white p-3.5 rounded-xl border border-indigo-100/40 shadow-3xs text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-950">
                        <span className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-black">2</span>
                        <span>
                          {currentUser.role === 'admin_master' && 'Update Struktur Organisasi'}
                          {currentUser.role === 'ketua' && 'Pantau Rasio Kinerja'}
                          {currentUser.role === 'pengawas' && 'Audit Kas Koperasi'}
                          {currentUser.role === 'bendahara' && 'Kelola Dividen SHU'}
                          {currentUser.role === 'sekretaris' && 'Perbarui Data Koperasi'}
                          {currentUser.role === 'wakil_ketua_usaha' && 'Kelola Stok & Penjualan'}
                          {currentUser.role === 'wakil_ketua_anggota' && 'Monitor Keaktifan Anggota'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal pl-6">
                        {currentUser.role === 'admin_master' && 'Gunakan tab "Struktur & Anggota" untuk memperbarui biodata, nomor HP, dan NIK para pengurus.'}
                        {currentUser.role === 'ketua' && 'Monitor persentase keberhasilan per bidang langsung dari Dasbor utama sebagai bahan presentasi rapat.'}
                        {currentUser.role === 'pengawas' && 'Periksa seluruh histori transaksi keuangan di tab Keuangan agar sesuai dengan anggaran yang disepakati.'}
                        {currentUser.role === 'bendahara' && 'Buka tab "Keuangan" bagian SHU untuk memantau saldo total deviden yang dialokasikan bagi anggota.'}
                        {currentUser.role === 'sekretaris' && 'Gunakan tab "Biodata Koperasi" untuk memperbarui alamat, email, telepon, dan media sosial resmi.'}
                        {currentUser.role === 'wakil_ketua_usaha' && 'Buka tab "Gerai Koperasi" untuk memperbarui profit bulanan dan stok barang tiap outlet.'}
                        {currentUser.role === 'wakil_ketua_anggota' && 'Periksa struktur pengurus dan pastikan koordinasi komunikasi berjalan di tab Struktur.'}
                      </p>
                    </div>

                    {/* Step 3 */}
                    <div className="bg-white p-3.5 rounded-xl border border-indigo-100/40 shadow-3xs text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-950">
                        <span className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-black">3</span>
                        <span>
                          {currentUser.role === 'admin_master' && 'Simpan State Database'}
                          {currentUser.role === 'ketua' && 'Publikasikan Berita RAT'}
                          {currentUser.role === 'pengawas' && 'Berikan Catatan Pengawasan'}
                          {currentUser.role === 'bendahara' && 'Unggah Laporan Keuangan'}
                          {currentUser.role === 'sekretaris' && 'Upload Template Surat'}
                          {currentUser.role === 'wakil_ketua_usaha' && 'Unggah Bukti Pelaksanaan'}
                          {currentUser.role === 'wakil_ketua_anggota' && 'Unggah Bukti RAT'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal pl-6">
                        {currentUser.role === 'admin_master' && 'Klik tombol "Save State" di kanan atas setiap kali selesai mengedit database untuk menyimpan permanen.'}
                        {currentUser.role === 'ketua' && 'Kerjasamakan berita kegiatan resmi dengan Sekretaris untuk merilis dokumentasi ke halaman depan publik.'}
                        {currentUser.role === 'pengawas' && 'Gunakan catatan review atau kolom evaluasi pada setiap program kerja demi akuntabilitas.'}
                        {currentUser.role === 'bendahara' && 'Konfigurasikan file laporan bulanan di tab "File Download" untuk mempermudah pimpinan.'}
                        {currentUser.role === 'sekretaris' && 'Unggah file draf DOCX atau PDF di tab "File Download" menggunakan fitur drop file serbaguna.'}
                        {currentUser.role === 'wakil_ketua_usaha' && 'Buka detail program kerja di tab sirkulasi untuk mengunggah foto bukti realisasi anggaran.'}
                        {currentUser.role === 'wakil_ketua_anggota' && 'Buka detail progja untuk melampirkan deskripsi bukti keberhasilan kegiatan pemberdayaan.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tabs to select other roles' manuals */}
                <div className="space-y-4">
                  <div className="border-b border-slate-200 pb-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pilih Peran untuk Mempelajari Alur Kerja Pengurus Lainnya</h3>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {rolesList.map((roleObj) => (
                        <button
                          key={roleObj.value}
                          onClick={() => setSelectedGuideRole(roleObj.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                            selectedGuideRole === roleObj.value
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {roleObj.label.replace(' Koperasi', '')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual details container based on selectedGuideRole */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-900 text-white rounded-2xl">
                          {selectedGuideRole === 'admin_master' && <FolderLock className="w-5 h-5" />}
                          {selectedGuideRole === 'ketua' && <FileCheck2 className="w-5 h-5" />}
                          {selectedGuideRole === 'pengawas' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                          {selectedGuideRole === 'bendahara' && <Wallet className="w-5 h-5" />}
                          {selectedGuideRole === 'sekretaris' && <FileText className="w-5 h-5" />}
                          {selectedGuideRole === 'wakil_ketua_usaha' && <Store className="w-5 h-5" />}
                          {selectedGuideRole === 'wakil_ketua_anggota' && <Users className="w-5 h-5" />}
                        </div>
                        <div>
                          <h4 className="text-base font-extrabold text-slate-900">
                            Buku Panduan Operasional: {rolesList.find(r => r.value === selectedGuideRole)?.label}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Hak akses, wewenang kepengurusan, dan instruksi penugasan sistem koperasi digital.
                          </p>
                        </div>
                      </div>

                      {currentUser.role === selectedGuideRole && (
                        <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Ini Peran Anda Saat Ini
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      {/* Left side: Responsibilities (5 cols) */}
                      <div className="md:col-span-5 space-y-4">
                        <div className="space-y-2">
                          <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tanggung Jawab Utama</h5>
                          <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                            {selectedGuideRole === 'admin_master' && (
                              <>
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> <span>Mengontrol keamanan akun pengurus dan database.</span></li>
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> <span>Mengkonfigurasi pembatasan akses menu secara dinamis.</span></li>
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> <span>Menambahkan dan meregistrasi pengurus baru ke dalam basis data koperasi.</span></li>
                              </>
                            )}
                            {selectedGuideRole === 'ketua' && (
                              <>
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> <span>Menyetujui, menolak, atau mengembalikan usulan draf program kerja dengan catatan masukan yang konstruktif.</span></li>
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> <span>Memimpin rapat pleno evaluasi dengan memantau matrik pencapaian progja tiap staf.</span></li>
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> <span>Menandatangani kesahihan berkas laporan keuangan yang divalidasi.</span></li>
                              </>
                            )}
                            {selectedGuideRole === 'pengawas' && (
                              <>
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> <span>Melakukan pengawasan independen terhadap kepatuhan anggaran belanja program kerja.</span></li>
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> <span>Menerbitkan Himbauan Penting kepada publik untuk kepatuhan operasional pengurus.</span></li>
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> <span>Memberikan catatan verifikasi dalam proses sirkulasi program kerja koperasi.</span></li>
                              </>
                            )}
                            {selectedGuideRole === 'bendahara' && (
                              <>
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> <span>Membukukan seluruh dana transaksi kas masuk (simpanan, pendapatan usaha) dan kas keluar (belanja progja, operasional kantor).</span></li>
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> <span>Menghitung realisasi anggaran dan pembagian Sisa Hasil Usaha (SHU) secara proporsional.</span></li>
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> <span>Melaporkan kondisi likuiditas keuangan berkala kepada Ketua.</span></li>
                              </>
                            )}
                            {selectedGuideRole === 'sekretaris' && (
                              <>
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> <span>Mengelola ketatausahaan koperasi termasuk administrasi surat masuk dan surat keluar resmi.</span></li>
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> <span>Mengunggah dokumen dan template surat resmi di bank file koperasi.</span></li>
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> <span>Memperbarui biodata, koordinat GPS peta, dan kontak resmi koperasi.</span></li>
                              </>
                            )}
                            {selectedGuideRole === 'wakil_ketua_usaha' && (
                              <>
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> <span>Mempelopori dan mengusulkan draf program kerja khusus di sektor bisnis dan unit usaha mandiri koperasi.</span></li>
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> <span>Memonitor omzet penjualan bulanan, margin laba, dan kapasitas stok pada gerai-gerai koperasi.</span></li>
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> <span>Melaksanakan program kerja unit usaha yang disetujui serta melampirkan laporan realisasinya.</span></li>
                              </>
                            )}
                            {selectedGuideRole === 'wakil_ketua_anggota' && (
                              <>
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> <span>Mengusulkan program kerja di bidang pemberdayaan anggota (pelatihan, RAT, santunan, dsb).</span></li>
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> <span>Memastikan aspirasi anggota terakomodasi dalam sirkulasi penyusunan draf program kerja koperasi.</span></li>
                                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> <span>Mendampingi pelaksanaan RAT dan program kesejahteraan sosial anggota.</span></li>
                              </>
                            )}
                          </ul>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Akses Menu Default</h5>
                          <div className="flex flex-wrap gap-1">
                            {selectedGuideRole === 'admin_master' ? (
                              <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded-md font-bold uppercase">AKSES PENUH (ALL MODULES)</span>
                            ) : (
                              <>
                                {roleAccess[selectedGuideRole]?.dashboard_pengurus && <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-medium">Dasbor Utama</span>}
                                {roleAccess[selectedGuideRole]?.sirkulasi_prokja && <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-medium">Sirkulasi Progja</span>}
                                {roleAccess[selectedGuideRole]?.keuangan && <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-medium">Keuangan</span>}
                                {roleAccess[selectedGuideRole]?.anggota && <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-medium">Struktur & Anggota</span>}
                                {roleAccess[selectedGuideRole]?.file_download && <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-medium">File Download</span>}
                                {roleAccess[selectedGuideRole]?.biodata_koperasi && <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-medium">Biodata Koperasi</span>}
                                {roleAccess[selectedGuideRole]?.himbauan && <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-medium">Himbauan Pengawas</span>}
                                {roleAccess[selectedGuideRole]?.gerai && <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-medium">Gerai Koperasi</span>}
                                {roleAccess[selectedGuideRole]?.administrasi_koperasi && <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-medium">Administrasi Koperasi</span>}
                              </>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400">
                            * Hak akses di atas dapat disesuaikan secara dinamis oleh Admin Master melalui tab Pengaturan Akses.
                          </p>
                        </div>
                      </div>

                      {/* Right side: Detailed operational workflows (7 cols) */}
                      <div className="md:col-span-7 bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-4">
                        <h5 className="text-xs font-black text-slate-950 uppercase tracking-wider flex items-center gap-1">
                          <Compass className="w-4 h-4 text-indigo-600" />
                          Alur Kerja & Operasional Sistem Terpadu
                        </h5>

                        <div className="space-y-4 text-xs">
                          {selectedGuideRole === 'admin_master' && (
                            <div className="space-y-3 pl-3 border-l-2 border-indigo-600">
                              <div className="space-y-1">
                                <p className="font-bold text-slate-900">1. Pengaturan Hak Akses Modular</p>
                                <p className="text-slate-600">Admin memantau tab "Pengaturan Akses" dan secara real-time dapat menandai kotak akses. Hal ini membatasi navigasi sidebar pengurus lain agar mereka fokus pada ranah kerjanya.</p>
                              </div>
                              <div className="space-y-1">
                                <p className="font-bold text-slate-900">2. Registrasi NIK Baru</p>
                                <p className="text-slate-600">Buka menu "Struktur & Anggota". Masukkan nama pengurus, posisi, nomor HP, dan buatkan NIK unik. Beritahu pengurus tersebut untuk mengaktifkan akunnya lewat menu login.</p>
                              </div>
                              <div className="space-y-1">
                                <p className="font-bold text-slate-900">3. Menjaga Keutuhan Saldo State</p>
                                <p className="text-slate-600">Ketika melakukan perubahan krusial, klik tombol hijau "Save State" di sudut kanan atas agar seluruh histori program kerja, surat menyurat, dan data kas ter-sync ke database lokal browser Anda secara permanen.</p>
                              </div>
                            </div>
                          )}

                          {selectedGuideRole === 'ketua' && (
                            <div className="space-y-3 pl-3 border-l-2 border-indigo-600">
                              <div className="space-y-1">
                                <p className="font-bold text-slate-900">1. Alur Persetujuan Program Kerja (Progja Approval)</p>
                                <p className="text-slate-600">Buka tab "Sirkulasi Progja". Di sini Anda akan melihat usulan pengurus berstatus <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded font-bold">DIAJUKAN</span>. Klik usulan tersebut, tinjau rencana anggaran, deskripsi, dan target tanggal pelaksanaannya.</p>
                              </div>
                              <div className="space-y-1">
                                <p className="font-bold text-slate-900">2. Memberikan Keputusan (Setuju / Tolak / Minta Revisi)</p>
                                <p className="text-slate-600">Isi kolom masukan / catatan Anda. Klik "Setujui Program Kerja" untuk meloloskan anggaran, atau "Minta Revisi" agar PIC pengurus dapat mengedit drafnya kembali sebelum diajukan ulang.</p>
                              </div>
                              <div className="space-y-1">
                                <p className="font-bold text-slate-900">3. Memantau Pertanggungjawaban (Publikasi)</p>
                                <p className="text-slate-600">Setelah progja berstatus <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded font-bold">DILAKSANAKAN</span> dan PIC mengunggah bukti laporan, lakukan verifikasi akhir. Klik "Publikasikan ke Publik" untuk menayangkan laporan tersebut ke beranda umum agar anggota koperasi memantau kinerja pengurus.</p>
                              </div>
                            </div>
                          )}

                          {selectedGuideRole === 'pengawas' && (
                            <div className="space-y-3 pl-3 border-l-2 border-indigo-600">
                              <div className="space-y-1">
                                <p className="font-bold text-slate-900">1. Pengawasan Anggaran Terbuka</p>
                                <p className="text-slate-600">Pengawas memiliki akses mandiri ke menu Sirkulasi Progja dan Keuangan. Bandingkan saldo anggaran terencana dengan saldo terpakai (realisasi) agar tidak terjadi over-budget.</p>
                              </div>
                              <div className="space-y-1">
                                <p className="font-bold text-slate-900">2. Menerbitkan Maklumat / Himbauan Mendesak</p>
                                <p className="text-slate-600">Buka menu "Himbauan Pengawas". Masukkan materi instruksi, lalu pilih tanggal kedaluwarsa pemberitahuan. Klik simpan. Maklumat ini otomatis terbit sebagai banner merah/kuning di atas halaman utama publik.</p>
                              </div>
                              <div className="space-y-1">
                                <p className="font-bold text-slate-900">3. Rekomendasi Audit Pleno</p>
                                <p className="text-slate-600">Sebelum rapat tahunan, pengawas mengevaluasi rasio keberhasilan progja di dasbor utama untuk merumuskan penilaian kinerja kepengurusan.</p>
                              </div>
                            </div>
                          )}

                          {selectedGuideRole === 'bendahara' && (
                            <div className="space-y-3 pl-3 border-l-2 border-indigo-600">
                              <div className="space-y-1">
                                <p className="font-bold text-slate-900">1. Pencatatan Transaksi Kas Masuk & Keluar</p>
                                <p className="text-slate-600">Buka tab "Keuangan" lalu klik "Input Transaksi Baru". Pilih jenis transaksi (Kas Masuk untuk simpanan/keuntungan gerai, Kas Keluar untuk belanja kegiatan). Tentukan nominal angka dan deskripsi yang detail.</p>
                              </div>
                              <div className="space-y-1">
                                <p className="font-bold text-slate-900">2. Sinkronisasi Anggaran Program Kerja</p>
                                <p className="text-slate-600">Apabila Ketua menyetujui program kerja baru, saldo anggaran belanja akan otomatis terakumulasi. Lakukan sinkronisasi pencatatan kas keluar saat PIC program mengajukan pencairan dana.</p>
                              </div>
                              <div className="space-y-1">
                                <p className="font-bold text-slate-900">3. Pengaturan SHU & Dividen</p>
                                <p className="text-slate-600">Pantau akumulasi keuntungan bersih bulanan koperasi di widget Sisa Hasil Usaha (SHU) agar kalkulasi dividen anggota di akhir tahun buku akurat dan tepat waktu.</p>
                              </div>
                            </div>
                          )}

                          {selectedGuideRole === 'sekretaris' && (
                            <div className="space-y-3 pl-3 border-l-2 border-indigo-600">
                              <div className="space-y-1">
                                <p className="font-bold text-slate-900">1. Kearsipan Surat Resmi (Buku Agenda Digital)</p>
                                <p className="text-slate-600">Buka menu "Administrasi". Klik "Registrasikan Surat Baru", pilih kategori Surat Masuk atau Surat Keluar. Lengkapi nomor surat, perihal, dan tanggal surat guna kerapian korespondensi.</p>
                              </div>
                              <div className="space-y-1">
                                <p className="font-bold text-slate-900">2. Penyediaan Berkas & Template Dokumen</p>
                                <p className="text-slate-600">Buka tab "File Download". Tarik dan lepaskan berkas (PDF, DOCX) langsung ke kotak drag-and-drop, atau klik untuk memilih file di komputer Anda. Berkas ini akan langsung dapat diunduh oleh seluruh pengurus lain.</p>
                              </div>
                              <div className="space-y-1">
                                <p className="font-bold text-slate-900">3. Pengelolaan Data Identitas Koperasi</p>
                                <p className="text-slate-600">Pada tab "Biodata Koperasi", lakukan pengeditan alamat domisili, email operasional, telepon, atau link sosial media resmi koperasi guna keselarasan informasi publik.</p>
                              </div>
                            </div>
                          )}

                          {selectedGuideRole === 'wakil_ketua_usaha' && (
                            <div className="space-y-3 pl-3 border-l-2 border-indigo-600">
                              <div className="space-y-1">
                                <p className="font-bold text-slate-900">1. Pembuatan Proposal Draf & Form Program Kerja</p>
                                <p className="text-slate-600">Buka tab "Sirkulasi Progja". Klik "Tambah Progja Baru". Isi field terstruktur: Judul Program, Bidang (pilih Unit Usaha), Tanggal Pelaksanaan, Estimasi Anggaran, dan Deskripsi Rencana. Simpan sebagai draf.</p>
                              </div>
                              <div className="space-y-1">
                                <p className="font-bold text-slate-900">2. Pengeditan Draf & Pengajuan ke Ketua</p>
                                <p className="text-slate-600">Anda dapat meluangkan waktu mengedit draf berstatus <span className="px-1.5 py-0.2 bg-slate-200 text-slate-800 rounded font-bold">DRAFT</span> kapan saja. Setelah draf final, klik opsi "Ajukan ke Ketua" agar usulan tersebut masuk ke antrean review Ketua Koperasi.</p>
                              </div>
                              <div className="space-y-1">
                                <p className="font-bold text-slate-900">3. Pelaporan Kinerja Gerai Usaha Koperasi</p>
                                <p className="text-slate-600">Buka tab "Gerai Koperasi" untuk memperbarui data omzet laba bersih, stok pergudangan gerai sembako, atau outlet ritel koperasi demi transparansi bisnis.</p>
                              </div>
                            </div>
                          )}

                          {selectedGuideRole === 'wakil_ketua_anggota' && (
                            <div className="space-y-3 pl-3 border-l-2 border-indigo-600">
                              <div className="space-y-1">
                                <p className="font-bold text-slate-900">1. Perencanaan Agenda Pemberdayaan Anggota</p>
                                <p className="text-slate-600">Buka tab "Sirkulasi Progja". Buat program kerja bertema kesejahteraan, penyuluhan, atau pelaksanaan Rapat Anggota Tahunan (RAT) untuk diserahkan ke Ketua Koperasi.</p>
                              </div>
                              <div className="space-y-1">
                                <p className="font-bold text-slate-900">2. Kolaborasi Program Lintas Sektoral</p>
                                <p className="text-slate-600">Tentukan bidang kolaborator (seperti Bendahara atau Sekretaris) saat merancang program kerja agar koordinasi kepengurusan tercatat secara tertulis sejak awal pembuatan draf.</p>
                              </div>
                              <div className="space-y-1">
                                <p className="font-bold text-slate-900">3. Upload Bukti Pelaksanaan & Sukses Rate</p>
                                <p className="text-slate-600">Setelah program kerja disetujui dan selesai terlaksana, buka detail progja lalu lampirkan deskripsi realisasi beserta link bukti laporan agar tingkat keberhasilan (success rate) Anda meningkat.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cooperative Principles of Transparency */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 text-center">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                    <span className="text-2xl">🤝</span>
                    <h5 className="text-xs font-bold text-slate-950">1. Akuntabilitas Penuh</h5>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Setiap rupiah anggaran program kerja yang disetujui wajib memiliki dokumentasi deskripsi realisasi demi pertanggungjawaban rapat tahunan.
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                    <span className="text-2xl">🔎</span>
                    <h5 className="text-xs font-bold text-slate-950">2. Keterbukaan Publik</h5>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Program kerja yang telah divalidasi Ketua akan langsung terpublish ke portal umum, memangkas kecurigaan dan meningkatkan kepercayaan anggota.
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                    <span className="text-2xl">📝</span>
                    <h5 className="text-xs font-bold text-slate-950">3. Jejak Digital Tertulis</h5>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Proses pengusulan, revisi draf, komentar ketua, pengarsipan surat-menyurat, serta transaksi kas tersimpan rapi dan bebas manipulasi.
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                    <span className="text-2xl">🛡️</span>
                    <h5 className="text-xs font-bold text-slate-950">4. Pengawasan Kolektif</h5>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Pengawas koperasi memiliki hak audit saldo kas secara mandiri dan dapat menerbitkan Himbauan Darurat sewaktu-waktu di beranda utama.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
