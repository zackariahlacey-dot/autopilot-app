'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import ClaimBusinessModal from '@/components/ClaimBusinessModal';

type BusinessWithCoords = {
  id: string;
  name: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
  is_verified: boolean;
};

type MapViewProps = {
  businesses: BusinessWithCoords[];
};

// Fix Leaflet default icon issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Create custom icon based on verification status
const createCustomIcon = (isVerified: boolean) => {
  if (isVerified) {
    // Verified: Cyan neon glow with pulsing animation
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div class="relative">
          <!-- Outer neon glow rings -->
          <div class="absolute inset-0 w-10 h-10 rounded-full bg-cyan-400/30 blur-md animate-pulse"></div>
          <div class="absolute inset-0 w-10 h-10 rounded-full bg-cyan-400/20 blur-xl animate-pulse"></div>
          
          <!-- Main marker -->
          <div class="relative w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full border-2 border-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.8)] flex items-center justify-center animate-pulse">
            <svg class="w-5 h-5 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          
          <!-- Pin stem -->
          <div class="absolute left-1/2 top-full w-1 h-3 bg-gradient-to-b from-cyan-300 to-transparent -translate-x-1/2 shadow-[0_0_10px_rgba(34,211,238,0.6)]"></div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
    });
  } else {
    // Unclaimed: Muted grey with no glow
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div class="relative">
          <!-- Main marker (grey, no animation) -->
          <div class="w-10 h-10 bg-gradient-to-br from-zinc-600 to-zinc-700 rounded-full border-2 border-zinc-500 shadow-lg flex items-center justify-center opacity-70">
            <svg class="w-5 h-5 text-zinc-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          
          <!-- Pin stem -->
          <div class="absolute left-1/2 top-full w-1 h-3 bg-gradient-to-b from-zinc-500 to-transparent -translate-x-1/2"></div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
    });
  }
};

export default function MapView({ businesses }: MapViewProps) {
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<{ id: string; name: string } | null>(null);

  const handleClaimClick = (businessId: string, businessName: string) => {
    setSelectedBusiness({ id: businessId, name: businessName });
    setClaimModalOpen(true);
  };

  useEffect(() => {
    // Add custom CSS for markers
    const style = document.createElement('style');
    style.textContent = `
      .custom-marker {
        background: transparent !important;
        border: none !important;
      }
      .leaflet-popup-content-wrapper {
        background: rgba(24, 24, 27, 0.95) !important;
        backdrop-filter: blur(20px) !important;
        border: 1px solid rgba(63, 63, 70, 0.5) !important;
        border-radius: 1rem !important;
        box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.5) !important;
        padding: 0 !important;
      }
      .leaflet-popup-content {
        margin: 0 !important;
        width: 320px !important;
      }
      .leaflet-popup-tip-container {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Center of LA area
  const center: [number, number] = [34.05, -118.24];

  return (
    <>
    <MapContainer
      center={center}
      zoom={11}
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
      className="z-0"
    >
      {/* CartoDB Dark Matter Tiles */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={20}
      />

      {/* Business Markers */}
      {businesses.map((business) => (
        <Marker
          key={business.id}
          position={[business.lat, business.lng]}
          icon={createCustomIcon(business.is_verified)}
        >
          <Popup>
            <div className="p-4">
              {/* HUD-style header */}
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-zinc-700">
                <div className={`w-2 h-8 rounded-full ${business.is_verified 
                  ? 'bg-gradient-to-b from-emerald-500 to-cyan-500' 
                  : 'bg-gradient-to-b from-zinc-600 to-zinc-700'
                }`}></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold text-lg leading-tight">
                      {business.name}
                    </h3>
                    {business.is_verified && (
                      <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    )}
                  </div>
                  <p className={`text-xs uppercase tracking-wider font-medium mt-0.5 ${
                    business.is_verified ? 'text-emerald-400' : 'text-zinc-500'
                  }`}>
                    {business.is_verified ? 'Verified • ' : 'Unclaimed • '}
                    {business.category.replace('_', ' ')}
                  </p>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-2 mb-4">
                <svg className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-zinc-400 text-sm">{business.address}</p>
              </div>

              {/* CTA Button */}
              {business.is_verified ? (
                <Link
                  href={`/shop/${business.id}`}
                  className="block w-full py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-center font-semibold hover:from-emerald-400 hover:to-cyan-400 transition-all shadow-lg shadow-cyan-500/30"
                >
                  View Services →
                </Link>
              ) : (
                <div className="space-y-3">
                  {/* Prominent "Unclaimed" Badge */}
                  <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-amber-300 text-sm font-semibold">This business is not yet on AUTOPILOT</p>
                  </div>
                  
                  {/* Large, Prominent Claim Button */}
                  <button
                    onClick={() => handleClaimClick(business.id, business.name)}
                    className="group block w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white text-center font-bold text-lg hover:from-amber-400 hover:via-orange-400 hover:to-amber-400 transition-all shadow-[0_0_20px_rgba(251,146,60,0.5)] hover:shadow-[0_0_30px_rgba(251,146,60,0.7)] transform hover:scale-105"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Claim This Business
                    </span>
                    <span className="text-xs font-normal opacity-90 mt-1 block">Start accepting bookings on AUTOPILOT</span>
                  </button>
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>

    {/* Claim Business Modal */}
    {selectedBusiness && (
      <ClaimBusinessModal
        businessId={selectedBusiness.id}
        businessName={selectedBusiness.name}
        isOpen={claimModalOpen}
        onClose={() => {
          setClaimModalOpen(false);
          setSelectedBusiness(null);
        }}
      />
    )}
  </>
  );
}
