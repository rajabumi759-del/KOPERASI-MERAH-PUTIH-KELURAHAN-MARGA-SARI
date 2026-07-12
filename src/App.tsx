import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import {
  Building2,
  Clock,
  LogIn,
  LayoutDashboard,
  LogOut,
  Bell,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  UserCheck,
  X,
  FileCheck2,
  Heart,
  ExternalLink,
} from 'lucide-react';

import {
  Role,
  User as UserType,
  Progja,
  News,
  Himbauan,
  KeuanganState,
  GeraiOutlet,
  KoperasiBiodata,
  OrgMember,
  SystemSettings,
  RoleAccess,
  ActivityLog,
  VotingItem,
} from './types';

import {
  INITIAL_BIODATA,
  INITIAL_USERS,
  INITIAL_ORG_MEMBERS,
  INITIAL_PROGJA,
  INITIAL_NEWS,
  INITIAL_HIMBAUAN,
  INITIAL_KEUANGAN,
  INITIAL_GERAI,
  DEFAULT_ROLE_ACCESS,
  INITIAL_SYSTEM_SETTINGS,
  INITIAL_FILES,
  INITIAL_ADMINISTRASI,
  INITIAL_LOGS,
  INITIAL_VOTING,
} from './initialData';

import PortalPublik from './components/PortalPublik';
import DasborPengurus from './components/DasborPengurus';

