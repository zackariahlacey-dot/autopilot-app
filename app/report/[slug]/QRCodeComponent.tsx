'use client';

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

type QRCodeComponentProps = {
  url: string;
};

export default function QRCodeComponent({ url }: QRCodeComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 150,
        margin: 2,
        color: {
          dark: '#06b6d4', // cyan-500
          light: '#000000',
        },
      }, (error) => {
        if (error) console.error('QR Code generation error:', error);
      });
    }
  }, [url]);

  return (
    <div className="rounded-xl bg-white p-3 shadow-2xl">
      <canvas ref={canvasRef} className="block" />
      <p className="text-center text-xs text-zinc-900 mt-2 font-medium">Scan to Share</p>
    </div>
  );
}
