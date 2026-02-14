'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { createEmergencyRequest, dispatchEmergency, cancelEmergency } from './actions';

const EmergencyMap = dynamic(() => import('./EmergencyMap'), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-zinc-950 rounded-xl flex items-center justify-center">
      <p className="text-zinc-500">Loading map...</p>
    </div>
  ),
});

type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  license_plate?: string;
};

type Business = {
  id: string;
  name: string;
  category: string;
  address: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
};

type EmergencyClientProps = {
  userId: string;
  vehicle?: Vehicle;
  businesses: Business[];
};

type EmergencyType = 'towing' | 'flat_tire' | 'dead_battery' | 'lockout' | 'accident';

export default function EmergencyClient({ userId, vehicle, businesses }: EmergencyClientProps) {
  const [step, setStep] = useState<'detecting' | 'type' | 'search' | 'dispatched' | 'tracking'>('detecting');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [emergencyType, setEmergencyType] = useState<EmergencyType | null>(null);
  const [nearbyBusinesses, setNearbyBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [emergencyId, setEmergencyId] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLoc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(userLoc);
          
          // Calculate distances and filter nearby (within 10 miles = ~16 km)
          const nearby = businesses
            .map(b => {
              if (!b.latitude || !b.longitude) return null;
              const distance = calculateDistance(
                userLoc.lat,
                userLoc.lng,
                b.latitude,
                b.longitude
              );
              return { ...b, distance };
            })
            .filter(b => b !== null && b.distance <= 10)
            .sort((a, b) => a!.distance - b!.distance) as (Business & { distance: number })[];

          setNearbyBusinesses(nearby);
          setStep('type');
        },
        (err) => {
          console.error('Location error:', err);
          setError('Unable to detect location. Please enable location services.');
          setStep('type');
        }
      );
    } else {
      setError('Location services not available');
      setStep('type');
    }
  }, [businesses]);

  const emergencyTypes: { id: EmergencyType; label: string; icon: string; description: string }[] = [
    { id: 'towing', label: 'Need Towing', icon: '🚛', description: 'Vehicle cannot drive' },
    { id: 'flat_tire', label: 'Flat Tire', icon: '🛞', description: 'Tire change assistance' },
    { id: 'dead_battery', label: 'Dead Battery', icon: '🔋', description: 'Jump start needed' },
    { id: 'lockout', label: 'Locked Out', icon: '🔑', description: 'Keys locked inside' },
    { id: 'accident', label: 'Accident', icon: '⚠️', description: 'Collision assistance' },
  ];

  const handleTypeSelect = async (type: EmergencyType) => {
    setEmergencyType(type);
    setStep('search');

    // Create emergency request
    if (location) {
      const result = await createEmergencyRequest({
        vehicleId: vehicle?.id,
        latitude: location.lat,
        longitude: location.lng,
        emergencyType: type,
        description: '',
      });

      if (result.success && result.emergencyId) {
        setEmergencyId(result.emergencyId);
      } else {
        setError(result.error || 'Failed to create emergency request');
      }
    }
  };

  const handleDispatch = async (business: Business) => {
    if (!emergencyId) return;
    
    setIsDispatching(true);
    setSelectedBusiness(business);

    const result = await dispatchEmergency(emergencyId, business.id);

    if (result.success) {
      setStep('dispatched');
      // After 2 seconds, move to tracking
      setTimeout(() => setStep('tracking'), 2000);
    } else {
      setError(result.error || 'Failed to dispatch');
    }
    setIsDispatching(false);
  };

  const handleCancel = async () => {
    if (emergencyId) {
      await cancelEmergency(emergencyId);
    }
    window.location.href = '/';
  };

  // Detecting location screen
  if (step === 'detecting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-950 via-red-900 to-black text-white flex items-center justify-center p-8">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-red-500/20 border-4 border-red-500 flex items-center justify-center animate-pulse mx-auto">
              <svg className="w-16 h-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="absolute inset-0 w-32 h-32 rounded-full border-4 border-red-500/30 animate-ping mx-auto" />
          </div>
          <h1 className="text-4xl font-bold">Detecting Location...</h1>
          <p className="text-red-200">Finding nearest roadside assistance</p>
        </div>
      </div>
    );
  }

  // Select emergency type
  if (step === 'type') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-950 via-red-900 to-black text-white p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 border-4 border-red-500 mb-4">
              <span className="text-4xl">🚨</span>
            </div>
            <h1 className="text-5xl font-bold">Emergency Mode</h1>
            <p className="text-xl text-red-200">What type of assistance do you need?</p>
            {location && (
              <p className="text-sm text-red-300">📍 Location detected • {nearbyBusinesses.length} providers nearby</p>
            )}
            {error && (
              <div className="p-4 rounded-xl bg-red-900/50 border border-red-500/50 text-red-200">
                {error}
              </div>
            )}
          </div>

          {/* Emergency Type Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {emergencyTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleTypeSelect(type.id)}
                className="p-6 rounded-2xl border-2 border-red-500/50 bg-red-950/50 hover:bg-red-900/50 hover:border-red-400 transition-all group"
              >
                <div className="text-6xl mb-4">{type.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{type.label}</h3>
                <p className="text-sm text-red-300">{type.description}</p>
              </button>
            ))}
          </div>

          {/* Cancel Button */}
          <div className="text-center">
            <button
              onClick={handleCancel}
              className="px-6 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition-all"
            >
              Cancel Emergency
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Searching for help
  if (step === 'search') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-950 via-red-900 to-black text-white p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Finding Help Nearby</h1>
            <p className="text-red-200">
              Emergency type: <strong>{emergencyTypes.find(t => t.id === emergencyType)?.label}</strong>
            </p>
          </div>

          {/* Map */}
          {location && (
            <div className="rounded-2xl overflow-hidden border-2 border-red-500/50">
              <EmergencyMap
                userLocation={location}
                businesses={nearbyBusinesses}
                onSelectBusiness={setSelectedBusiness}
              />
            </div>
          )}

          {/* Business List */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Available Providers ({nearbyBusinesses.length})</h2>
            
            {nearbyBusinesses.length === 0 ? (
              <div className="p-8 rounded-xl bg-red-950/50 border border-red-500/50 text-center">
                <p className="text-red-200 mb-4">No roadside assistance providers found within 10 miles.</p>
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition-all"
                >
                  Go Back
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {nearbyBusinesses.map((business) => (
                  <div
                    key={business.id}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      selectedBusiness?.id === business.id
                        ? 'bg-red-900/50 border-red-400'
                        : 'bg-red-950/30 border-red-500/30 hover:border-red-500/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">{business.name}</h3>
                        <p className="text-sm text-red-300 mb-1">📍 {business.address}</p>
                        {'distance' in business && (
                          <p className="text-sm text-red-400 font-semibold">
                            {(business as any).distance.toFixed(1)} miles away
                          </p>
                        )}
                        {business.phone && (
                          <p className="text-sm text-red-300 mt-2">📞 {business.phone}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDispatch(business)}
                        disabled={isDispatching}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-white font-bold transition-all shadow-lg disabled:opacity-50"
                      >
                        {isDispatching && selectedBusiness?.id === business.id ? 'Dispatching...' : 'Dispatch Now'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Dispatched confirmation
  if (step === 'dispatched') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-black text-white flex items-center justify-center p-8">
        <div className="text-center space-y-6">
          <div className="w-32 h-32 rounded-full bg-emerald-500/20 border-4 border-emerald-500 flex items-center justify-center mx-auto animate-bounce">
            <svg className="w-16 h-16 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold">Dispatched!</h1>
          <p className="text-xl text-emerald-200">{selectedBusiness?.name} has been notified</p>
        </div>
      </div>
    );
  }

  // Live tracking
  if (step === 'tracking') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-950 via-blue-900 to-black text-white p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-cyan-500/20 border-4 border-cyan-500 mb-4 animate-pulse">
              <svg className="w-10 h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold">Help is On the Way</h1>
            <p className="text-xl text-cyan-200">ETA: 15-20 minutes</p>
          </div>

          {/* Business Info Card */}
          {selectedBusiness && (
            <div className="p-8 rounded-2xl border-2 border-cyan-500/50 bg-cyan-950/50 space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">{selectedBusiness.name}</h2>
                <p className="text-cyan-300">{selectedBusiness.address}</p>
              </div>

              {/* Contact Buttons */}
              <div className="grid grid-cols-2 gap-4">
                {selectedBusiness.phone && (
                  <a
                    href={`tel:${selectedBusiness.phone}`}
                    className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call Driver
                  </a>
                )}
                <button className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Message
                </button>
              </div>

              {/* Status Timeline */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-white font-semibold">Request received</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center animate-pulse">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-white font-semibold">Driver en route</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-zinc-500" />
                  </div>
                  <p className="text-zinc-400">Driver arriving soon</p>
                </div>
              </div>
            </div>
          )}

          {/* Vehicle Info */}
          {vehicle && (
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <h3 className="text-lg font-semibold text-white mb-2">Your Vehicle</h3>
              <p className="text-zinc-300">
                {vehicle.year} {vehicle.make} {vehicle.model}
                {vehicle.license_plate && ` • ${vehicle.license_plate}`}
              </p>
            </div>
          )}

          {/* Cancel Button */}
          <div className="text-center">
            <button
              onClick={handleCancel}
              className="px-6 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition-all"
            >
              Cancel Request
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Haversine distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
