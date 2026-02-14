'use client';

import { useState, useRef } from 'react';
import { importReceipt } from './actions';

type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
};

type ReceiptScannerProps = {
  vehicles: Vehicle[];
  userId: string;
  isGold: boolean;
  scanCount: number;
};

type ExtractedData = {
  service: string;
  date: string;
  price: number;
  shop: string;
  mileage?: number;
};

export default function ReceiptScanner({ vehicles, userId, isGold, scanCount }: ReceiptScannerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string>(vehicles[0]?.id || '');
  const [showLimitModal, setShowLimitModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check scan limit for free users
    if (!isGold && scanCount >= 1) {
      setShowLimitModal(true);
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
      // Auto-start scanning
      setTimeout(() => startScanning(), 500);
    };
    reader.readAsDataURL(file);
  };

  const startScanning = () => {
    setIsScanning(true);
    setExtractedData(null);

    // Simulate AI OCR extraction (3 second delay for dramatic effect)
    setTimeout(() => {
      // Mock extracted data
      const mockData: ExtractedData = {
        service: 'Full Synthetic Oil Change',
        date: 'May 12, 2023',
        price: 89.99,
        shop: 'Local Quick Lube',
        mileage: 45230,
      };
      setExtractedData(mockData);
      setIsScanning(false);
    }, 3000);
  };

  const handleConfirm = async () => {
    if (!extractedData || !selectedVehicle) return;

    try {
      const result = await importReceipt({
        vehicleId: selectedVehicle,
        service: extractedData.service,
        date: extractedData.date,
        price: Math.round(extractedData.price * 100), // Convert to cents
        shop: extractedData.shop,
        mileage: extractedData.mileage,
      });

      if (result.success) {
        // Success animation
        alert('✅ Receipt imported successfully! Check your Digital Logbook.');
        window.location.href = `/garage/${selectedVehicle}`;
      } else {
        alert('Failed to import receipt. Please try again.');
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setExtractedData(null);
    setIsScanning(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Vehicle Selector */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-xl p-6">
          <label className="block text-sm font-medium text-zinc-300 mb-3">
            Select Vehicle for This Receipt
          </label>
          <select
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:border-emerald-500 outline-none transition"
          >
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.year} {v.make} {v.model}
              </option>
            ))}
          </select>
        </div>

        {/* Upload Area */}
        {!previewUrl && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-900/30 backdrop-blur-xl p-12 hover:border-purple-500/50 hover:bg-zinc-900/50 transition-all cursor-pointer group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-semibold text-white mb-2">Upload Receipt</p>
                <p className="text-sm text-zinc-400">Click to browse or drag and drop</p>
                <p className="text-xs text-zinc-500 mt-2">Supports JPG, PNG (max 10MB)</p>
              </div>
            </div>
          </div>
        )}

        {/* Preview & Scanning */}
        {previewUrl && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-xl p-6 space-y-6">
            <div className="relative rounded-xl overflow-hidden">
              <img
                src={previewUrl}
                alt="Receipt preview"
                className="w-full max-h-96 object-contain bg-zinc-950"
              />
              
              {/* Scanning Animation */}
              {isScanning && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="relative w-32 h-32 mx-auto">
                      {/* Laser effect */}
                      <div className="absolute inset-0 border-4 border-purple-500 rounded-lg animate-pulse"></div>
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-scan"></div>
                      <svg className="w-full h-full text-purple-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-xl font-bold text-white">Scanning Receipt...</p>
                    <p className="text-sm text-zinc-400">AI is extracting service details</p>
                  </div>
                </div>
              )}
            </div>

            {!isScanning && !extractedData && (
              <button
                onClick={handleReset}
                className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold transition-colors"
              >
                Choose Different Image
              </button>
            )}
          </div>
        )}

        {/* Extracted Data Confirmation */}
        {extractedData && (
          <div className="rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-950/50 to-cyan-950/50 backdrop-blur-xl p-8 animate-in slide-in-from-bottom duration-500">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Does this look right?</h3>
                <p className="text-zinc-400">Review the extracted information before adding to your logbook</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                <p className="text-xs text-zinc-500 mb-1">Service</p>
                <p className="text-lg font-semibold text-white">{extractedData.service}</p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                <p className="text-xs text-zinc-500 mb-1">Date</p>
                <p className="text-lg font-semibold text-white">{extractedData.date}</p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                <p className="text-xs text-zinc-500 mb-1">Price</p>
                <p className="text-lg font-semibold text-emerald-400">${extractedData.price.toFixed(2)}</p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                <p className="text-xs text-zinc-500 mb-1">Shop</p>
                <p className="text-lg font-semibold text-white">{extractedData.shop}</p>
              </div>
              {extractedData.mileage && (
                <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 col-span-2">
                  <p className="text-xs text-zinc-500 mb-1">Mileage</p>
                  <p className="text-lg font-semibold text-cyan-400">{extractedData.mileage.toLocaleString()} miles</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleConfirm}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold transition-all shadow-lg"
              >
                ✓ Confirm & Add to Logbook
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Limit Reached Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full rounded-2xl border-2 border-amber-500/50 bg-gradient-to-br from-amber-950 to-orange-950 p-8 animate-in zoom-in duration-300">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Free Scan Used</h3>
                <p className="text-amber-200">
                  You've used your free receipt scan. Upgrade to Autopilot Gold for unlimited scanning!
                </p>
              </div>
              <div className="space-y-2 text-left">
                <p className="flex items-center gap-2 text-sm text-amber-100">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Unlimited receipt scans
                </p>
                <p className="flex items-center gap-2 text-sm text-amber-100">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  5% cashback on services
                </p>
                <p className="flex items-center gap-2 text-sm text-amber-100">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Track up to 5 vehicles
                </p>
              </div>
              <div className="flex gap-3">
                <a
                  href="/membership"
                  className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold transition-all text-center"
                >
                  Upgrade Now
                </a>
                <button
                  onClick={() => setShowLimitModal(false)}
                  className="px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scanning Animation CSS */}
      <style jsx>{`
        @keyframes scan {
          0% {
            top: 0;
          }
          50% {
            top: calc(100% - 4px);
          }
          100% {
            top: 0;
          }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </>
  );
}