export default function App() {
  // -----------------------------------------------------
  // MAIN PERSISTENT APP STATE
  // -----------------------------------------------------
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [activeView, setActiveView] = useState<'PUBLIC' | 'LOGIN' | 'DASHBOARD'>('PUBLIC');

  // App databases
  const [biodata, setBiodata] = useState<KoperasiBiodata>(INITIAL_BIODATA);
  const [newsList, setNewsList] = useState<News[]>(INITIAL_NEWS);
  const [progjaList, setProgjaList] = useState<Progja[]>(INITIAL_PROGJA);
  const [himbauanList, setHimbauanList] = useState<Himbauan[]>(INITIAL_HIMBAUAN);
  const [keuangan, setKeuangan] = useState<KeuanganState>(INITIAL_KEUANGAN);
  const [geraiList, setGeraiList] = useState<GeraiOutlet[]>(INITIAL_GERAI);
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>(INITIAL_ORG_MEMBERS);
  const [roleAccess, setRoleAccess] = useState<Record<Role, RoleAccess>>(DEFAULT_ROLE_ACCESS);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(INITIAL_SYSTEM_SETTINGS);
  const [filesList, setFilesList] = useState<any[]>(INITIAL_FILES);
  const [administrasiList, setAdministrasiList] = useState<any[]>(INITIAL_ADMINISTRASI);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(INITIAL_LOGS);
  const [votingList, setVotingList] = useState<VotingItem[]>(INITIAL_VOTING);
  
  // Users base (holds passwords after sign up)
  const [usersBase, setUsersBase] = useState<UserType[]>(INITIAL_USERS);

  // Routing & Editing from Portal Publik
  const [autoSelectProgjaId, setAutoSelectProgjaId] = useState<string | null>(null);
  const [autoSelectVotingId, setAutoSelectVotingId] = useState<string | null>(null);

  // UI States
  const [notifications, setNotifications] = useState<Array<{ id: string; content: string; type: string }>>([]);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setGoogleAccessToken(tokenResponse.access_token);
      addNotification('Koneksi Google berhasil!', 'success');
    },
    onError: () => addNotification('Koneksi Google gagal.', 'warning'),
    scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file'
  });

  // Login & Registration Inputs State
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loginNik, setLoginNik] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Sign Up / Activation inputs
  const [registerNik, setRegisterNik] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [activatedUser, setActivatedUser] = useState<UserType | null>(null);

  // -----------------------------------------------------
  // LOAD & SAVE PERSISTENT DATA (LOCAL STORAGE)
  // -----------------------------------------------------
  useEffect(() => {
    // Sync digital clock every second
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' WIB'
      );
    }, 1000);

    // Initial load from localStorage
    try {
      const storedBiodata = localStorage.getItem('koperasi_biodata');
      const storedNews = localStorage.getItem('koperasi_news');
      const storedProgja = localStorage.getItem('koperasi_progja');
      const storedHimbauan = localStorage.getItem('koperasi_himbauan');
      const storedKeuangan = localStorage.getItem('koperasi_keuangan');
      const storedGerai = localStorage.getItem('koperasi_gerai');
      const storedMembers = localStorage.getItem('koperasi_members');
      const storedAccess = localStorage.getItem('koperasi_access');
      const storedSettings = localStorage.getItem('koperasi_settings');
      const storedFiles = localStorage.getItem('koperasi_files');
      const storedAdmin = localStorage.getItem('koperasi_admin');
      const storedUsersBase = localStorage.getItem('koperasi_users_base');
      const storedLogs = localStorage.getItem('koperasi_logs');
      const storedVoting = localStorage.getItem('koperasi_voting');
      const storedCurrentUser = localStorage.getItem('koperasi_current_user');

      if (storedBiodata) setBiodata(JSON.parse(storedBiodata));
      if (storedNews) setNewsList(JSON.parse(storedNews));
      if (storedProgja) setProgjaList(JSON.parse(storedProgja));
      if (storedHimbauan) setHimbauanList(JSON.parse(storedHimbauan));
      if (storedKeuangan) setKeuangan(JSON.parse(storedKeuangan));
      if (storedGerai) setGeraiList(JSON.parse(storedGerai));
      if (storedMembers) setOrgMembers(JSON.parse(storedMembers));
      if (storedAccess) setRoleAccess(JSON.parse(storedAccess));
      if (storedSettings) setSystemSettings(JSON.parse(storedSettings));
      if (storedFiles) setFilesList(JSON.parse(storedFiles));
      if (storedAdmin) setAdministrasiList(JSON.parse(storedAdmin));
      if (storedUsersBase) setUsersBase(JSON.parse(storedUsersBase));
      if (storedLogs) setActivityLogs(JSON.parse(storedLogs));
      if (storedVoting) setVotingList(JSON.parse(storedVoting));
      
      if (storedCurrentUser) {
        const u = JSON.parse(storedCurrentUser);
        setCurrentUser(u);
        setActiveView('DASHBOARD');
      }
    } catch (e) {
      console.error('Gagal memuat database lokal koperasi:', e);
    }

    return () => clearInterval(interval);
  }, []);

  // Sync to local storage on any state change
  const saveAppState = (updatedData: Partial<{
    biodata: KoperasiBiodata;
    newsList: News[];
    progjaList: Progja[];
    himbauanList: Himbauan[];
    keuangan: KeuanganState;
    geraiList: GeraiOutlet[];
    orgMembers: OrgMember[];
    roleAccess: Record<Role, RoleAccess>;
    systemSettings: SystemSettings;
    filesList: any[];
    administrasiList: any[];
    usersBase: UserType[];
    activityLogs: ActivityLog[];
    votingList: VotingItem[];
  }>) => {
    try {
      if (updatedData.biodata) {
        setBiodata(updatedData.biodata);
        localStorage.setItem('koperasi_biodata', JSON.stringify(updatedData.biodata));
      }
      if (updatedData.newsList) {
        setNewsList(updatedData.newsList);
        localStorage.setItem('koperasi_news', JSON.stringify(updatedData.newsList));
      }
      if (updatedData.progjaList) {
        setProgjaList(updatedData.progjaList);
        localStorage.setItem('koperasi_progja', JSON.stringify(updatedData.progjaList));
      }
      if (updatedData.himbauanList) {
        setHimbauanList(updatedData.himbauanList);
        localStorage.setItem('koperasi_himbauan', JSON.stringify(updatedData.himbauanList));
      }
      if (updatedData.keuangan) {
        setKeuangan(updatedData.keuangan);
        localStorage.setItem('koperasi_keuangan', JSON.stringify(updatedData.keuangan));
      }
      if (updatedData.geraiList) {
        setGeraiList(updatedData.geraiList);
        localStorage.setItem('koperasi_gerai', JSON.stringify(updatedData.geraiList));
      }
      if (updatedData.orgMembers) {
        setOrgMembers(updatedData.orgMembers);
        localStorage.setItem('koperasi_members', JSON.stringify(updatedData.orgMembers));
      }
      if (updatedData.roleAccess) {
        setRoleAccess(updatedData.roleAccess);
        localStorage.setItem('koperasi_access', JSON.stringify(updatedData.roleAccess));
      }
      if (updatedData.systemSettings) {
        setSystemSettings(updatedData.systemSettings);
        localStorage.setItem('koperasi_settings', JSON.stringify(updatedData.systemSettings));
      }
      if (updatedData.filesList) {
        setFilesList(updatedData.filesList);
        localStorage.setItem('koperasi_files', JSON.stringify(updatedData.filesList));
      }
      if (updatedData.administrasiList) {
        setAdministrasiList(updatedData.administrasiList);
        localStorage.setItem('koperasi_admin', JSON.stringify(updatedData.administrasiList));
      }
      if (updatedData.usersBase) {
        setUsersBase(updatedData.usersBase);
        localStorage.setItem('koperasi_users_base', JSON.stringify(updatedData.usersBase));
      }
      if (updatedData.activityLogs) {
        setActivityLogs(updatedData.activityLogs);
        localStorage.setItem('koperasi_logs', JSON.stringify(updatedData.activityLogs));
      }
      if (updatedData.votingList) {
        setVotingList(updatedData.votingList);
        localStorage.setItem('koperasi_voting', JSON.stringify(updatedData.votingList));
      }
    } catch (e) {
      console.error('Gagal menulis database lokal koperasi:', e);
    }
  };

  // -----------------------------------------------------
  // NOTIFICATION TOASTER UTILITY
  // -----------------------------------------------------
  const addNotification = (content: string, type: 'success' | 'warning' | 'info' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications((prev) => [...prev, { id, content, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4500);
  };

  // -----------------------------------------------------
  // AUTHENTICATION & LOGIN PROCESS
  // -----------------------------------------------------

  // Login Handler (Supports 'ardi' bypass and registered NIK keys)
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginNik || !loginPassword) {
      addNotification('Mohon masukkan NIK/Username dan Password.', 'warning');
      return;
    }

    // Bypass option for admin master (ardi / ardi)
    if (loginNik.toLowerCase() === 'ardi' && loginPassword === 'ardi') {
      const adminUser: UserType = {
        nik: 'admin_master_001',
        name: 'Ardi (Admin Master)',
        role: 'admin_master',
        isRegistered: true,
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
      };
      setCurrentUser(adminUser);
      localStorage.setItem('koperasi_current_user', JSON.stringify(adminUser));
      setActiveView('DASHBOARD');
      addNotification('Selamat datang kembali, Admin Master Ardi!', 'success');
      setLoginNik('');
      setLoginPassword('');
      return;
    }

    // Search inside database users base
    const user = usersBase.find((u) => u.nik === loginNik);
    if (!user) {
      addNotification('NIK tidak terdaftar dalam database kepengurusan.', 'warning');
      return;
    }

    if (!user.isRegistered || !user.password) {
      addNotification('NIK terdaftar, namun password belum diaktivasi. Silakan klik menu Aktivasi Password Baru di bawah.', 'warning');
      return;
    }

    if (user.password !== loginPassword) {
      addNotification('Password yang dimasukkan tidak sesuai.', 'warning');
      return;
    }

    // Success login
    setCurrentUser(user);
    localStorage.setItem('koperasi_current_user', JSON.stringify(user));
    setActiveView('DASHBOARD');
    addNotification(`Selamat datang kembali, ${user.name}!`, 'success');
    setLoginNik('');
    setLoginPassword('');
  };

  // Registration/Activation NIK checking
  const handleCheckNikForRegistration = () => {
    if (!registerNik) {
      addNotification('Masukkan NIK yang terdaftar terlebih dahulu.', 'warning');
      return;
    }

    const user = usersBase.find((u) => u.nik === registerNik);
    if (!user) {
      addNotification('NIK tidak ditemukan dalam daftar pengurus terdaftar oleh Admin Master.', 'warning');
      setActivatedUser(null);
      return;
    }

    if (user.isRegistered) {
      addNotification('NIK ini sudah pernah didaftarkan dan diaktifkan sebelumnya.', 'info');
    }
    setActivatedUser(user);
  };

  // Save new password for NIK
  const handleActivatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activatedUser) return;

    if (!regPassword || !regConfirmPassword) {
      addNotification('Mohon lengkapi pengisian password baru.', 'warning');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      addNotification('Password konfirmasi tidak sesuai.', 'warning');
      return;
    }

    // Update database
    const updatedUsers = usersBase.map((u) => {
      if (u.nik === activatedUser.nik) {
        return {
          ...u,
          password: regPassword,
          isRegistered: true,
        };
      }
      return u;
    });

    saveAppState({ usersBase: updatedUsers });
    addNotification(`Aktivasi password untuk ${activatedUser.name} berhasil! Silakan masuk menggunakan password baru.`, 'success');
    
    // Reset register screen
    setRegisterNik('');
    setRegPassword('');
    setRegConfirmPassword('');
    setActivatedUser(null);
    setIsRegisterMode(false);
  };

  const handleEditProgjaFromPortal = (id: string) => {
    setAutoSelectProgjaId(id);
    if (currentUser) {
      setActiveView('DASHBOARD');
    } else {
      setActiveView('LOGIN');
      addNotification('Silakan login terlebih dahulu untuk mengedit Program Kerja.', 'info');
    }
  };

  const handleEditVotingFromPortal = (id: string) => {
    setAutoSelectVotingId(id);
    if (currentUser) {
      setActiveView('DASHBOARD');
    } else {
      setActiveView('LOGIN');
      addNotification('Silakan login terlebih dahulu untuk mengedit Konsensus / Voting.', 'info');
    }
  };

  // Sign out
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('koperasi_current_user');
    setActiveView('PUBLIC');
    addNotification('Anda berhasil keluar dari sistem.', 'info');
  };

  // -----------------------------------------------------
  // NEWS INTERACTION SIMULATIONS
  // -----------------------------------------------------
  const handleNewsShare = (id: string) => {
    const updated = newsList.map((n) => {
      if (n.id === id) {
        return { ...n, shares: n.shares + 1 };
      }
      return n;
    });
    saveAppState({ newsList: updated });
  };

  const handleNewsLike = (id: string) => {
    const updated = newsList.map((n) => {
      if (n.id === id) {
        return { ...n, likes: n.likes + 1 };
      }
      return n;
    });
    saveAppState({ newsList: updated });
    addNotification('Anda menyukai berita ini!', 'success');
  };

  // -----------------------------------------------------
  // GOOGLE SHEETS SYNC LOGIC
  // -----------------------------------------------------
  const syncDataToSheets = async (token: string, sid: string) => {
    setIsSyncing(true);
    try {
      const dataToSync = {
        Biodata: [
          ['Name', 'Address', 'Phone', 'Email', 'Facebook', 'Instagram', 'Twitter', 'Youtube'],
          [biodata.name, biodata.address, biodata.phone, biodata.email, biodata.facebook, biodata.instagram, biodata.twitter, biodata.youtube]
        ],
        Progja: [
          ['ID', 'Title', 'PIC', 'Sector', 'Target Date', 'Budget', 'Status'],
          ...progjaList.map(p => [p.id, p.title, p.picName, p.sector, p.targetDate, p.budget, p.status])
        ],
        Keuangan: [
          ['ID', 'Type', 'Category', 'Amount', 'Description', 'Date', 'Requester'],
          ...keuangan.transactions.map(t => [t.id, t.type, t.category, t.amount, t.description, t.date, t.requester])
        ],
        News: [
          ['ID', 'Title', 'Date', 'Likes', 'Shares'],
          ...newsList.map(n => [n.id, n.title, n.date, n.likes, n.shares])
        ],
        Members: [
          ['ID', 'Name', 'Role', 'NIK', 'Phone'],
          ...orgMembers.map(m => [m.id, m.name, m.role, m.nik, m.phone])
        ]
      };

      const response = await fetch('/api/sheets/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          spreadsheetId: sid,
          data: dataToSync
        })
      });

      if (!response.ok) throw new Error('Gagal sinkronisasi ke Google Sheets');
      addNotification('Data berhasil disinkronkan ke Google Sheets!', 'success');
    } catch (error: any) {
      console.error(error);
      addNotification('Gagal sinkronisasi: ' + error.message, 'warning');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdatePartialState = (newState: any) => {
    saveAppState(newState);
    
    // Auto-sync if enabled
    if (systemSettings.isSheetsSyncEnabled && systemSettings.spreadsheetId && googleAccessToken) {
      syncDataToSheets(googleAccessToken, systemSettings.spreadsheetId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased flex flex-col justify-between">
      
      {/* GLOBAL HEADER & NAVIGATION NAVBAR */}
      <header className="sticky top-0 z-40 bg-red-700 border-b border-red-800 px-4 sm:px-6 lg:px-8 py-3.5 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo & title brand - Merah Putih style */}
          <div
            onClick={() => setActiveView('PUBLIC')}
            className="flex items-center gap-3 cursor-pointer text-left group animate-fade-in"
          >
            <div className="p-2 bg-white text-red-700 rounded-2xl shadow-sm group-hover:scale-105 transition-transform flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-tight uppercase font-display">
                Koperasi Merah Putih
              </h1>
              <p className="text-[10px] text-red-100 font-medium">Kelurahan Marga Sari</p>
            </div>
          </div>

          {/* Digital clock & Mode triggers */}
          <div className="flex items-center gap-3">
            
            {/* Real-time Clock display with Merah Putih styling */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-red-800 text-red-100 rounded-lg font-mono text-[11px] font-bold">
              <Clock className="w-3.5 h-3.5 text-red-300" />
              <span>{currentTime || '09:08:45 WIB'}</span>
            </div>

            {/* Navigasi screen indicators */}
            <div className="flex items-center gap-1 bg-red-800/60 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveView('PUBLIC')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeView === 'PUBLIC'
                    ? 'bg-white text-red-700 shadow-xs font-bold'
                    : 'text-red-100 hover:text-white hover:bg-red-700/50'
                }`}
              >
                Portal Publik
              </button>

              {currentUser ? (
                <button
                  onClick={() => setActiveView('DASHBOARD')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                    activeView === 'DASHBOARD'
                      ? 'bg-white text-red-700 shadow-xs font-bold'
                      : 'text-red-100 hover:text-white hover:bg-red-700/50'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dasbor
                </button>
              ) : (
                <button
                  onClick={() => setActiveView('LOGIN')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                    activeView === 'LOGIN'
                      ? 'bg-white text-red-700 shadow-xs font-bold'
                      : 'text-red-100 hover:text-white hover:bg-red-700/50'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Masuk
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* DYNAMIC SCREEN CAROUSEL WITH ROUTING */}
      <main className="flex-1 py-8 relative">
        <AnimatePresence mode="wait">
          
          {/* SCREEN 1: PUBLIC VIEW (Portal Publik) */}
          {activeView === 'PUBLIC' && (
            <motion.div
              key="public-screen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <PortalPublik
                biodata={biodata}
                newsList={newsList}
                progjaList={progjaList}
                votingList={votingList}
                himbauanList={himbauanList}
                orgMembers={orgMembers}
                alertDaysBefore={systemSettings.alertDaysBefore}
                currentUser={currentUser}
                onEditProgja={handleEditProgjaFromPortal}
                onEditVoting={handleEditVotingFromPortal}
                onLoginClick={() => setActiveView('LOGIN')}
                onNewsShare={handleNewsShare}
                onNewsLike={handleNewsLike}
              />
            </motion.div>
          )}

          {/* SCREEN 2: LOGIN / REGISTER SECURE SYSTEM */}
          {activeView === 'LOGIN' && (
            <motion.div
              key="login-screen"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="max-w-md mx-auto px-4"
            >
              <div className="bg-white rounded-3xl p-8 border border-slate-200/85 shadow-xl text-center space-y-6 relative">
                
                {/* Brand title */}
                <div className="space-y-1">
                  <div className="p-3 bg-indigo-50 text-indigo-700 rounded-2xl w-fit mx-auto mb-2">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {isRegisterMode ? 'Aktivasi Akun Pengurus' : 'Portal Masuk Pengurus'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {isRegisterMode 
                      ? 'Lakukan aktivasi menggunakan NIK yang sudah didaftarkan Admin Master.' 
                      : 'Masuk menggunakan NIK terdaftar atau username admin master.'}
                  </p>
                </div>

                <AnimatePresence mode="wait">
                  {!isRegisterMode ? (
                    
                    /* LOGIN FORM FORM */
                    <motion.form
                      key="login-form-pane"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      onSubmit={handleLogin}
                      className="space-y-4 text-left"
                    >
                      <div className="space-y-1">
                        <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                          NIK / Username
                        </label>
                        <input
                          type="text"
                          value={loginNik}
                          onChange={(e) => setLoginNik(e.target.value)}
                          placeholder="Contoh: 11111 atau ardi"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs outline-hidden"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                          Password
                        </label>
                        <input
                          type="password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Masukkan password Anda..."
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs outline-hidden"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
                      >
                        Autentikasi & Masuk
                      </button>
                    </motion.form>
                  ) : (
                    
                    /* REGISTRATION/ACTIVATION FORM */
                    <motion.form
                      key="register-form-pane"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      onSubmit={handleActivatePassword}
                      className="space-y-4 text-left"
                    >
                      {/* Step 1: Check NIK registry */}
                      <div className="space-y-1">
                        <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                          Masukkan NIK Pengurus Anda
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={registerNik}
                            onChange={(e) => setRegisterNik(e.target.value)}
                            placeholder="Contoh: 11111 s/d 66666"
                            className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-hidden"
                            disabled={!!activatedUser}
                          />
                          {!activatedUser && (
                            <button
                              type="button"
                              onClick={handleCheckNikForRegistration}
                              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                            >
                              Cek NIK
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Step 2: Set Password once found */}
                      {activatedUser && (
                        <div className="space-y-3 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-indigo-600" />
                            <span className="text-xs font-bold text-indigo-950">NIK Valid: {activatedUser.name}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-normal">
                            Posisi terdaftar: <span className="font-bold uppercase text-indigo-700">{activatedUser.role.replace(/_/g, ' ')}</span>. Silakan buat password baru di bawah.
                          </p>

                          <div className="space-y-1">
                            <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                              Password Baru
                            </label>
                            <input
                              type="password"
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                              placeholder="Minimal 6 karakter..."
                              className="w-full p-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs outline-hidden"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                              Konfirmasi Password Baru
                            </label>
                            <input
                              type="password"
                              value={regConfirmPassword}
                              onChange={(e) => setRegConfirmPassword(e.target.value)}
                              placeholder="Ulangi password..."
                              className="w-full p-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs outline-hidden"
                              required
                            />
                          </div>

                          <div className="flex gap-2 pt-1.5">
                            <button
                              type="button"
                              onClick={() => setActivatedUser(null)}
                              className="flex-1 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                            >
                              Ganti NIK
                            </button>
                            <button
                              type="submit"
                              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                            >
                              Simpan Password
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Mode Switch Controls */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {!isRegisterMode 
                      ? 'Belum punya password pengurus?' 
                      : 'Sudah mengaktifkan password?'}
                  </span>
                  <button
                    onClick={() => {
                      setIsRegisterMode(!isRegisterMode);
                      setActivatedUser(null);
                    }}
                    className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                  >
                    {!isRegisterMode ? 'Aktivasi Password' : 'Kembali Login'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* SCREEN 3: PRIVATE DASHBOARD (Dasbor Pengurus) */}
          {activeView === 'DASHBOARD' && currentUser && (
            <motion.div
              key="dashboard-screen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <DasborPengurus
                currentUser={currentUser}
                progjaList={progjaList}
                newsList={newsList}
                himbauanList={himbauanList}
                keuangan={keuangan}
                geraiList={geraiList}
                biodata={biodata}
                orgMembers={orgMembers}
                roleAccess={roleAccess}
                systemSettings={systemSettings}
                filesList={filesList}
                administrasiList={administrasiList}
                usersBase={usersBase}
                activityLogs={activityLogs}
                votingList={votingList}
                onLogout={handleLogout}
                onUpdateState={handleUpdatePartialState}
                onAddNotification={addNotification}
                autoSelectProgjaId={autoSelectProgjaId}
                autoSelectVotingId={autoSelectVotingId}
                onClearAutoSelect={() => { setAutoSelectProgjaId(null); setAutoSelectVotingId(null); }}
                googleAccessToken={googleAccessToken}
                setGoogleAccessToken={setGoogleAccessToken}
                isSyncing={isSyncing}
                onSyncNow={syncDataToSheets}
                onGoogleLogin={googleLogin}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FOOTER PLATFORM CREDIT */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="text-left space-y-1">
            <p className="font-bold text-slate-200">Koperasi Digital Merah Putih Sejahtera</p>
            <p className="text-[10px]">© 2026 Seluruh hak cipta dilindungi undang-undang.</p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700/50">
            <span>Dirancang Transparan & Akuntabel</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>
      </footer>

      {/* FLOATING TOASTER NOTIFICATION LAYER */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm pointer-events-none">
        <AnimatePresence>
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 50, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className={`p-4 rounded-xl shadow-lg border text-xs font-semibold pointer-events-auto flex items-start gap-2.5 text-left ${
                notif.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : notif.type === 'info'
                  ? 'bg-blue-50 border-blue-200 text-blue-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <div className="mt-0.5">
                {notif.type === 'warning' ? (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
              </div>
              <p className="leading-snug flex-1">{notif.content}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
