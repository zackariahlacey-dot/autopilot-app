'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

type AdminMapProps = {
  sosRequests: any[];
  marketplaceJobs: any[];
  businesses: any[];
};

export default function AdminMap({ sosRequests, marketplaceJobs, businesses }: AdminMapProps) {
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    import('leaflet').then((leaflet) => {
      setL(leaflet.default);
    });
  }, []);

  if (!L) {
    return (
      <div className="h-[600px] bg-zinc-950 rounded-xl flex items-center justify-center">
        <p className="text-zinc-500">Loading map...</p>
      </div>
    );
  }

  // SOS marker (red emergency)
  const sosIcon = L.divIcon({
    html: `
      <div style="
        width: 50px;
        height: 50px;
        background: linear-gradient(135deg, #ef4444, #f97316);
        border: 4px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        animation: pulse 2s infinite;
      ">
        <span style="font-size: 24px;">🚨</span>
      </div>
    `,
    className: '',
    iconSize: [50, 50],
    iconAnchor: [25, 50],
  });

  // Marketplace job marker (yellow lead)
  const leadIcon = L.divIcon({
    html: `
      <div style="
        width: 45px;
        height: 45px;
        background: linear-gradient(135deg, #eab308, #f59e0b);
        border: 4px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      ">
        <span style="font-size: 20px;">💰</span>
      </div>
    `,
    className: '',
    iconSize: [45, 45],
    iconAnchor: [22.5, 45],
  });

  // Business marker (cyan shop)
  const businessIcon = L.divIcon({
    html: `
      <div style="
        width: 35px;
        height: 35px;
        background: linear-gradient(135deg, #06b6d4, #0891b2);
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      ">
        <span style="font-size: 16px;">🏢</span>
      </div>
    `,
    className: '',
    iconSize: [35, 35],
    iconAnchor: [17.5, 35],
  });

  // Default center (Pasadena, CA)
  const defaultCenter: [number, number] = [34.1478, -118.1445];
  const defaultZoom = 11;

  return (
    <div className="h-[600px] rounded-xl overflow-hidden border-2 border-zinc-800">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* SOS Emergency Markers */}
        {sosRequests.map((sos) => {
          if (!sos.latitude || !sos.longitude) return null;

          return (
            <Marker
              key={`sos-${sos.id}`}
              position={[sos.latitude, sos.longitude]}
              icon={sosIcon}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-bold text-lg text-red-600 mb-1">
                    🚨 {sos.emergency_type.replace('_', ' ').toUpperCase()}
                  </h3>
                  <p className="text-sm mb-1">Status: <strong>{sos.status}</strong></p>
                  <p className="text-sm mb-1">📍 {sos.address}</p>
                  {sos.vehicles && (
                    <p className="text-sm text-gray-600">
                      🚗 {sos.vehicles.year} {sos.vehicles.make} {sos.vehicles.model}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(sos.created_at).toLocaleString()}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Marketplace Lead Markers */}
        {marketplaceJobs.map((job) => {
          if (!job.latitude || !job.longitude) return null;

          return (
            <Marker
              key={`job-${job.id}`}
              position={[job.latitude, job.longitude]}
              icon={leadIcon}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-bold text-lg text-yellow-600 mb-1">
                    💰 Marketplace Lead
                  </h3>
                  <p className="text-sm mb-1">Category: <strong>{job.category}</strong></p>
                  <p className="text-sm mb-1">Problem: {job.problem_description}</p>
                  {job.vehicles && (
                    <p className="text-sm text-gray-600">
                      🚗 {job.vehicles.year} {job.vehicles.make} {job.vehicles.model}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(job.created_at).toLocaleString()}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Business Markers */}
        {businesses.map((business) => {
          if (!business.latitude || !business.longitude) return null;

          return (
            <Marker
              key={`business-${business.id}`}
              position={[business.latitude, business.longitude]}
              icon={businessIcon}
            >
              <Popup>
                <div className="p-2 min-w-[150px]">
                  <h3 className="font-bold text-cyan-600 mb-1">{business.name}</h3>
                  <p className="text-sm text-gray-600">{business.category}</p>
                  <p className="text-xs text-gray-500 mt-1">{business.address}</p>
                  {business.is_verified && (
                    <span className="inline-block mt-2 px-2 py-1 rounded-full bg-cyan-100 text-cyan-700 text-xs">
                      ✓ Verified
                    </span>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
