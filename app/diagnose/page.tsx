'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Diagnosis = {
  issue: string;
  confidence: number;
  description: string;
  serviceKeywords: string[];
};

// Mock AI - Keyword matcher
function analyzeSymptoms(input: string): Diagnosis | null {
  const text = input.toLowerCase();

  // Brake issues
  if (text.includes('squeak') || text.includes('brake') || text.includes('grinding') || text.includes('stopping')) {
    return {
      issue: 'Brake System Issue',
      confidence: 85,
      description: 'Your symptoms suggest a problem with your brake system. This could be worn brake pads, warped rotors, or low brake fluid.',
      serviceKeywords: ['brake', 'pad', 'rotor'],
    };
  }

  // Battery/Starting issues
  if (text.includes('won\'t start') || text.includes('wont start') || text.includes('click') || text.includes('dead') || text.includes('battery')) {
    return {
      issue: 'Battery or Starter Problem',
      confidence: 90,
      description: 'Based on your description, your vehicle likely has a battery or starter issue. A clicking sound typically indicates a weak battery.',
      serviceKeywords: ['battery', 'starter', 'electrical'],
    };
  }

  // Engine/smoke issues
  if (text.includes('smoke') || text.includes('smell') || text.includes('burning') || text.includes('overheat')) {
    return {
      issue: 'Engine or Cooling System',
      confidence: 80,
      description: 'Smoke or burning smells can indicate serious engine issues. This requires immediate professional inspection.',
      serviceKeywords: ['engine', 'inspection', 'diagnostic', 'cooling'],
    };
  }

  // Oil/fluid leaks
  if (text.includes('leak') || text.includes('drip') || text.includes('puddle') || text.includes('fluid')) {
    return {
      issue: 'Fluid Leak',
      confidence: 75,
      description: 'Fluid leaks should be addressed promptly to prevent damage. The color and location can help identify the source.',
      serviceKeywords: ['oil', 'leak', 'fluid', 'seal'],
    };
  }

  // Tire issues
  if (text.includes('tire') || text.includes('vibrat') || text.includes('wobbl') || text.includes('pull')) {
    return {
      issue: 'Tire or Alignment Issue',
      confidence: 80,
      description: 'Vibration or pulling can indicate tire problems, wheel balance issues, or alignment problems.',
      serviceKeywords: ['tire', 'alignment', 'balance', 'rotation'],
    };
  }

  // AC/Climate
  if (text.includes('ac') || text.includes('air condition') || text.includes('heat') || text.includes('cold')) {
    return {
      issue: 'Climate Control System',
      confidence: 85,
      description: 'Issues with heating or cooling typically involve the A/C system, coolant, or climate control components.',
      serviceKeywords: ['ac', 'air', 'conditioning', 'climate', 'freon'],
    };
  }

  // Check engine light
  if (text.includes('check engine') || text.includes('warning light') || text.includes('dashboard light')) {
    return {
      issue: 'Check Engine Light',
      confidence: 95,
      description: 'A check engine light can indicate many issues. A diagnostic scan will identify the specific problem code.',
      serviceKeywords: ['diagnostic', 'scan', 'engine', 'inspection'],
    };
  }

  // Transmission
  if (text.includes('shift') || text.includes('gear') || text.includes('transmission') || text.includes('slipping')) {
    return {
      issue: 'Transmission Problem',
      confidence: 85,
      description: 'Shifting issues or slipping gears suggest transmission problems that need professional attention.',
      serviceKeywords: ['transmission', 'fluid', 'service'],
    };
  }

  return null;
}

// Mock Vision - Image analysis simulation
function analyzeImage(imageName: string): Diagnosis {
  const random = Math.random();
  
  if (random < 0.4) {
    return {
      issue: 'Check Engine Light Detected',
      confidence: 92,
      description: 'Vision scan detected an illuminated check engine light on your dashboard. This indicates a stored diagnostic code that needs to be read.',
      serviceKeywords: ['diagnostic', 'scan', 'engine', 'inspection'],
    };
  } else if (random < 0.7) {
    return {
      issue: 'Low Tire Pressure Warning',
      confidence: 88,
      description: 'Dashboard scan detected a tire pressure warning indicator. One or more tires may be underinflated.',
      serviceKeywords: ['tire', 'pressure', 'tpms'],
    };
  } else {
    return {
      issue: 'Dashboard Warning Light',
      confidence: 85,
      description: 'Vision analysis detected a warning indicator on your dashboard. A professional diagnostic scan is recommended.',
      serviceKeywords: ['diagnostic', 'scan', 'inspection'],
    };
  }
}

