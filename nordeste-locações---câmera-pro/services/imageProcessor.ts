
import { LocationData } from '../types';

const LOGO_URL = 'https://nordesteloc.com.br/wp-content/uploads/2024/01/logo-nordeste-white.svg';

export const processImage = async (
  videoElement: HTMLVideoElement,
  location: LocationData
): Promise<{ blob: Blob; url: string }> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('Could not get canvas context');

  // Set canvas size to video resolution
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  // Draw the original photo
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  // Load Logo for Watermark
  const logo = new Image();
  logo.crossOrigin = 'anonymous';
  logo.src = LOGO_URL;
  
  await new Promise((resolve) => {
    logo.onload = resolve;
    logo.onerror = resolve; // Continue even if logo fails
  });

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR');
  const latStr = location.latitude?.toFixed(6) || '--';
  const lonStr = location.longitude?.toFixed(6) || '--';
  const locStr = location.error ? location.error : `LAT: ${latStr} | LON: ${lonStr}`;

  // Design Constants based on resolution
  const margin = canvas.width * 0.03;
  const fontSizeMain = canvas.width * 0.03;
  const fontSizeSub = canvas.width * 0.02;

  // 1. Draw a dark gradient/box at the bottom for readability
  const footerHeight = canvas.height * 0.15;
  const gradient = ctx.createLinearGradient(0, canvas.height - footerHeight, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.6)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, canvas.height - footerHeight, canvas.width, footerHeight);

  // 2. Draw Stamp Text (Bottom Left)
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 4;
  
  ctx.font = `bold ${fontSizeMain}px sans-serif`;
  ctx.fillText('Nordeste Locações', margin, canvas.height - margin - fontSizeMain * 1.5 - fontSizeSub);
  
  ctx.font = `${fontSizeSub}px sans-serif`;
  ctx.fillText(`${dateStr} - ${timeStr}`, margin, canvas.height - margin - fontSizeSub - 5);
  ctx.fillText(locStr, margin, canvas.height - margin);

  // 3. Draw Watermark Logo (Bottom Right)
  if (logo.complete && logo.naturalWidth > 0) {
    const logoRatio = logo.width / logo.height;
    const logoWidth = canvas.width * 0.18;
    const logoHeight = logoWidth / logoRatio;
    
    ctx.globalAlpha = 0.6; // Opacity for watermark
    ctx.drawImage(
      logo, 
      canvas.width - logoWidth - margin, 
      canvas.height - logoHeight - margin, 
      logoWidth, 
      logoHeight
    );
    ctx.globalAlpha = 1.0;
  }

  // Convert to Blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve({
          blob,
          url: URL.createObjectURL(blob)
        });
      }
    }, 'image/jpeg', 0.9);
  });
};
