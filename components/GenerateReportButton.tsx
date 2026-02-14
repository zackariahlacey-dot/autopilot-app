'use client';

import { useState } from 'react';
import { generateVehicleReport } from '@/app/garage/[id]/report-actions';

type GenerateReportButtonProps = {
  vehicleId: string;
  vehicleName: string;
};

export default function GenerateReportButton({ vehicleId, vehicleName }: GenerateReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportUrl, setReportUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await generateVehicleReport(vehicleId);
      if (result.success && result.reportUrl) {
        setReportUrl(result.reportUrl);
        // Open report in new tab
        window.open(result.reportUrl, '_blank');
      } else {
        alert(result.error || 'Failed to generate report');
      }
    } catch (error) {
      console.error('Generate report error:', error);
      alert('An error occurred while generating the report');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Generating...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Generate Verified Report
          </>
        )}
      </button>

      {reportUrl && (
        <div className="mt-4 p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/50">
          <p className="text-sm text-emerald-300 mb-2">✓ Report generated successfully!</p>
          <a
            href={reportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 underline text-sm"
          >
            View Report →
          </a>
        </div>
      )}
    </>
  );
}
