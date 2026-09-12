import React, { useState, useEffect } from 'react';
import { X, QrCode, Copy, Check, Share2 } from 'lucide-react';
import QRCode from 'qrcode';
import { TrackProject } from '../core/types';
import { generateTrackShareUrl } from '../core/sharing';
import { useBodyScrollLock } from '../core/useBodyScrollLock';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: TrackProject;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, project }) => {
  useBodyScrollLock(isOpen);
  const [qrSvg, setQrSvg] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    try {
      const url = generateTrackShareUrl(project);
      setShareUrl(url);

      // Generate clean SVG QR code with error correction level M (15%)
      QRCode.toString(url, {
        type: 'svg',
        errorCorrectionLevel: 'M',
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then(svg => setQrSvg(svg))
        .catch(err => console.error('Failed to render QR Code:', err));
    } catch (err) {
      console.error('Error preparing QR share URL:', err);
    }
  }, [isOpen, project]);

  if (!isOpen) return null;

  const totalLengthFt = project.stations.length > 1
    ? Math.abs(project.stations[project.stations.length - 1].distanceFt - project.stations[0].distanceFt)
    : 0;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: project.name || 'Track Survey',
          text: `Track survey: ${project.name} (${project.stations.length} stations)`,
          url: shareUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overscroll-none touch-none"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-[92vh] overscroll-contain touch-auto transition-colors"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-zinc-100 dark:bg-black px-4 py-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                Share via QR Code
              </h3>
              <p className="text-[11px] text-zinc-500">
                Offline Track Transfer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col items-center text-center space-y-4 overflow-y-auto">
          {/* QR Code Container - Always pure white card for maximum camera contrast */}
          <div className="p-3 bg-white rounded-2xl shadow-md border border-zinc-200 flex items-center justify-center w-64 h-64 shrink-0">
            {qrSvg ? (
              <div
                className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            ) : (
              <div className="text-xs text-zinc-400 flex items-center justify-center animate-pulse">
                Generating QR code...
              </div>
            )}
          </div>

          {/* Track Summary Pill */}
          <div className="w-full bg-zinc-50 dark:bg-zinc-900/70 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-left space-y-1">
            <div className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 truncate">
              {project.name}
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
              <span>{project.stations.length} stations • {totalLengthFt} ft</span>
              <span className="capitalize">{project.unitFormat.replace(/_/g, ' ')}</span>
            </div>
          </div>

          {/* Instructions */}
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Point any phone or tablet camera at this screen to immediately open and load this survey. <strong>Works offline!</strong>
          </p>

          {/* Action Buttons */}
          <div className="w-full flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition shadow-xs ${
                copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700'
              }`}
            >
              {copied ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
            </button>

            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={handleNativeShare}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black transition shadow-xs"
                title="Share via native sheet"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-zinc-50 dark:bg-black px-4 py-2.5 border-t border-zinc-200 dark:border-zinc-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