export default function DiagnosePage() {
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [matchedServices, setMatchedServices] = useState<any[]>([]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const router = useRouter();

  const handleAnalyze = async () => {
    if (!input.trim()) return;

    setIsAnalyzing(true);
    setDiagnosis(null);
    setMatchedServices([]);

    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const result = analyzeSymptoms(input);
    setDiagnosis(result);

    if (result) {
      // Fetch matching services from the database
      try {
        const response = await fetch('/api/businesses');
        const businesses = await response.json();
        
        // In a real app, we'd query services by keywords
        // For now, just return a mock service match
        setMatchedServices([
          {
            id: 'matched-service',
            name: result.issue.replace('Problem', 'Service').replace('Issue', 'Service'),
            description: 'Professional diagnosis and repair',
            price: 15000, // $150
          }
        ]);
      } catch (error) {
        console.error('Failed to fetch services:', error);
      }
    }

    setIsAnalyzing(false);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = async (e) => {
      setUploadedImage(e.target?.result as string);
      setIsScanning(true);
      setDiagnosis(null);
      setMatchedServices([]);

      // Simulate vision analysis with scanning animation
      await new Promise(resolve => setTimeout(resolve, 3000));

      const result = analyzeImage(file.name);
      setDiagnosis(result);

      // Mock service match
      setMatchedServices([
        {
          id: 'vision-matched-service',
          name: result.issue.includes('Check Engine') ? 'Diagnostic Scan' : 'Tire Pressure Service',
          description: 'Professional diagnosis and repair based on visual scan',
          price: result.issue.includes('Check Engine') ? 8500 : 5000,
        }
      ]);

      setIsScanning(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-black to-purple-950/20" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl animate-pulse" />

      <div className="relative z-10 max-w-4xl mx-auto p-8 space-y-8">
        {/* Header */}
        <header className="text-center space-y-3 pt-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI Mechanic
            </h1>
          </div>
          <p className="text-zinc-400 text-lg">Describe your problem, get instant recommendations</p>
        </header>

        {/* Back to Home */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-blue-400 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>

        {/* Input Section */}
        <div className="rounded-3xl border-2 border-blue-500/30 bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-xl p-8 shadow-2xl shadow-blue-500/10">
          <label className="block text-sm uppercase tracking-widest text-zinc-400 mb-4 font-medium">
            🔍 Describe Your Car Problem
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Example: 'My brakes are making a squeaking sound when I stop' or 'Car won't start, just clicking noise'"
            className="w-full h-40 bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition resize-none"
            disabled={isAnalyzing}
          />

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleAnalyze}
              disabled={!input.trim() || isAnalyzing || isScanning}
              className="flex-1 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:from-blue-400 hover:to-purple-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
            >
              {isAnalyzing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Analyzing Symptoms...
                </span>
              ) : (
                '🔍 Diagnose Problem'
              )}
            </button>
            {input && !isAnalyzing && !isScanning && (
              <button
                onClick={() => {
                  setInput('');
                  setDiagnosis(null);
                  setMatchedServices([]);
                  setUploadedImage(null);
                }}
                className="px-6 py-4 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold hover:bg-zinc-700 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Vision Upload Section */}
        <div className="rounded-3xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-xl p-8 shadow-2xl shadow-purple-500/10">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-purple-400 mb-2 flex items-center justify-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Vision Scan
            </h3>
            <p className="text-zinc-400 text-sm mb-6">Upload a photo of your dashboard or issue</p>

            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isAnalyzing || isScanning}
              />
              <div className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold hover:from-purple-400 hover:to-blue-400 transition-all shadow-lg shadow-purple-500/20">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                📸 Scan Dashboard
              </div>
            </label>

            {uploadedImage && (
              <div className="mt-6">
                <img 
                  src={uploadedImage} 
                  alt="Uploaded dashboard" 
                  className="max-w-md mx-auto rounded-xl border-2 border-purple-500/50 shadow-xl"
                />
              </div>
            )}
          </div>
        </div>

        {/* Analyzing Animation */}
        {isAnalyzing && (
          <div className="rounded-2xl border border-blue-500/50 bg-blue-950/30 p-8 animate-pulse">
            <div className="flex items-center justify-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                <div className="absolute inset-0 w-16 h-16 border-4 border-purple-500/30 border-b-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
              </div>
              <div>
                <p className="text-xl font-semibold text-blue-400">Scanning diagnostic patterns...</p>
                <p className="text-sm text-zinc-400 mt-1">Analyzing symptoms • Matching services • Calculating confidence</p>
              </div>
            </div>
          </div>
        )}

        {/* Vision Scanning Animation */}
        {isScanning && (
          <div className="rounded-2xl border border-purple-500/50 bg-purple-950/30 p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent animate-pulse" />
            <div className="relative flex items-center justify-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-lg animate-spin" />
                <div className="absolute inset-2 border-4 border-blue-500/30 border-b-blue-500 rounded-lg animate-spin" style={{ animationDirection: 'reverse' }} />
                <svg className="absolute inset-0 m-auto w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-semibold text-purple-400">Vision Scan In Progress...</p>
                <p className="text-sm text-zinc-400 mt-1">Analyzing image • Detecting indicators • Processing visual data</p>
              </div>
            </div>
            {/* Scanning line effect */}
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-pulse" style={{ top: '30%' }} />
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse" style={{ top: '70%', animationDelay: '0.5s' }} />
          </div>
        )}

        {/* Diagnosis Result */}
        {diagnosis && !isAnalyzing && (
          <div className="space-y-6">
            {/* Diagnosis Card */}
            <div className="rounded-3xl border-2 border-purple-500/50 bg-gradient-to-br from-purple-950/50 to-blue-950/50 backdrop-blur-xl p-8 shadow-2xl shadow-purple-500/20">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-2xl font-bold text-white">Likely Issue: {diagnosis.issue}</h3>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      {diagnosis.confidence}% Confidence
                    </span>
                  </div>
                  <p className="text-zinc-300 leading-relaxed">{diagnosis.description}</p>
                </div>
              </div>
            </div>

            {/* Recommended Services */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
              <h3 className="text-xl font-semibold text-zinc-100 mb-4 flex items-center gap-2">
                <span className="w-2 h-6 rounded-full bg-gradient-to-b from-blue-500 to-purple-500" />
                Recommended Services
              </h3>

              {matchedServices.length > 0 ? (
                <div className="space-y-3">
                  {matchedServices.map((service) => (
                    <div
                      key={service.id}
                      className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 hover:bg-zinc-800/50 hover:border-blue-500/50 transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold text-white">{service.name}</h4>
                        <span className="text-2xl font-bold text-blue-400">
                          ${(service.price / 100).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-400 mb-4">{service.description}</p>
                      
                      <div className="flex gap-3">
                        <Link
                          href="/booking"
                          className="flex-1 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white text-center font-semibold hover:from-blue-400 hover:to-purple-400 transition-all"
                        >
                          Book This Repair
                        </Link>
                        <Link
                          href="/explore"
                          className="px-6 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold hover:bg-zinc-700 transition-colors"
                        >
                          Find Shops
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-zinc-500 mb-4">We recommend getting a professional diagnosis</p>
                  <Link
                    href="/explore"
                    className="inline-block px-6 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold hover:bg-zinc-700 transition-colors"
                  >
                    Find Nearby Shops
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* No diagnosis yet */}
        {!diagnosis && !isAnalyzing && input && (
          <div className="text-center py-12">
            <p className="text-zinc-500">Click "Diagnose Problem" to analyze your symptoms</p>
          </div>
        )}
      </div>
    </div>
  );
}
