import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Share2,
  TrendingUp,
  Award,
  AlertTriangle,
  User,
  Users,
  Eye,
  LogIn,
  ChevronRight,
  Sparkles,
  Map,
  Facebook,
  Twitter,
  MessageSquare,
  Copy,
  Check,
  Bell,
  CheckCircle2,
  DollarSign,
  Megaphone,
  Printer,
  Edit2,
  Lock,
  Image as ImageIcon,
  Maximize2,
} from 'lucide-react';
import { KoperasiBiodata, News, Progja, Himbauan, OrgMember, VotingItem, User as UserType } from '../types';
import MapMock from './MapMock';

interface PortalPublikProps {
  biodata: KoperasiBiodata;
  newsList: News[];
  progjaList: Progja[];
  votingList?: VotingItem[];
  himbauanList: Himbauan[];
  orgMembers: OrgMember[];
  alertDaysBefore: number;
  currentUser?: UserType | null;
  onEditProgja?: (id: string) => void;
  onEditVoting?: (id: string) => void;
  onLoginClick: () => void;
  onNewsShare: (id: string) => void;
  onNewsLike: (id: string) => void;
}

export default function PortalPublik({
  biodata,
  newsList,
  progjaList,
  votingList = [],
  himbauanList,
  orgMembers,
  alertDaysBefore,
  currentUser,
  onEditProgja,
  onEditVoting,
  onLoginClick,
  onNewsShare,
  onNewsLike,
}: PortalPublikProps) {
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  const [showShareModal, setShowShareModal] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedHimbauan, setSelectedHimbauan] = useState<Himbauan | null>(null);
  const [activePublicTab, setActivePublicTab] = useState<'PROGJA' | 'VOTING'>('PROGJA');
  const [activePhotoByProgja, setActivePhotoByProgja] = useState<Record<string, string>>({});
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Filter out expired himbauan based on today's date
  const todayStr = new Date().toISOString().split('T')[0];
  const activeHimbauan = himbauanList.filter((h) => h.endDate >= todayStr);
  const pengawasHimbauan = activeHimbauan.filter((h) => h.senderRole === 'pengawas');

  const [copiedMemoId, setCopiedMemoId] = useState<string | null>(null);

  const handleCopyMemo = (h: Himbauan) => {
    const text = `[HIMBAUAN PENGAWAS] ${h.date}\n\n"${h.content}"\n\nPengirim: ${h.senderName} (${h.senderRole.replace(/_/g, ' ')})\nMasa Berlaku: s/d ${h.endDate}\n\nDiterbitkan melalui Sistem Koperasi Merah Putih Sejahtera.`;
    navigator.clipboard.writeText(text);
    setCopiedMemoId(h.id);
    setTimeout(() => setCopiedMemoId(null), 2500);
  };

  // Automated performance indicators for each pengurus
  // Calculate total, completed, and percentage of success of each member
  const memberPerformance = orgMembers.map((m) => {
    const memberProgjas = progjaList.filter((p) => p.picNik === m.nik);
    const total = memberProgjas.length;
    const completed = memberProgjas.filter((p) => p.status === 'DIPUBLIKASIKAN').length;
    const ongoing = memberProgjas.filter((p) => p.status === 'DISETUJUI' || p.status === 'DILAKSANAKAN').length;
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      ...m,
      total,
      completed,
      ongoing,
      successRate,
    };
  });

  // Calculate dynamic upcoming performance alerts: 5 days (or custom settings) before execution date
  const upcomingAlerts = progjaList.filter((p) => {
    if (p.status !== 'DISETUJUI') return false; // Must be approved but not yet executed/published

    const targetTime = new Date(p.targetDate).getTime();
    const todayTime = new Date(todayStr).getTime();
    const diffDays = Math.ceil((targetTime - todayTime) / (1000 * 60 * 60 * 24));

    // Alert if it is between 0 and alertDaysBefore days before execution
    return diffDays >= 0 && diffDays <= alertDaysBefore;
  });

  // Collaborative progja filter
  const collaborativeProgjas = progjaList.filter((p) => p.collaborators && p.collaborators.length > 0);

  // Trigger copy share link
  const handleCopyLink = () => {
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 pb-16">
      {/* 1. Header Hero Panel */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-12 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Logo & Identity */}
          <div className="md:col-span-8 space-y-4 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 rounded-full text-blue-300 text-xs font-semibold tracking-wide border border-blue-500/30">
              <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
              Sistem Koperasi Transparan & Akuntabel
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {biodata.name}
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
              Portal keterbukaan kinerja, laporan keuangan, dan program kerja (progja) pengurus guna mewujudkan tata kelola koperasi yang profesional dan menyejahterakan seluruh anggota.
            </p>

            <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-300 font-medium">
              <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <MapPin className="w-4 h-4 text-emerald-400" />
                DKI Jakarta, Indonesia
              </span>
              <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <Users className="w-4 h-4 text-indigo-400" />
                {orgMembers.length} Struktur Pengurus Aktif
              </span>
            </div>
          </div>

          {/* Call to action & Logo preview */}
          <div className="md:col-span-4 flex flex-col items-center justify-center gap-4">
            <img
              src={biodata.profilePhoto}
              alt="Logo Koperasi"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-white/10 shadow-2xl bg-white/10 p-1"
            />
            <button
              onClick={onLoginClick}
              className="w-full max-w-xs flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              Masuk Dasbor Pengurus
            </button>
          </div>
        </div>
      </div>

      {/* 2. Real-time Papan Pengumuman Module from Pengawas */}
      <div className="bg-linear-to-r from-red-600 via-rose-700 to-red-600 text-white rounded-2xl overflow-hidden shadow-xs border border-red-500/30 flex items-center h-12 relative">
        {/* Pulsing Static Badge */}
        <div className="bg-slate-950 px-4 flex items-center gap-2 font-display text-[10px] sm:text-[11px] font-black tracking-wider uppercase shrink-0 border-r border-red-500/40 relative z-20 h-full">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          <span className="text-white font-extrabold flex items-center gap-1.5">
            <Megaphone className="w-3.5 h-3.5 text-red-500 shrink-0" />
            Papan Pengumuman
          </span>
        </div>
        
        {/* Sliding Marquee text */}
        <div className="flex-1 overflow-hidden relative z-10 h-full flex items-center">
          <div className="animate-marquee whitespace-nowrap flex items-center gap-16 text-xs select-none">
            {/* Iteration 1 */}
            {pengawasHimbauan.length > 0 ? (
              pengawasHimbauan.map((h, idx) => (
                <button
                  key={`marquee1-${h.id}-${idx}`}
                  onClick={() => setSelectedHimbauan(h)}
                  className="flex items-center gap-3.5 text-left hover:underline focus:outline-hidden group cursor-pointer"
                >
                  <span className="bg-slate-950/40 px-2 py-0.5 rounded text-[9px] font-bold text-red-200 font-mono tracking-wider">
                    {h.date}
                  </span>
                  <span className="text-white font-bold group-hover:text-red-100 font-sans">
                    {h.content}
                  </span>
                  <span className="text-red-200/90 font-bold font-mono text-[10px]">
                    (Oleh: {h.senderName})
                  </span>
                </button>
              ))
            ) : (
              <span className="text-red-100 font-medium font-sans">
                Koperasi berjalan kondusif, aman & transparan. Belum ada maklumat atau himbauan mendesak dari Pengawas Koperasi Merah Putih Sejahtera.
              </span>
            )}

            {/* Separator icon to divide the loops */}
            <span className="text-red-300 text-sm font-bold">✦</span>

            {/* Iteration 2 (Required for seamless endless scroll) */}
            {pengawasHimbauan.length > 0 ? (
              pengawasHimbauan.map((h, idx) => (
                <button
                  key={`marquee2-${h.id}-${idx}`}
                  onClick={() => setSelectedHimbauan(h)}
                  className="flex items-center gap-3.5 text-left hover:underline focus:outline-hidden group cursor-pointer"
                >
                  <span className="bg-slate-950/40 px-2 py-0.5 rounded text-[9px] font-bold text-red-200 font-mono tracking-wider">
                    {h.date}
                  </span>
                  <span className="text-white font-bold group-hover:text-red-100 font-sans">
                    {h.content}
                  </span>
                  <span className="text-red-200/90 font-bold font-mono text-[10px]">
                    (Oleh: {h.senderName})
                  </span>
                </button>
              ))
            ) : (
              <span className="text-red-100 font-medium font-sans">
                Koperasi berjalan kondusif, aman & transparan. Belum ada maklumat atau himbauan mendesak dari Pengawas Koperasi Merah Putih Sejahtera.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Automated Performance Alerts Banner (H-5) */}
      <AnimatePresence>
        {(upcomingAlerts.length > 0 || activeHimbauan.length > 0) && (
          <div className="space-y-3 text-left">
            {/* Urgent Alerts from Pengawas */}
            {activeHimbauan.map((himbauan) => (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                key={himbauan.id}
                className="bg-amber-50 border border-amber-200/80 p-4 rounded-2xl flex items-start gap-3.5 shadow-2xs"
              >
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5 fill-amber-100 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Himbauan Penting Pengawas</h4>
                  <p className="text-xs text-amber-800 leading-relaxed mt-1">{himbauan.content}</p>
                  <div className="flex items-center gap-4 mt-2 text-[10px] text-amber-600 font-mono">
                    <span>Pengirim: {himbauan.senderName} ({himbauan.senderRole.replace(/_/g, ' ')})</span>
                    <span>•</span>
                    <span>Aktif s/d: {himbauan.endDate}</span>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Impending Progja Implementation Notice (H-5 Alert) */}
            {upcomingAlerts.map((progja) => {
              const diffDays = Math.ceil((new Date(progja.targetDate).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24));
              return (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  key={progja.id}
                  className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-start gap-3.5 shadow-2xs"
                >
                  <div className="p-2 bg-rose-100 text-rose-700 rounded-xl shrink-0 mt-0.5">
                    <Bell className="w-5 h-5 text-rose-600 fill-rose-100 animate-wiggle" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-2">
                      <span>Pemberitahuan Transparansi Kinerja (H-{diffDays})</span>
                      <span className="px-2 py-0.5 bg-rose-200 text-rose-800 rounded-md text-[9px] font-black">Mendekati Pelaksanaan</span>
                    </h4>
                    <p className="text-xs text-rose-800 leading-relaxed mt-1">
                      Program Kerja <span className="font-bold">"{progja.title}"</span> dijadwalkan terlaksana dalam <span className="font-black text-rose-900">{diffDays} hari</span> lagi ({progja.targetDate}). Penanggung Jawab wajib mempersiapkan administrasi dan laporan pelaksanaan.
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-rose-600 font-mono">
                      <span>PIC: {progja.picName} ({progja.picRole.replace(/_/g, ' ')})</span>
                      <span>•</span>
                      <span>Anggaran: Rp {progja.budget.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* 3. Main Bento Grid: Map Location, Dividends (SHU), & News */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
        {/* LEFT COLUMN: Map & Bio info (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Profil & Kantor Koperasi
            </h3>

            {/* Profile Frame with OSM map */}
            <div className="w-full h-56 rounded-xl overflow-hidden relative border border-slate-100">
              <MapMock
                address={biodata.address}
                name={biodata.name}
                lat={biodata.lat}
                lng={biodata.lng}
              />
            </div>

            {/* Contact details */}
            <div className="space-y-3.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4.5 h-4.5 text-slate-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-slate-700">{biodata.address}</p>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                <p>{biodata.phone}</p>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                <p className="truncate">{biodata.email}</p>
              </div>
            </div>

            {/* Social handles */}
            <div className="flex items-center gap-2.5 pt-3 border-t border-slate-100 justify-center">
              <a
                href={biodata.facebook}
                target="_blank"
                rel="noreferrer"
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Facebook"
              >
                <Facebook className="w-4.5 h-4.5" />
              </a>
              <a
                href={biodata.twitter}
                target="_blank"
                rel="noreferrer"
                className="p-2 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-lg transition-colors"
                title="Twitter"
              >
                <Twitter className="w-4.5 h-4.5" />
              </a>
              <a
                href={biodata.instagram}
                target="_blank"
                rel="noreferrer"
                className="p-2 text-slate-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                title="Instagram"
              >
                <InstagramIcon className="w-4.5 h-4.5" />
              </a>
            </div>
          </div>

          {/* Growth Dividend & SHU Section */}
          <div className="bg-linear-to-b from-white to-slate-50 rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Laporan Hasil Deviden & SHU
            </h3>
            <p className="text-xs text-slate-500 leading-normal">
              Perkembangan Sisa Hasil Usaha (SHU) yang dibagikan secara adil kepada seluruh anggota koperasi.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SHU Bulan Ini</span>
                <span className="text-base font-extrabold text-emerald-600 mt-1 block">Rp 125,000,000</span>
                <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-sm inline-block mt-2">
                  +15.4% YoY
                </span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Deviden Terdistribusi</span>
                <span className="text-base font-extrabold text-blue-600 mt-1 block">Rp 375,000,000</span>
                <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-sm inline-block mt-2">
                  Tahun Buku 2025
                </span>
              </div>
            </div>

            {/* Financial Visual Metric Bar */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Realisasi Anggaran Progja</span>
                <span className="font-bold text-slate-800">46.5%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '46.5%' }} />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Terpakai: Rp 50.0M</span>
                <span>Rencana: Rp 107.5M</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: News & Publications (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Berita & Dokumentasi Publikasi
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Berita rilis resmi, transparansi kegiatan, dan dokumentasi bulanan.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {newsList.map((news) => (
              <div
                key={news.id}
                className="group flex flex-col sm:flex-row gap-4 p-4 hover:bg-slate-50 rounded-xl transition-colors border border-slate-100/50"
              >
                <img
                  src={news.photo}
                  alt={news.title}
                  className="w-full sm:w-40 h-28 object-cover rounded-lg border border-slate-100 group-hover:scale-102 transition-transform shrink-0"
                />

                <div className="space-y-2 flex-1 flex flex-col justify-between">
                  <div className="text-left">
                    <span className="text-[10px] font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-sm">
                      {news.date}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mt-2 leading-snug">
                      {news.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {news.content}
                    </p>
                  </div>

                  {/* Actions & Sharing panel */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100/80 text-[11px] text-slate-500 font-mono mt-2">
                    <button
                      onClick={() => onNewsLike(news.id)}
                      className="hover:text-rose-500 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      ❤️ <span className="text-xs font-bold text-slate-600">{news.likes}</span>
                    </button>

                    <div className="relative">
                      <button
                        onClick={() => setShowShareModal(showShareModal === news.id ? null : news.id)}
                        className="hover:text-blue-600 flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md transition-colors cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        Bagikan ({news.shares})
                      </button>

                      {/* Simulated share popover */}
                      {showShareModal === news.id && (
                        <div className="absolute right-0 bottom-8 z-30 bg-white border border-slate-200 rounded-xl shadow-lg p-2 flex flex-col gap-1 w-44 font-sans text-xs">
                          <button
                            onClick={() => {
                              onNewsShare(news.id);
                              setShowShareModal(null);
                              alert('Simulasi share ke Facebook berhasil!');
                            }}
                            className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-50 rounded-lg text-slate-700 font-medium cursor-pointer"
                          >
                            <Facebook className="w-4 h-4 text-blue-600" />
                            Share Facebook
                          </button>
                          <button
                            onClick={() => {
                              onNewsShare(news.id);
                              setShowShareModal(null);
                              alert('Simulasi share ke Twitter berhasil!');
                            }}
                            className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-50 rounded-lg text-slate-700 font-medium cursor-pointer"
                          >
                            <Twitter className="w-4 h-4 text-sky-400" />
                            Share Twitter
                          </button>
                          <button
                            onClick={() => {
                              onNewsShare(news.id);
                              setShowShareModal(null);
                              alert('Simulasi share ke WhatsApp berhasil!');
                            }}
                            className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-50 rounded-lg text-slate-700 font-medium cursor-pointer"
                          >
                            <MessageSquare className="w-4 h-4 text-emerald-500" />
                            WhatsApp
                          </button>
                          <button
                            onClick={() => {
                              onNewsShare(news.id);
                              handleCopyLink();
                            }}
                            className="flex items-center justify-between px-2.5 py-1.5 hover:bg-slate-50 rounded-lg text-slate-700 font-medium cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <Copy className="w-4 h-4 text-slate-500" />
                              Copy Link
                            </span>
                            {copiedLink && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Collab Progja Notifications Panel */}
      {collaborativeProgjas.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs text-left">
          <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-indigo-600" />
            Notifikasi Program Kerja Kolaboratif
          </h3>
          <p className="text-xs text-slate-500 mb-4">Daftar agenda kegiatan yang melibatkan kolaborasi lintas penanggung jawab pengurus.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {collaborativeProgjas.map((progja) => (
              <div key={progja.id} className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl shrink-0 h-fit mt-0.5">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-indigo-950">{progja.title}</h4>
                  <p className="text-[11px] text-indigo-800 leading-relaxed mt-1">
                    Diprakarsai oleh <span className="font-semibold">{progja.picName}</span> bekerja sama dengan{' '}
                    <span className="font-semibold">{progja.collaborators.map((r) => r.replace(/_/g, ' ')).join(', ')}</span>.
                  </p>
                  <div className="mt-2.5 flex items-center justify-between text-[10px] text-indigo-600 font-mono">
                    <span>Target: {progja.targetDate}</span>
                    <span className="font-bold bg-indigo-100 px-2 py-0.5 rounded-sm uppercase">{progja.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Members' Performance & Progress Grid (Progja & Sukses Rate) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs text-left space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-5.5 h-5.5 text-blue-600" />
            Matriks Transparansi Kinerja Pengurus Koperasi
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Persentase keberhasilan penyelesaian program kerja (Progja) masing-masing pengurus yang telah divalidasi oleh Ketua.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {memberPerformance.map((member) => (
            <div
              key={member.nik}
              className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/50 rounded-2xl flex items-start gap-4 transition-all"
            >
              <img
                src={member.photoUrl}
                alt={member.name}
                className="w-14 h-14 rounded-xl object-cover border border-white shadow-xs shrink-0"
              />

              <div className="min-w-0 flex-1 space-y-1.5">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 truncate">{member.name}</h4>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider truncate">
                    {member.role.replace(/_/g, ' ')}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-mono">Tingkat Sukses</span>
                    <span className="font-extrabold text-blue-600">{member.successRate}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${member.successRate}%` }}
                    />
                  </div>
                </div>

                {/* Counter */}
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-0.5">
                  <span>Total Progja: {member.total}</span>
                  <span className="text-emerald-600 font-bold">Selesai: {member.completed}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. PUBLISHED DISCLOSURE PANEL (PROGRAM KERJA RESMI & HASIL VOTING) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1 text-left">
            <h2 className="text-xl font-extrabold text-slate-900 font-display flex items-center gap-2">
              <Award className="w-5 h-5 text-red-600" />
              Transparansi Kinerja & Pemufakatan Koperasi
            </h2>
            <p className="text-xs text-slate-500">
              Keterbukaan informasi mengenai program kerja pengurus yang telah disahkan dan keputusan hasil voting pengurus.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 self-start md:self-auto">
            <button
              onClick={() => setActivePublicTab('PROGJA')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activePublicTab === 'PROGJA'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Program Kerja Terverifikasi
            </button>
            <button
              onClick={() => setActivePublicTab('VOTING')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activePublicTab === 'VOTING'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hasil Konsensus & Voting
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activePublicTab === 'PROGJA' ? (
            <motion.div
              key="progja-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {progjaList.filter((p) => ['DISETUJUI', 'DILAKSANAKAN', 'DIPUBLIKASIKAN'].includes(p.status)).length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-sm text-slate-500 font-medium">Belum ada Program Kerja resmi yang disetujui atau dipublikasikan.</p>
                  <p className="text-xs text-slate-400 mt-1">Seluruh program kerja yang disetujui Ketua, sedang berjalan, atau telah dipublikasikan akan tayang di sini.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {progjaList
                    .filter((p) => ['DISETUJUI', 'DILAKSANAKAN', 'DIPUBLIKASIKAN'].includes(p.status))
                    .map((p) => (
                      <div
                        key={p.id}
                        className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between gap-4 shadow-3xs hover:shadow-xs transition-all relative overflow-hidden"
                      >
                        {/* Top Indicator */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                              Bidang: {p.sector}
                            </span>
                            {p.status === 'DISETUJUI' && (
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-[9px] font-bold uppercase tracking-wider">
                                DISETUJUI KETUA
                              </span>
                            )}
                            {p.status === 'DILAKSANAKAN' && (
                              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-md text-[9px] font-bold uppercase tracking-wider animate-pulse">
                                SEDANG DIJALANKAN
                              </span>
                            )}
                            {p.status === 'DIPUBLIKASIKAN' && (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md text-[9px] font-bold uppercase tracking-wider">
                                SELESAI & TERPUBLISH
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-extrabold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                              ✓ VALIDATED
                            </span>
                            {currentUser && (currentUser.role === 'admin_master' || currentUser.role === 'ketua' || p.picNik === currentUser.nik) && onEditProgja ? (
                              <button
                                onClick={() => onEditProgja(p.id)}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                title="Edit Program Kerja di Dasbor"
                              >
                                <Edit2 className="w-3 h-3" />
                                Edit
                              </button>
                            ) : !currentUser && onLoginClick ? (
                              <button
                                onClick={onLoginClick}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                title="Masuk sebagai pengurus untuk mengedit"
                              >
                                <Lock className="w-3 h-3" />
                                Edit
                              </button>
                            ) : null}
                          </div>
                        </div>

                        {/* Program Info */}
                        <div className="space-y-1.5 text-left">
                          <h3 className="text-sm font-black text-slate-900 font-display leading-snug">
                            {p.title}
                          </h3>
                          <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                            {p.description}
                          </p>
                        </div>

                        {/* Budget & Target */}
                        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-[10px] text-left">
                          <div>
                            <span className="text-slate-400 block font-medium">Anggaran Disetujui</span>
                            <span className="font-extrabold text-slate-900 text-xs">Rp {p.budget.toLocaleString('id-ID')}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">Target Penyelesaian</span>
                            <span className="font-bold text-slate-800">{p.targetDate}</span>
                          </div>
                        </div>

                        {/* Indicators & Collaborators */}
                        <div className="space-y-2 text-xs text-left">
                          <div className="border-t border-slate-100 pt-2">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-1">Indikator Keberhasilan</span>
                            <p className="text-slate-700 leading-normal bg-slate-50/50 p-2 rounded-lg text-[11px] border border-slate-100">{p.indicators || '-'}</p>
                          </div>
                        </div>

                        {/* Documentation Proof if available */}
                        {(p.proofDescription || p.proofPhoto || (p.proofGallery && p.proofGallery.length > 0)) && (
                          <div className="border-t border-dashed border-slate-200 pt-3 text-left space-y-3 bg-emerald-50/20 -mx-5 -mb-5 p-5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-emerald-800 font-black block uppercase tracking-wider flex items-center gap-1">
                                <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                                Bukti & Galeri Realisasi Kegiatan
                              </span>
                              {p.proofGallery && p.proofGallery.length > 1 && (
                                <span className="text-[9px] text-slate-500 font-bold bg-white px-2 py-0.5 rounded-full border border-slate-200">
                                  {p.proofGallery.length} Foto
                                </span>
                              )}
                            </div>

                            {/* Main Active Image Display */}
                            {(() => {
                              const mainImg = activePhotoByProgja[p.id] || p.proofGallery?.[0] || p.proofPhoto;
                              if (!mainImg) return null;
                              return (
                                <div className="relative group overflow-hidden rounded-xl border border-emerald-200/80 shadow-2xs bg-slate-100">
                                  <img
                                    src={mainImg}
                                    alt="Dokumentasi Terpilih"
                                    referrerPolicy="no-referrer"
                                    className="w-full h-44 object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                                  />
                                  <button
                                    onClick={() => setLightboxImage(mainImg)}
                                    className="absolute bottom-2.5 right-2.5 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                                    title="Perbesar Foto"
                                  >
                                    <Maximize2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })()}

                            {/* Gallery Thumbnails Carousel/Grid */}
                            {p.proofGallery && p.proofGallery.length > 0 && (
                              <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-thin">
                                {p.proofGallery.map((url, idx) => {
                                  const isActive = (activePhotoByProgja[p.id] || p.proofGallery?.[0] || p.proofPhoto) === url;
                                  return (
                                    <button
                                      key={idx}
                                      onClick={() => setActivePhotoByProgja({
                                        ...activePhotoByProgja,
                                        [p.id]: url
                                      })}
                                      className={`relative w-14 h-10 rounded-md overflow-hidden border shrink-0 transition-all cursor-pointer ${
                                        isActive 
                                          ? 'border-emerald-600 ring-2 ring-emerald-500/25 scale-95' 
                                          : 'border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100'
                                      }`}
                                    >
                                      <img
                                        src={url}
                                        alt={`Dokumentasi thumbnail ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                      />
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {p.proofDescription && (
                              <p className="text-[11px] text-slate-700 italic leading-relaxed bg-white/70 p-2.5 rounded-lg border border-emerald-100/40">
                                "{p.proofDescription}"
                              </p>
                            )}
                          </div>
                        )}

                        {/* PIC Signature / Footer */}
                        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[10px] text-slate-500">
                          <div>
                            <span className="block text-slate-400 font-medium">Penanggung Jawab (PIC):</span>
                            <span className="font-bold text-slate-800">{p.picName} ({p.picRole.replace(/_/g, ' ')})</span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-mono">ID: {p.id}</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="voting-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {votingList.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-sm text-slate-500 font-medium">Belum ada Pemufakatan / Voting pengurus koperasi yang dipublikasikan.</p>
                  <p className="text-xs text-slate-400 mt-1">Seluruh hasil voting musyawarah akan ditampilkan di sini setelah divalidasi.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {votingList.map((v) => {
                    const totalVotes = Object.keys(v.votes).length;
                    const counts = {
                      SETUJU: Object.values(v.votes).filter((val) => val === 'SETUJU').length,
                      TOLAK: Object.values(v.votes).filter((val) => val === 'TOLAK').length,
                      ABSTAIN: Object.values(v.votes).filter((val) => val === 'ABSTAIN').length,
                    };

                    const pct = {
                      SETUJU: totalVotes > 0 ? Math.round((counts.SETUJU / totalVotes) * 100) : 0,
                      TOLAK: totalVotes > 0 ? Math.round((counts.TOLAK / totalVotes) * 100) : 0,
                      ABSTAIN: totalVotes > 0 ? Math.round((counts.ABSTAIN / totalVotes) * 100) : 0,
                    };

                    const isClosed = new Date().toISOString().split('T')[0] > v.endDate;

                    return (
                      <div
                        key={v.id}
                        className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between gap-4 shadow-3xs hover:shadow-xs transition-all relative overflow-hidden text-left"
                      >
                        {/* Title and Category */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 bg-red-50 text-red-800 border border-red-100 rounded text-[9px] font-bold uppercase tracking-wider">
                              Konsensus: {v.type === 'PROGJA' ? 'Sirkulasi Progja' : 'Agenda Rapat'}
                            </span>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                  isClosed
                                    ? 'bg-slate-100 text-slate-600 border border-slate-200'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}
                              >
                                {isClosed ? '🔒 Selesai' : '⏳ Aktif'}
                              </span>
                              {currentUser && (currentUser.role === 'admin_master' || v.createdByNik === currentUser.nik) && onEditVoting ? (
                                <button
                                  onClick={() => onEditVoting(v.id)}
                                  className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[9px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Edit Rincian Voting di Dasbor"
                                >
                                  <Edit2 className="w-2.5 h-2.5" />
                                  Edit
                                </button>
                              ) : !currentUser && onLoginClick ? (
                                <button
                                  onClick={onLoginClick}
                                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded text-[9px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Masuk sebagai pengurus untuk mengedit"
                                >
                                  <Lock className="w-2.5 h-2.5" />
                                  Edit
                                </button>
                              ) : null}
                            </div>
                          </div>
                          <h3 className="text-sm font-black text-slate-900 font-display mt-2 leading-snug">
                            {v.title}
                          </h3>
                          <p className="text-xs text-slate-600 leading-normal line-clamp-3">
                            {v.description}
                          </p>
                        </div>

                        {/* Vote Results Progress Bars */}
                        <div className="space-y-2 border-t border-slate-100 pt-3">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Akumulasi Hak Suara Pengurus ({totalVotes} Suara)</span>
                          
                          {/* Setuju bar */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold">
                              <span className="text-emerald-700">Setuju / Mufakat</span>
                              <span>{counts.SETUJU} ({pct.SETUJU}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${pct.SETUJU}%` }} />
                            </div>
                          </div>

                          {/* Tolak bar */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold">
                              <span className="text-rose-700">Tolak / Keberatan</span>
                              <span>{counts.TOLAK} ({pct.TOLAK}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${pct.TOLAK}%` }} />
                            </div>
                          </div>

                          {/* Abstain bar */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold">
                              <span className="text-slate-600">Abstain</span>
                              <span>{counts.ABSTAIN} ({pct.ABSTAIN}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-slate-400 h-full rounded-full transition-all duration-500" style={{ width: `${pct.ABSTAIN}%` }} />
                            </div>
                          </div>
                        </div>

                        {/* Signatures of voters */}
                        <div className="border-t border-slate-100 pt-3 text-[10px] text-slate-500 flex flex-col gap-1.5">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Verifikasi Keaslian Suara:</span>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(v.votes).map(([nik, choice]) => {
                              const member = orgMembers.find(m => m.nik === nik);
                              return (
                                <span
                                  key={nik}
                                  title={`${member?.name || nik} (${choice})`}
                                  className={`px-1.5 py-0.5 rounded text-[8px] font-bold border font-mono ${
                                    choice === 'SETUJU'
                                      ? 'bg-emerald-50/50 text-emerald-800 border-emerald-100'
                                      : choice === 'TOLAK'
                                      ? 'bg-rose-50/50 text-rose-800 border-rose-100'
                                      : 'bg-slate-100 text-slate-700 border-slate-200'
                                  }`}
                                >
                                  {member?.name.split(' ')[0] || nik} ({choice === 'SETUJU' ? '✔' : choice === 'TOLAK' ? '✘' : '⚪'})
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {/* Creator Sign-off */}
                        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[10px] text-slate-400">
                          <span>Dibuat oleh: <strong className="text-slate-700">{v.createdByName}</strong> ({v.createdByRole.replace(/_/g, ' ')})</span>
                          <span>Batas: {v.endDate}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 5. Interactive Himbauan Modal */}
      <AnimatePresence>
        {selectedHimbauan && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full border border-slate-200 shadow-2xl relative text-left"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedHimbauan(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors cursor-pointer text-lg font-black"
              >
                &times;
              </button>

              <div className="space-y-6">
                {/* Header info */}
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                    <Megaphone className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <span className="inline-block text-[9px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                      Maklumat Resmi Pengawas
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-1">Detail Papan Pengumuman</h3>
                  </div>
                </div>

                {/* Content area */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                  <p className="text-sm text-slate-800 leading-relaxed font-semibold break-words">
                    "{selectedHimbauan.content}"
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200/60 text-xs">
                    <div>
                      <span className="text-slate-400 block font-medium">Tanggal Rilis</span>
                      <span className="font-bold text-slate-700">{selectedHimbauan.date}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Berlaku Sampai</span>
                      <span className="font-bold text-slate-700">{selectedHimbauan.endDate}</span>
                    </div>
                  </div>
                </div>

                {/* Sender credentials / Digital signature */}
                <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-amber-800 font-bold block uppercase tracking-wider font-mono">Penandatangan Digital</span>
                    <p className="text-xs font-bold text-slate-900">{selectedHimbauan.senderName}</p>
                    <p className="text-[10px] text-slate-500 uppercase">{selectedHimbauan.senderRole.replace(/_/g, ' ')} Koperasi</p>
                  </div>
                  <div className="px-3 py-1 bg-amber-100/80 border border-amber-200 text-amber-900 text-[9px] font-black uppercase tracking-wider rounded">
                    TERVERIFIKASI
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleCopyMemo(selectedHimbauan)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                    {copiedMemoId === selectedHimbauan.id ? 'Tersalin!' : 'Salin Teks Memo'}
                  </button>
                  <button
                    onClick={() => setSelectedHimbauan(null)}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox Modal for Photo Gallery */}
      <AnimatePresence>
        {lightboxImage && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-hidden">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full flex flex-col items-center justify-center"
            >
              {/* Close button top right */}
              <button
                onClick={() => setLightboxImage(null)}
                className="absolute -top-12 right-0 bg-white/10 hover:bg-white/20 text-white rounded-full px-3.5 py-1.5 transition-colors cursor-pointer text-xs font-bold flex items-center gap-1 shadow-md border border-white/10"
              >
                Tutup &times;
              </button>

              <img
                src={lightboxImage}
                alt="Fullscreen Dokumentasi"
                referrerPolicy="no-referrer"
                className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/10"
              />

              <div className="mt-4 bg-white/10 backdrop-blur-xs px-4 py-2 rounded-full border border-white/5 text-white/80 text-xs font-mono">
                Klik luar atau tombol tutup untuk kembali ke portal publik
              </div>
            </motion.div>

            {/* Click outside to close */}
            <div className="absolute inset-0 -z-10" onClick={() => setLightboxImage(null)} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Internal Simple Icon helper because instagram is missing in lucide-react occasionally
function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}
