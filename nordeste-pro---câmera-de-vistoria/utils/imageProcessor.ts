
import { LocationData, SessionData } from '../types';

export const applyWatermark = async (
  imageBlob: Blob,
  location: LocationData,
  session: SessionData,
  index: number
): Promise<{ url: string; filename: string }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageBlob);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Could not get canvas context');

      // Use the actual photo resolution
      canvas.width = img.width;
      canvas.height = img.height;

      // 1. Draw original image
      ctx.drawImage(img, 0, 0);

      // 2. Draw transparency gradient for readability
      const footerHeight = canvas.height * 0.15;
      const gradient = ctx.createLinearGradient(0, canvas.height - footerHeight, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.7)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, canvas.height - footerHeight, canvas.width, footerHeight);

      // Scaling factor based on width to keep text proportional
      const scale = canvas.width / 1000;
      const margin = 30 * scale;
      const fontSize = 24 * scale;
      
      const now = new Date();
      const dateStr = now.toLocaleDateString('pt-BR');
      const timeStr = now.toLocaleTimeString('pt-BR');
      const coordsStr = location.latitude 
        ? `${location.latitude.toFixed(6)}, ${location.longitude?.toFixed(6)}`
        : 'GPS INDISPONÍVEL';

      ctx.textBaseline = 'bottom';
      
      // 3. Metadata Left (Company, Date, GPS)
      ctx.textAlign = 'left';
      
      // Company name - Strong white
      ctx.font = `bold ${fontSize * 1.2}px Inter, sans-serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('NORDESTE LOCAÇÕES', margin, canvas.height - margin * 2.8);
      
      // Date and Time - JetBrains Mono for industrial feel
      ctx.font = `${fontSize * 0.85}px "JetBrains+Mono", monospace`;
      ctx.fillStyle = '#E2E8F0'; // slate-200
      ctx.fillText(`${dateStr} - ${timeStr}`, margin, canvas.height - margin * 1.7);
      
      // Coordinates - Yellow highlight for GPS
      ctx.font = `${fontSize * 0.75}px "JetBrains+Mono", monospace`;
      ctx.fillStyle = '#FACC15'; // yellow-400
      ctx.fillText(coordsStr, margin, canvas.height - margin * 0.8);

      // 4. Metadata Right (Asset and Client)
      const rightX = canvas.width - margin;
      ctx.textAlign = 'right';
      
      // Asset ID (Bright Red for visibility)
      ctx.font = `bold ${fontSize * 1.1}px "JetBrains+Mono", monospace`;
      ctx.fillStyle = '#EF4444'; // red-500
      ctx.fillText(`PATRIMÔNIO: ${session.assetId.toUpperCase()}`, rightX, canvas.height - margin * 1.7);
      
      // Client (Slate Gray)
      ctx.font = `${fontSize * 0.8}px Inter, sans-serif`;
      ctx.fillStyle = '#94A3B8'; // slate-400
      ctx.fillText(`CLIENTE: ${session.client.toUpperCase()}`, rightX, canvas.height - margin * 0.8);

      // Export to Blob for better memory management than DataURL
      canvas.toBlob((blob) => {
        if (!blob) return reject('Blob creation failed');
        const finalUrl = URL.createObjectURL(blob);
        const filename = `VISTORIA_${session.assetId}_${session.client.replace(/[^a-z0-9]/gi, '_').toUpperCase()}_${index + 1}.jpg`;
        URL.revokeObjectURL(url);
        resolve({ url: finalUrl, filename });
      }, 'image/jpeg', 0.92);
    };

    img.onerror = () => reject('Image load failed');
    img.src = url;
  });
};
