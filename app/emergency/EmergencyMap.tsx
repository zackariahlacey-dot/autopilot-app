'use client';

import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom marker icons
const userIcon = L.divIcon({
  html: `
    <div style="
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #3b82f6, #06b6d4);
      border: 4px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-center;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      animation: pulse 2s infinite;
    ">
      <span style="font-size: 20px;">📍</span>
    </div>
  `,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const towTruckIcon = L.divIcon({
  html: `
    <div style="
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #ef4444, #f97316);
      border: 4px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-center;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    ">
      <span style="font-size: 24px;">🚛</span>
    </div>
  `,
  className: '',
  iconSize: [50, 50],
  iconAnchor: [25, 50],
});

type Business = {
  id: string;
  name: string;
  category: string;
  address: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
};

type EmergencyMapProps = {
  userLocation: { lat: number; lng: number };
  businesses: Business[];
  onSelectBusiness?: (business: Business) => void;
};

export default function EmergencyMap({ userLocation, businesses, onSelectBusiness }: EmergencyMapProps) {
  return (
    <MapContainer
      center={[userLocation.lat, userLocation.lng]}
      zoom={12}
      style={{ height: '500px', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {/* 10-mile radius circle */}
      <Circle
        center={[userLocation.lat, userLocation.lng]}
        radius={16093} // 10 miles in meters
        pathOptions={{
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.1,
          weight: 2,
          dashArray: '5, 5',
        }}
      />

      {/* User location marker */}
      <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
        <Popup>
          <div className="text-center">
            <strong>Your Location</strong>
            <p className="text-sm text-zinc-600">You are here</p>
          </div>
        </Popup>
      </Marker>

      {/* Business markers */}
      {businesses.map((business) => {
        if (!business.latitude || !business.longitude) return null;

        return (
          <Marker
            key={business.id}
            position={[business.latitude, business.longitude]}
            icon={towTruckIcon}
            eventHandlers={{
              click: () => {
                if (onSelectBusiness) {
                  onSelectBusiness(business);
                }
              },
            }}
          >
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="font-bold text-lg mb-1">{business.name}</h3>
                <p className="text-sm text-zinc-600 mb-2">{business.address}</p>
                {business.phone && (
                  <p className="text-sm text-zinc-600 mb-2">📞 {business.phone}</p>
                )}
                {'distance' in business && (
                  <p className="text-sm font-semibold text-red-600">
                    {(business as any).distance.toFixed(1)} miles away
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
