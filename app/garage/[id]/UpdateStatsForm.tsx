'use client';

import { useState } from 'react';
import { updateVehicleStats } from '../actions';

type UpdateStatsFormProps = {
  vehicleId: string;
  currentMileage?: number;
};

export function UpdateStatsForm({ vehicleId, currentMileage }: UpdateStatsFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-6 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:border-emerald-500/50 transition-all"
      >
        Update Stats
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative max-w-md w-full rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <form action={async (formData) => {
              await updateVehicleStats(formData);
              setIsOpen(false);
            }} className="p-6 space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  Update Vehicle Stats
                </h2>
                <p className="text-sm text-zinc-400">Keep your vehicle data current for accurate health tracking</p>
              </div>

              <input type="hidden" name="vehicleId" value={vehicleId} />

              <div>
                <label htmlFor="mileage" className="block text-sm font-medium text-zinc-300 mb-2">
                  Current Mileage
                </label>
                <input
                  type="number"
                  id="mileage"
                  name="mileage"
                  defaultValue={currentMileage}
                  min="0"
                  placeholder="50000"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                />
              </div>

              <div>
                <label htmlFor="lastOilChange" className="block text-sm font-medium text-zinc-300 mb-2">
                  Date of Last Oil Change
                </label>
                <input
                  type="date"
                  id="lastOilChange"
                  name="lastOilChange"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                />
              </div>

              <div>
                <label htmlFor="lastDetail" className="block text-sm font-medium text-zinc-300 mb-2">
                  Date of Last Detail
                </label>
                <input
                  type="date"
                  id="lastDetail"
                  name="lastDetail"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-zinc-800 text-zinc-300 font-medium hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold hover:from-emerald-400 hover:to-cyan-400 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
