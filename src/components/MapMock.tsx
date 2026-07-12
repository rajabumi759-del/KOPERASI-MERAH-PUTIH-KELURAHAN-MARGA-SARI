import { MapPin, Navigation, Compass } from 'lucide-react';

interface MapMockProps {
  address: string;
  name: string;
  lat: number;
  lng: number;
}

export default function MapMock({ address, name, lat, lng }: MapMockProps) {
  // Direct embed URL using OpenStreetMap centered on Koperasi's lat/lng
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.005}%2C${lat - 0.003}%2C${lng + 0.005}%2C${lat + 0.003}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <div className="relative w-full h-full bg-slate-100 rounded-2xl overflow-hidden border border-slate-200/80 shadow-inner group">
      {/* Map Iframe */}
      <iframe
        id="koperasi-osm-map"
        title={`Peta Lokasi ${name}`}
        src={embedUrl}
        className="w-full h-full border-0 filter grayscale saturate-75 contrast-125 opacity-90 group-hover:opacity-100 transition-opacity duration-300"
        allowFullScreen
        loading="lazy"
      />

      {/* Decorative Overlays */}
      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm border border-slate-100 flex items-center gap-2 pointer-events-none">
        <Compass className="w-4 h-4 text-emerald-600 animate-spin-slow" />
        <span className="text-xs font-mono font-medium text-slate-700">GPS Active</span>
      </div>

      <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-md border border-slate-100 flex items-start gap-2.5 transition-all duration-300 hover:shadow-lg">
        <div className="p-1.5 bg-red-50 text-red-600 rounded-lg shrink-0 mt-0.5">
          <MapPin className="w-4.5 h-4.5 fill-red-100" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-800 truncate">{name}</p>
          <p className="text-[11px] text-slate-500 leading-normal truncate">{address}</p>
          <p className="text-[10px] font-mono text-slate-400 mt-1 flex items-center gap-1">
            <Navigation className="w-3 h-3 text-blue-500" /> {lat.toFixed(5)}, {lng.toFixed(5)}
          </p>
        </div>
      </div>
    </div>
  );
}
