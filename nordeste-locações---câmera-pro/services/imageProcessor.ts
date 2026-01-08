
import { LocationData, StampedImage } from '../types';

export const processImage = async (
  source: HTMLVideoElement | HTMLImageElement,
  location: LocationData,
  patrimonio?: string,
  cliente?: string
): Promise<{ blob: Blob; url: string }> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('Não foi possível obter o contexto do Canvas');

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
    throw new Error('Dimensões da imagem inválidas. Aguarde a câmera carregar.');
  }

  canvas.width = width;
  canvas.height = height;

  // Desenha a foto original em tela cheia
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR');
  const latStr = location.latitude?.toFixed(6) || '--';
  const lonStr = location.longitude?.toFixed(6) || '--';
  const locStr = location.error ? location.error : `LAT: ${latStr} | LON: ${lonStr}`;

  // Configurações de design (Escala baseada na largura da imagem)
  const margin = canvas.width * 0.035;
  const fontSizeMain = Math.max(18, canvas.width * 0.03);
  const fontSizeSub = Math.max(12, canvas.width * 0.018);

  // 1. Fundo mais transparente (Efeito Rodapé Sutil)
  // Reduzido de 25% para 15% da altura
  const footerHeight = canvas.height * 0.15;
  const gradient = ctx.createLinearGradient(0, canvas.height - footerHeight, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)'); // Totalmente transparente no início
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)'); // Apenas 40% de opacidade no final
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, canvas.height - footerHeight, canvas.width, footerHeight);

  // 2. Estilo do Texto com Sombra (Garante legibilidade sobre qualquer cor)
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  
  // Informações da Esquerda (Empresa, Data, GPS)
  ctx.textAlign = 'left';
  let yPosLeft = canvas.height - margin;
  
  // Localização e GPS
  ctx.font = `${fontSizeSub}px sans-serif`;
  ctx.fillText(locStr, margin, yPosLeft);
  
  // Data e Hora
  yPosLeft -= fontSizeSub + 6;
  ctx.font = `${fontSizeSub}px sans-serif`;
  ctx.fillText(`${dateStr} - ${timeStr}`, margin, yPosLeft);
  
  // Marca
  yPosLeft -= fontSizeSub + 10;
  ctx.font = `bold ${fontSizeMain}px sans-serif`;
  ctx.fillText('NORDESTE LOCAÇÕES', margin, yPosLeft);

  // Informações da Direita (Patrimônio e Cliente)
  ctx.textAlign = 'right';
  let yPosRight = canvas.height - margin;

  if (cliente) {
    ctx.font = `${fontSizeSub}px sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText(`CLIENTE: ${cliente.toUpperCase()}`, canvas.width - margin, yPosRight);
    yPosRight -= fontSizeSub + 8;
  }

  if (patrimonio) {
    ctx.font = `bold ${fontSizeMain}px sans-serif`;
    ctx.fillStyle = '#FBBF24'; // Mantemos o amarelo para destaque rápido, mas com sombra
    ctx.fillText(`PATRIMÔNIO: ${patrimonio.toUpperCase()}`, canvas.width - margin, yPosRight);
  }

  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve({ blob, url: URL.createObjectURL(blob) });
        } else {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          fetch(dataUrl)
            .then(res => res.blob())
            .then(b => resolve({ blob: b, url: URL.createObjectURL(b) }))
            .catch(() => reject(new Error('Falha na geração da imagem')));
        }
      }, 'image/jpeg', 0.85);
    } catch (e) {
      reject(new Error('Erro de segurança ao processar imagem'));
    }
  });
};

export const reprocessWithPatrimonio = async (
  image: StampedImage,
  patrimonio: string,
  cliente: string
): Promise<StampedImage> => {
  const imgElement = new Image();
  
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Erro ao ler dados da imagem'));
    reader.readAsDataURL(image.blob);
  });

  await new Promise((resolve, reject) => {
    imgElement.onload = resolve;
    imgElement.onerror = () => reject(new Error('Erro ao carregar imagem'));
    imgElement.src = dataUrl;
  });
  
  const result = await processImage(imgElement, image.location, patrimonio, cliente);
  
  return {
    ...image,
    blob: result.blob,
    url: result.url,
    patrimonio,
    cliente
  };
};
