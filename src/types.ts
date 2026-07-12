export type Role =
  | 'admin_master'
  | 'pengawas'
  | 'ketua'
  | 'bendahara'
  | 'wakil_ketua_anggota'
  | 'wakil_ketua_usaha'
  | 'sekretaris';

export interface User {
  nik: string;
  name: string;
  role: Role;
  password?: string; // Empty if not registered yet
  isRegistered: boolean;
  photoUrl?: string;
}

export type ProgjaStatus =
  | 'DRAFT'
  | 'DIAJUKAN'
  | 'REVISI'
  | 'DISETUJUI'
  | 'DILAKSANAKAN'
  | 'MENUNGGU_VALIDASI'
  | 'DIPUBLIKASIKAN';

export interface SubTask {
  id: string;
  title: string;
  assignedToNik: string;
  assignedToName: string;
  assignedToRole: Role;
  isDone: boolean;
  dueDate?: string;
}

export interface Progja {
  id: string;
  title: string;
  picNik: string;
  picName: string;
  picRole: Role;
  sector: string;
  targetDate: string;
  budget: number;
  fundingSource: string;
  indicators: string;
  description: string;
  collaborators: Role[]; // Collaborating roles
  status: ProgjaStatus;
  notesFromKetua?: string;
  proofPhoto?: string; // Base64 or mock image URL
  proofGallery?: string[]; // Multiple photos/URLs for gallery
  proofDescription?: string;
  proofReport?: string;
  createdAt: string;
  updatedAt: string;
  subTasks?: SubTask[];
}

export interface News {
  id: string;
  title: string;
  content: string;
  photo: string;
  date: string; // YYYY-MM-DD
  shares: number;
  likes: number;
}

export interface Himbauan {
  id: string;
  content: string;
  senderName: string;
  senderRole: Role;
  date: string;
  endDate: string; // notifications end after this date
}

export interface KeuanganTransaction {
  id: string;
  type: 'IN' | 'OUT';
  category: string;
  amount: number;
  description: string;
  date: string;
  requester: string;
}

export interface PendingKeuanganTransaction {
  id: string;
  type: 'IN' | 'OUT';
  category: string;
  amount: number;
  description: string;
  date: string;
  requesterNik: string;
  requesterName: string;
  requesterRole: Role;
  status: 'MENUNGGU_PERSETUJUAN' | 'DISETUJUI' | 'DITOLAK';
  notes?: string;
  targetTxId?: string; // If this is an EDIT/HAPUS proposal for an existing transaction
  changeType: 'BARU' | 'EDIT' | 'HAPUS';
}

export interface KeuanganState {
  totalCash: number;
  totalSHU: number;
  budgetPlanned: number;
  budgetUsed: number;
  transactions: KeuanganTransaction[];
  pendingTransactions?: PendingKeuanganTransaction[];
}

export interface GeraiOutlet {
  id: string;
  name: string;
  location: string;
  sales: number;
  profit: number;
  stock: number;
}

export interface KoperasiBiodata {
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  email: string;
  facebook: string;
  instagram: string;
  twitter: string;
  youtube: string;
  profilePhoto: string;
}

export interface OrgMember {
  id: string;
  name: string;
  role: Role;
  nik: string;
  photoUrl: string;
  phone: string;
}

export interface SystemSettings {
  alertDaysBefore: number; // default 5 days
  spreadsheetId?: string;
  isSheetsSyncEnabled?: boolean;
}

export interface RoleAccess {
  dashboard_pengurus: boolean;
  sirkulasi_prokja: boolean;
  keuangan: boolean;
  anggota: boolean;
  file_download: boolean;
  biodata_koperasi: boolean;
  himbauan: boolean;
  pengaturan_theme: boolean;
  administrasi_koperasi: boolean;
  gerai: boolean;
  akses: boolean;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userNik: string;
  userName: string;
  userRole: Role;
  category: 'progja' | 'keuangan' | 'auth' | 'system';
  action: string;
  description: string;
}

export type VoteType = 'SETUJU' | 'TOLAK' | 'ABSTAIN';

export interface VotingItem {
  id: string;
  title: string;
  type: 'PROGJA' | 'AGENDA';
  description: string;
  targetId?: string; // Optional reference to an actual Progja id
  votes: Record<string, VoteType>; // maps userNik to their vote choice
  createdAt: string;
  endDate: string;
  createdByNik: string;
  createdByName: string;
  createdByRole: Role;
}


