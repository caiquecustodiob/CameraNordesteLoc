
import { LocationData, StampedImage } from '../types';

export const processImage = async (
  source: HTMLVideoElement | HTMLImageElement,
  location: LocationData,
  patrimonio?: string
): Promise<{ blob: Blob; url: string }> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('Não foi possível obter o contexto do Canvas');

  // 1. Validar Dimensões
  let width = 0;
  let height = 0;

  if (source instanceof HTMLVideoElement) {
    width = source.videoWidth;
    height = source.videoHeight;
  } else {
    width = source.naturalWidth;
    height = source.naturalHeight;
  }

  if (width === 0 || height === 0) {
    throw new Error('Dimensões da imagem inválidas (0x0). Aguarde a câmera carregar.');
  }

  canvas.width = width;
  canvas.height = height;

  // 2. Desenhar a foto original
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR');
  const latStr = location.latitude?.toFixed(6) || '--';
  const lonStr = location.longitude?.toFixed(6) || '--';
  const locStr = location.error ? location.error : `LAT: ${latStr} | LON: ${lonStr}`;

  const margin = canvas.width * 0.04;
  const fontSizeMain = Math.max(20, canvas.width * 0.035);
  const fontSizeSub = Math.max(14, canvas.width * 0.022);

  // 3. Fundo Gradiente
  const footerHeight = canvas.height * 0.22;
  const gradient = ctx.createLinearGradient(0, canvas.height - footerHeight, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.7)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, canvas.height - footerHeight, canvas.width, footerHeight);

  // 4. Estilo do Texto
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 6;
  
  // Esquerda
  ctx.textAlign = 'left';
  let yPosLeft = canvas.height - margin;
  ctx.font = `${fontSizeSub}px sans-serif`;
  ctx.fillText(locStr, margin, yPosLeft);
  yPosLeft -= fontSizeSub + 8;
  ctx.fillText(`${dateStr} - ${timeStr}`, margin, yPosLeft);
  yPosLeft -= fontSizeSub + 12;
  ctx.font = `bold ${fontSizeMain}px sans-serif`;
  ctx.fillText('NORDESTE LOCAÇÕES', margin, yPosLeft);

  // Direita (Patrimônio)
  if (patrimonio) {
    ctx.textAlign = 'right';
    ctx.font = `bold ${fontSizeMain}px sans-serif`;
    ctx.fillStyle = '#FBBF24';
    ctx.fillText(`PATRIMÔNIO: ${patrimonio}`, canvas.width - margin, canvas.height - margin);
  }

  // 5. Exportação com tratamento de erro
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve({ blob, url: URL.createObjectURL(blob) });
        } else {
          // Fallback para toDataURL caso toBlob falhe (comum em sandboxes)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          fetch(dataUrl)
            .then(res => res.blob())
            .then(b => resolve({ blob: b, url: URL.createObjectURL(b) }))
            .catch(() => reject(new Error('Falha total na geração da imagem')));
        }
      }, 'image/jpeg', 0.85);
    } catch (e) {
      reject(new Error('Erro de segurança ao processar imagem (Canvas Tainted)'));
    }
  });
};

export const reprocessWithPatrimonio = async (
  image: StampedImage,
  patrimonio: string
): Promise<StampedImage> => {
  const imgElement = new Image();
  
  // Converter Blob para DataURL antes de carregar na imagem
  // Isso evita erros de CORS/Segurança que ocorrem com URL.createObjectURL em sandboxes
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Erro ao ler blob da imagem'));
    reader.readAsDataURL(image.blob);
  });

  await new Promise((resolve, reject) => {
    imgElement.onload = resolve;
    imgElement.onerror = () => reject(new Error('Erro ao carregar imagem para reprocessamento'));
    imgElement.src = dataUrl;
    setTimeout(() => reject(new Error('Timeout no carregamento da imagem')), 10000);
  });
  
  const result = await processImage(imgElement, image.location, patrimonio);
  
  return {
    ...image,
    blob: result.blob,
    url: result.url,
    patrimonio
  };
};
