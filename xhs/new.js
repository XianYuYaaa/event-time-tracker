(function (global) {
  const CARD_WIDTH = 360;
  const CARD_HEIGHT = 480;

  function hexToRgba(hex, alpha) {
    const raw = String(hex || '').replace('#', '').trim();
    const normalized = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
    const value = parseInt(normalized, 16);
    if (Number.isNaN(value)) return `rgba(0, 0, 0, ${alpha})`;
    return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
  }

  function withCtx(ctx, fn) {
    ctx.save();
    fn();
    ctx.restore();
  }

  function drawRoundedRect(ctx, x, y, width, height, radius, fillStyle, strokeStyle) {
    const r = typeof radius === 'number' ? { tl: radius, tr: radius, br: radius, bl: radius } : { tl: 0, tr: 0, br: 0, bl: 0, ...radius };
    ctx.beginPath();
    ctx.moveTo(x + r.tl, y);
    ctx.lineTo(x + width - r.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r.tr);
    ctx.lineTo(x + width, y + height - r.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r.br, y + height);
    ctx.lineTo(x + r.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r.bl);
    ctx.lineTo(x, y + r.tl);
    ctx.quadraticCurveTo(x, y, x + r.tl, y);
    ctx.closePath();
    if (fillStyle) {
      ctx.fillStyle = fillStyle;
      ctx.fill();
    }
    if (strokeStyle) {
      ctx.strokeStyle = strokeStyle;
      ctx.stroke();
    }
  }

  function drawPageNumber(ctx, width, height, index, totalCount, config, options) {
    if (!config.showPageNumber) return;
    const settings = { color: 'rgba(128,128,128,0.5)', font: '500 12px sans-serif', textAlign: 'right', x: width - 24, y: height - 24, prefix: '', suffix: '', padZero: false, ...options };
    const format = settings.padZero ? (n) => String(n).padStart(2, '0') : (n) => String(n);
    ctx.save();
    ctx.fillStyle = settings.color;
    ctx.font = settings.font;
    ctx.textAlign = settings.textAlign;
    ctx.fillText(`${settings.prefix}${format(index + 1)} / ${format(Math.max(totalCount, 1))}${settings.suffix}`, settings.x, settings.y);
    ctx.restore();
  }

  function createNoiseTexture(width, height, alpha) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.globalAlpha = alpha;
    for (let i = 0; i < 4500; i += 1) {
      ctx.fillStyle = Math.random() > 0.5 ? '#000000' : '#ffffff';
      ctx.fillRect(Math.random() * width, Math.random() * height, 1.2, 1.2);
    }
    return canvas;
  }

  function createPaperTexture(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.globalAlpha = 0.06;
    for (let i = 0; i < 6000; i += 1) {
      const size = Math.random() * 1.3;
      ctx.fillStyle = Math.random() > 0.5 ? '#8b4513' : '#000000';
      ctx.fillRect(Math.random() * width, Math.random() * height, size, size);
    }
    ctx.globalAlpha = 0.04;
    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 0.35;
    for (let i = 0; i < 160; i += 1) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const len = 4 + Math.random() * 10;
      const angle = Math.random() * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + Math.cos(angle) * (len / 3), y + Math.sin(angle) * (len / 3), x + Math.cos(angle) * len, y + Math.sin(angle) * len);
      ctx.stroke();
    }
    return canvas;
  }

  function fillBaseBackground(ctx, width, height, config) {
    ctx.fillStyle = config.bgColor || '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }

  function projectConfig(theme) {
    return { showPageNumber: theme.showPageNumber !== false };
  }

  function makeHtmlTheme(theme) {
    return {
      ...theme,
      source: 'standalone',
      drawBackground(ctx, width, height, currentTheme) {
        const gradients = [
          { x: width * 0.2, y: height * 0.3, r: width * 0.6, color: currentTheme.colorPalette[0] },
          { x: width * 0.8, y: height * 0.2, r: width * 0.5, color: currentTheme.colorPalette[2] },
          { x: width * 0.5, y: height * 0.8, r: width * 0.7, color: currentTheme.colorPalette[4] },
          { x: width * 0.1, y: height * 0.9, r: width * 0.4, color: currentTheme.colorPalette[6] },
          { x: width * 0.9, y: height * 0.7, r: width * 0.5, color: currentTheme.colorPalette[8] }
        ];
        gradients.forEach((item) => {
          const gradient = ctx.createRadialGradient(item.x, item.y, 0, item.x, item.y, item.r);
          gradient.addColorStop(0, `${item.color}66`);
          gradient.addColorStop(1, `${item.color}00`);
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
        });
      }
    };
  }

  const themes = {
    pink: makeHtmlTheme({ id: 'pink', name: 'Pink', bgOuter: '#fef2f2', bgCard: '#ffffff', primary: '#ff2442', accent: '#ff4d6d', secondary: '#595959', tagBg: '#ffe4e6', accentBorder: '#fecdd3', btnFrom: '#ff2442', btnTo: '#e11d48', fontFamily: "'Noto Sans SC', sans-serif", colorPalette: ['#FFF5F5', '#FFE4E6', '#FECDD3', '#FDA4AF', '#FB7185', '#FEF2F2', '#FFF1F2', '#FFE4E8', '#FFD1D9', '#FBC8D0', '#FED7DD', '#FECDD6'] }),
    macaron: makeHtmlTheme({ id: 'macaron', name: 'Macaron', bgOuter: '#fce7f3', bgCard: '#fdf2f8', primary: '#be185d', accent: '#db2777', secondary: '#831843', tagBg: '#fbcfe8', accentBorder: '#f9a8d4', btnFrom: '#db2777', btnTo: '#be185d', fontFamily: "'Noto Sans SC', sans-serif", colorPalette: ['#FCE7F3', '#FBCFE8', '#F9A8D4', '#F472B6', '#EC4899', '#FDF2F8', '#FCE8F3', '#FEF1F6', '#FDE6F3', '#F9D5E8', '#FACDE5', '#F5B8D4'] }),
    ocean: makeHtmlTheme({ id: 'ocean', name: 'Ocean', bgOuter: '#e8f4f8', bgCard: '#f0f8ff', primary: '#1e88e5', accent: '#42a5f5', secondary: '#37474f', tagBg: '#e3f2fd', accentBorder: '#bbdefb', btnFrom: '#1e88e5', btnTo: '#42a5f5', fontFamily: "'Noto Sans SC', sans-serif", colorPalette: ['#E3F2FD', '#E1F5FE', '#E0F7FA', '#E8F5E9', '#F1F8E9', '#F3E5F5', '#EDE7F6', '#FFF8E1', '#FFF3E0', '#FBE9E7', '#FCE4EC', '#F8BBD9'] }),
    forest: makeHtmlTheme({ id: 'forest', name: 'Forest', bgOuter: '#e8f5e9', bgCard: '#f1f8f4', primary: '#2e7d32', accent: '#66bb6a', secondary: '#424242', tagBg: '#e8f5e9', accentBorder: '#c8e6c9', btnFrom: '#2e7d32', btnTo: '#66bb6a', fontFamily: "'Noto Sans SC', sans-serif", colorPalette: ['#E8F5E9', '#F1F8E9', '#F9FBE7', '#FFFDE7', '#FFF8E1', '#FFF3E0', '#E0F2F1', '#E0F7FA', '#E8EAF6', '#EDE7F6', '#F3E5F5', '#FCE4EC'] }),
    sunset: makeHtmlTheme({ id: 'sunset', name: 'Sunset', bgOuter: '#fff3e0', bgCard: '#fffaf5', primary: '#e64a19', accent: '#ff7043', secondary: '#5d4037', tagBg: '#ffe0b2', accentBorder: '#ffccbc', btnFrom: '#e64a19', btnTo: '#ff7043', fontFamily: "'Noto Sans SC', sans-serif", colorPalette: ['#FFF3E0', '#FBE9E7', '#FFECB3', '#FFF8E1', '#FFFDE7', '#FFF9C4', '#FFECB3', '#FFE0B2', '#FFCCBC', '#FFCDD2', '#F8BBD9', '#E1BEE7'] }),
    midnight: makeHtmlTheme({ id: 'midnight', name: 'Midnight', bgOuter: '#1a1a2e', bgCard: '#16213e', primary: '#e94560', accent: '#0f3460', secondary: '#c4c4c4', tagBg: '#1a1a2e', accentBorder: '#2a2a4e', btnFrom: '#e94560', btnTo: '#0f3460', fontFamily: "'Noto Sans SC', sans-serif", colorPalette: ['#2D2D5A', '#252548', '#1F1F3D', '#3D3D6B', '#4A4A8A', '#5C5CA3', '#3949AB', '#5C6BC0', '#7986CB', '#9FA8DA', '#1A237E', '#283593'] }),
    polaroid: { id: 'polaroid', name: '复古拍立得', source: 'project', bgOuter: '#d9d9d9', bgCard: '#D6D6D6', bgColor: '#D6D6D6', textColor: '#2B2B2B', primary: '#D9534F', accent: '#D9534F', secondary: '#2B2B2B', tagBg: '#f3ebe7', accentBorder: '#d8cdc7', btnFrom: '#D9534F', btnTo: '#a94442', fontFamily: "'LXGW WenKai Screen', 'Kaiti SC', 'STKaiti', cursive", fontSize: 17, lineHeight: 1.6, letterSpacing: 0.2, textPadding: 60, showPageNumber: true,
      drawBackground(ctx, width, height, theme) { fillBaseBackground(ctx, width, height, theme); ctx.drawImage(createNoiseTexture(width, height, 0.04), 0, 0); withCtx(ctx, () => { ctx.shadowColor = 'rgba(0,0,0,0.15)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 12; drawRoundedRect(ctx, 50, 60, width - 100, height - 120, 4, '#FAFAFA'); }); ctx.fillStyle = '#2C2C2C'; ctx.fillRect(80, 90, width - 160, Math.max(92, height - 570)); },
      drawForeground(ctx, width, height, index, totalCount, theme) { withCtx(ctx, () => { ctx.translate(width / 2, 40); ctx.rotate(-0.05); ctx.fillStyle = 'rgba(255,255,255,0.42)'; ctx.fillRect(-70, -16, 140, 32); }); drawPageNumber(ctx, width, height, index, totalCount, projectConfig(theme), { x: width - 75, y: height - 78, color: 'rgba(0,0,0,0.3)', font: 'italic 14px serif', padZero: true }); } },
    'notion-style': { id: 'notion-style', name: '效率笔记', source: 'project', bgOuter: '#f6f5f3', bgCard: '#FFFFFF', bgColor: '#FFFFFF', textColor: '#37352F', primary: '#0F7B6C', accent: '#0F7B6C', secondary: '#37352F', tagBg: '#eef4f2', accentBorder: '#d9ebe6', btnFrom: '#0F7B6C', btnTo: '#0b5f54', fontFamily: "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif", fontSize: 16, lineHeight: 1.8, letterSpacing: 0.2, textPadding: 40, showPageNumber: true,
      drawBackground(ctx, width, height, theme) { fillBaseBackground(ctx, width, height, theme); },
      drawForeground(ctx, width, height, index, totalCount, theme) { withCtx(ctx, () => { ctx.font = '14px ui-sans-serif, system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#37352F'; ctx.fillText('N', 40, 60); ctx.fillStyle = '#9B9A97'; ctx.fillText('/ Workspace / Notes', 62, 60); ctx.strokeStyle = 'rgba(55,53,47,0.08)'; ctx.beginPath(); ctx.moveTo(40, 90); ctx.lineTo(width - 40, 90); ctx.stroke(); }); drawPageNumber(ctx, width, height, index, totalCount, projectConfig(theme), { color: 'rgba(155,154,151,0.7)' }); } },
    'elegant-book': { id: 'elegant-book', name: '书籍内页', source: 'project', bgOuter: '#f6f1e8', bgCard: '#FDFBF7', bgColor: '#FDFBF7', textColor: '#2B2B2B', primary: '#8C3A3A', accent: '#8C3A3A', secondary: '#2B2B2B', tagBg: '#f4ece1', accentBorder: '#dbcdbf', btnFrom: '#8C3A3A', btnTo: '#6e2d2d', fontFamily: "'Noto Serif SC', 'Source Han Serif SC', serif", fontSize: 17, lineHeight: 1.9, letterSpacing: 0.2, textPadding: 55, showPageNumber: true,
      drawBackground(ctx, width, height, theme) { const grad = ctx.createLinearGradient(width, 0, 0, 0); grad.addColorStop(0, theme.bgColor); grad.addColorStop(1, hexToRgba(theme.bgColor, 0.96)); ctx.fillStyle = grad; ctx.fillRect(0, 0, width, height); ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(createPaperTexture(width, height), 0, 0); ctx.globalCompositeOperation = 'source-over'; const gutter = ctx.createLinearGradient(0, 0, width * 0.12, 0); gutter.addColorStop(0, 'rgba(0,0,0,0.15)'); gutter.addColorStop(0.3, 'rgba(0,0,0,0.06)'); gutter.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gutter; ctx.fillRect(0, 0, width * 0.12, height); },
      drawForeground(ctx, width, height, index, totalCount, theme) { withCtx(ctx, () => { ctx.strokeStyle = 'rgba(93,64,55,0.12)'; ctx.beginPath(); ctx.moveTo(65, 80); ctx.lineTo(width - 55, 80); ctx.stroke(); ctx.fillStyle = 'rgba(93,64,55,0.4)'; ctx.font = 'italic 500 11px \"Noto Serif SC\", serif'; ctx.textAlign = 'center'; ctx.fillText('CLASSIC LITERATURE', width / 2, 64); ctx.fillStyle = '#5D4037'; ctx.font = '16px serif'; ctx.fillText('§', 65, 68); }); drawPageNumber(ctx, width, height, index, totalCount, projectConfig(theme), { color: 'rgba(93,64,55,0.4)', font: '500 12px \"Noto Serif SC\", serif', prefix: 'P. ', padZero: true }); } },
    'ios-memo': { id: 'ios-memo', name: '苹果备忘录', source: 'project', bgOuter: '#ebecef', bgCard: '#F2F2F7', bgColor: '#F2F2F7', textColor: '#1C1C1E', primary: '#FF9500', accent: '#FF9500', secondary: '#1C1C1E', tagBg: '#fff0db', accentBorder: '#ffd29a', btnFrom: '#FF9500', btnTo: '#ff6a00', fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif", fontSize: 18, lineHeight: 1.6, letterSpacing: 0, textPadding: 30, showPageNumber: true,
      drawBackground(ctx, width, height, theme) { fillBaseBackground(ctx, width, height, theme); withCtx(ctx, () => { ctx.shadowColor = 'rgba(0,0,0,0.05)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 5; drawRoundedRect(ctx, 15, 55, width - 30, height - 110, 12, '#ffffff'); }); withCtx(ctx, () => { ctx.strokeStyle = '#F2F2F7'; const lineSpacing = 18 * 1.6; for (let y = 55 + 30 + lineSpacing; y < height - 55; y += lineSpacing) { ctx.beginPath(); ctx.moveTo(15, y); ctx.lineTo(width - 15, y); ctx.stroke(); } }); },
      drawForeground(ctx, width, height, index, totalCount, theme) { const now = new Date(); withCtx(ctx, () => { ctx.fillStyle = '#FF9500'; ctx.font = '500 17px sans-serif'; ctx.textAlign = 'right'; ctx.fillText('完成', width - 24, 34); ctx.textAlign = 'left'; ctx.beginPath(); ctx.strokeStyle = '#FF9500'; ctx.lineWidth = 2.5; ctx.moveTo(25, 33); ctx.lineTo(18, 26); ctx.lineTo(25, 19); ctx.stroke(); ctx.fillText('备忘录', 32, 35); ctx.fillStyle = '#8E8E93'; ctx.font = '500 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`, width / 2, 35); }); drawPageNumber(ctx, width, height, index, totalCount, projectConfig(theme)); } },
    'swiss-studio': { id: 'swiss-studio', name: '苏黎世工作室', source: 'project', bgOuter: '#ededed', bgCard: '#F2F2F2', bgColor: '#F2F2F2', textColor: '#1A1A1A', primary: '#FF4500', accent: '#FF4500', secondary: '#1A1A1A', tagBg: '#fff1ea', accentBorder: '#ffd3c2', btnFrom: '#FF4500', btnTo: '#cc3600', fontFamily: "-apple-system, Helvetica, Arial, sans-serif", fontSize: 17, lineHeight: 1.5, letterSpacing: 0.2, textPadding: 50, showPageNumber: true,
      drawBackground(ctx, width, height, theme) { fillBaseBackground(ctx, width, height, theme); ctx.fillStyle = theme.accent; ctx.fillRect(0, 0, 6, height); withCtx(ctx, () => { ctx.strokeStyle = 'rgba(0,0,0,0.03)'; for (let x = 40; x < width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); } }); },
      drawForeground(ctx, width, height, index, totalCount, theme) { withCtx(ctx, () => { ctx.fillStyle = '#1A1A1A'; ctx.font = '700 10px Helvetica'; ctx.textAlign = 'right'; ctx.fillText('REF. CH-8004', width - 24, 24); ctx.beginPath(); ctx.rect(width - 40, height - 40, 15, 15); ctx.strokeStyle = theme.accent; ctx.lineWidth = 2; ctx.stroke(); }); drawPageNumber(ctx, width, height, index, totalCount, projectConfig(theme), { color: '#1A1A1A', font: '700 10px Helvetica', textAlign: 'left', x: 24, padZero: true }); } },
    'minimalist-magazine': { id: 'minimalist-magazine', name: '极简杂志', source: 'project', bgOuter: '#f7f7f7', bgCard: '#FFFFFF', bgColor: '#FFFFFF', textColor: '#1A1A1A', primary: '#1A1A1A', accent: '#1A1A1A', secondary: '#1A1A1A', tagBg: '#f0f0f0', accentBorder: '#d8d8d8', btnFrom: '#1A1A1A', btnTo: '#444444', fontFamily: "'Noto Serif SC', serif", fontSize: 17, lineHeight: 1.8, letterSpacing: 0.3, textPadding: 45, showPageNumber: true,
      drawBackground(ctx, width, height, theme) { fillBaseBackground(ctx, width, height, theme); ctx.strokeStyle = hexToRgba(theme.textColor, 0.1); ctx.beginPath(); ctx.moveTo(45, 85); ctx.lineTo(width - 45, 85); ctx.stroke(); ctx.beginPath(); ctx.moveTo(45, height - 55); ctx.lineTo(width - 45, height - 55); ctx.stroke(); },
      drawForeground(ctx, width, height, index, totalCount, theme) { withCtx(ctx, () => { ctx.fillStyle = '#1A1A1A'; ctx.font = 'bold 12px serif'; ctx.textAlign = 'left'; ctx.fillText('EDITORIAL', 45, 74); ctx.fillStyle = 'rgba(26,26,26,0.6)'; ctx.font = 'italic 10px serif'; ctx.textAlign = 'right'; ctx.fillText('COLLECTION // VOL. 2026', width - 45, 74); }); drawPageNumber(ctx, width, height, index, totalCount, projectConfig(theme), { x: width - 45, y: height - 35 }); } },
    'aura-gradient': { id: 'aura-gradient', name: '弥散极光', source: 'project', bgOuter: '#f5f3f1', bgCard: '#FFFFFF', bgColor: '#FFFFFF', textColor: '#2D3436', primary: '#2D3436', accent: '#2D3436', secondary: '#2D3436', tagBg: '#eff1f2', accentBorder: '#d8dfe2', btnFrom: '#2D3436', btnTo: '#58636b', fontFamily: "inherit", fontSize: 17, lineHeight: 1.7, letterSpacing: 0.3, textPadding: 35, showPageNumber: true,
      drawBackground(ctx, width, height, theme) { fillBaseBackground(ctx, width, height, theme); [{ x: 0, y: 0, r: 1, c1: 'rgba(255,195,160,0.3)', c2: 'rgba(255,195,160,0)' }, { x: 1, y: 0.2, r: 0.8, c1: 'rgba(255,175,189,0.25)', c2: 'rgba(255,175,189,0)' }, { x: 0.5, y: 1, r: 1.2, c1: 'rgba(33,147,176,0.15)', c2: 'rgba(33,147,176,0)' }].forEach((item) => { const grad = ctx.createRadialGradient(width * item.x, height * item.y, 0, width * item.x, height * item.y, width * item.r); grad.addColorStop(0, item.c1); grad.addColorStop(1, item.c2); ctx.fillStyle = grad; ctx.fillRect(0, 0, width, height); }); ctx.drawImage(createNoiseTexture(width, height, 0.04), 0, 0); withCtx(ctx, () => { ctx.shadowColor = 'rgba(0,0,0,0.03)'; ctx.shadowBlur = 28; ctx.shadowOffsetY = 10; drawRoundedRect(ctx, 25, 30, width - 50, height - 65, 28, 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0.45)'); }); },
      drawForeground(ctx, width, height, index, totalCount, theme) { drawPageNumber(ctx, width, height, index, totalCount, projectConfig(theme)); } },
    'deep-night': { id: 'deep-night', name: '暗夜深思', source: 'project', bgOuter: '#090909', bgCard: '#0D0D0D', bgColor: '#0D0D0D', textColor: '#E5E5E5', primary: '#00F5FF', accent: '#00F5FF', secondary: '#E5E5E5', tagBg: '#141414', accentBorder: '#1f1f1f', btnFrom: '#00F5FF', btnTo: '#0080a8', fontFamily: "-apple-system, system-ui, sans-serif", fontSize: 17, lineHeight: 1.7, letterSpacing: 0.4, textPadding: 40, showPageNumber: true,
      drawBackground(ctx, width, height, theme) { const grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.8); grad.addColorStop(0, '#1a1a1a'); grad.addColorStop(1, '#050505'); ctx.fillStyle = grad; ctx.fillRect(0, 0, width, height); const line = ctx.createLinearGradient(0, 0, 0, height); line.addColorStop(0, 'transparent'); line.addColorStop(0.2, theme.accent); line.addColorStop(0.8, theme.accent); line.addColorStop(1, 'transparent'); ctx.fillStyle = line; ctx.globalAlpha = 0.3; ctx.fillRect(0, 0, 3, height); ctx.globalAlpha = 1; drawRoundedRect(ctx, 20, 30, width - 40, height - 65, 16, 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0.05)'); },
      drawForeground(ctx, width, height, index, totalCount, theme) { withCtx(ctx, () => { ctx.fillStyle = 'rgba(229,229,229,0.3)'; ctx.font = '800 10px Inter, sans-serif'; ctx.textAlign = 'right'; ctx.fillText('// THOUGHT MODE ON', width - 24, 24); ctx.strokeStyle = 'rgba(229,229,229,0.2)'; ctx.beginPath(); ctx.moveTo(25, height - 60); ctx.lineTo(width - 25, height - 60); ctx.stroke(); }); drawPageNumber(ctx, width, height, index, totalCount, projectConfig(theme), { color: 'rgba(255,255,255,0.3)', textAlign: 'left', x: 25, y: 25 }); } },
    'pro-doc': { id: 'pro-doc', name: '大厂文档', source: 'project', bgOuter: '#f1f5f9', bgCard: '#F9FAFB', bgColor: '#F9FAFB', textColor: '#111827', primary: '#0066FF', accent: '#0066FF', secondary: '#111827', tagBg: '#edf4ff', accentBorder: '#cadfff', btnFrom: '#0066FF', btnTo: '#004fc7', fontFamily: "-apple-system, system-ui, 'Inter', sans-serif", fontSize: 17, lineHeight: 1.7, letterSpacing: 0.2, textPadding: 35, showPageNumber: true,
      drawBackground(ctx, width, height, theme) { fillBaseBackground(ctx, width, height, theme); withCtx(ctx, () => { ctx.strokeStyle = 'rgba(0,102,255,0.02)'; for (let i = 0; i < width; i += 20) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke(); } for (let i = 0; i < height; i += 20) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke(); } }); withCtx(ctx, () => { ctx.shadowColor = 'rgba(0,0,0,0.08)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10; drawRoundedRect(ctx, 15, 40, width - 30, height - 75, 12, '#ffffff', 'rgba(0,0,0,0.05)'); }); drawRoundedRect(ctx, 15, 40, width - 30, 30, { tl: 12, tr: 12, bl: 0, br: 0 }, 'rgba(17,24,39,0.05)'); [['#FF5F56', 35], ['#FFBD2E', 53], ['#27C93F', 71]].forEach(([color, x]) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, 55, 5, 0, Math.PI * 2); ctx.fill(); }); ctx.fillStyle = 'rgba(17,24,39,0.4)'; ctx.font = '700 10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('DOCUMENT VIEWER', width / 2, 59); },
      drawForeground(ctx, width, height, index, totalCount, theme) { withCtx(ctx, () => { ctx.fillStyle = '#6B7280'; ctx.font = '700 9px sans-serif'; ctx.textAlign = 'right'; ctx.fillText('CONFIDENTIAL / INTERNAL USE ONLY', width - 24, 24); }); drawPageNumber(ctx, width, height, index, totalCount, projectConfig(theme)); } },
    blank: { id: 'blank', name: '空白模板', source: 'project', bgOuter: '#f6f6f6', bgCard: '#FFFFFF', bgColor: '#FFFFFF', textColor: '#1A1A1A', primary: '#1A1A1A', accent: '#999999', secondary: '#1A1A1A', tagBg: '#f2f2f2', accentBorder: '#dddddd', btnFrom: '#1A1A1A', btnTo: '#555555', fontFamily: "inherit", fontSize: 16, lineHeight: 1.8, letterSpacing: 0.5, textPadding: 35, showPageNumber: true,
      drawBackground(ctx, width, height, theme) { fillBaseBackground(ctx, width, height, theme); },
      drawForeground(ctx, width, height, index, totalCount, theme) { drawPageNumber(ctx, width, height, index, totalCount, projectConfig(theme)); } }
  };

  const themeOrder = ['pink', 'macaron', 'ocean', 'forest', 'sunset', 'midnight', 'polaroid', 'notion-style', 'elegant-book', 'ios-memo', 'swiss-studio', 'minimalist-magazine', 'aura-gradient', 'deep-night', 'pro-doc', 'blank'];

  function getTheme(themeId) {
    return themes[themeId] || themes.pink;
  }

  function listThemes() {
    return themeOrder.map((id) => themes[id]).filter(Boolean);
  }

  function applyTheme(themeId, options) {
    const settings = { root: document.documentElement, body: document.body, ...options };
    const theme = getTheme(themeId);
    settings.root.style.setProperty('--primary', theme.primary);
    settings.root.style.setProperty('--accent', theme.accent);
    settings.root.style.setProperty('--secondary', theme.secondary || theme.textColor);
    settings.root.style.setProperty('--tag-bg', theme.tagBg);
    settings.root.style.setProperty('--accent-border', theme.accentBorder);
    settings.root.style.setProperty('--btn-from', theme.btnFrom);
    settings.root.style.setProperty('--btn-to', theme.btnTo);
    settings.root.style.setProperty('--bg-card', theme.bgCard);
    settings.root.style.setProperty('--template-bg-color', theme.bgCard);
    settings.root.style.setProperty('--template-text-color', theme.textColor || theme.secondary);
    settings.root.style.setProperty('--template-font-family', theme.fontFamily || "'Noto Sans SC', sans-serif");
    settings.root.style.setProperty('--template-font-size', `${theme.fontSize || 16}px`);
    settings.root.style.setProperty('--template-line-height', String(theme.lineHeight || 1.6));
    settings.root.style.setProperty('--template-letter-spacing', `${theme.letterSpacing || 0}px`);
    settings.root.style.setProperty('--text-padding', `${theme.textPadding || 35}px`);
    settings.body.style.backgroundColor = theme.bgOuter;
    settings.body.style.color = theme.textColor || theme.secondary;
    settings.body.style.fontFamily = theme.fontFamily || "'Noto Sans SC', sans-serif";
    return theme;
  }

  function getContentRect(themeId, options) {
    const theme = getTheme(themeId);
    const width = options && options.width ? options.width : CARD_WIDTH;
    const height = options && options.height ? options.height : CARD_HEIGHT;
    const padding = theme.textPadding || 35;

    switch (themeId) {
      case 'polaroid': {
        const marginX = 50;
        const marginY = 60;
        const bottomBlankHeight = 450;
        const photoHeight = height - (marginY * 2) - bottomBlankHeight;
        return {
          x: marginX + padding,
          y: marginY + photoHeight + 40,
          width: width - (marginX * 2) - (padding * 2),
          height: bottomBlankHeight - 120
        };
      }
      case 'notion-style':
        return { x: padding, y: 120, width: width - (padding * 2), height: height - 120 - 80 };
      case 'elegant-book':
        return { x: padding + 10, y: 130, width: width - (padding * 2) - 10, height: height - 130 - 110 };
      case 'ios-memo': {
        const paperX = 15;
        const paperY = 55;
        const paperW = width - 30;
        const paperH = height - 110;
        return {
          x: paperX + padding,
          y: paperY + padding,
          width: paperW - (padding * 2),
          height: paperH - (padding * 2)
        };
      }
      case 'swiss-studio': {
        const bottomOffset = Math.max(padding, 60);
        return { x: padding, y: padding, width: width - (padding * 2), height: height - padding - bottomOffset };
      }
      case 'minimalist-magazine':
        return { x: padding, y: 100, width: width - (padding * 2), height: height - 100 - 80 };
      case 'aura-gradient':
        return { x: 25 + padding, y: 30 + padding, width: width - 50 - (padding * 2), height: height - 30 - 60 - (padding * 2) };
      case 'deep-night':
        return { x: 20 + padding, y: 30 + padding, width: width - 40 - (padding * 2), height: height - 30 - 60 - (padding * 2) };
      case 'pro-doc': {
        const winX = 15;
        const winW = width - 30;
        const winY = 40;
        const winBottomMargin = 60;
        const winH = height - winY - winBottomMargin;
        const headerHeight = 30;
        const gapBelowHeader = 20;
        return {
          x: winX + padding,
          y: winY + headerHeight + gapBelowHeader + (padding / 2),
          width: winW - (padding * 2),
          height: (winH - headerHeight - gapBelowHeader) - padding
        };
      }
      case 'blank':
      case 'pink':
      case 'macaron':
      case 'ocean':
      case 'forest':
      case 'sunset':
      case 'midnight':
      default:
        return { x: 24, y: 24, width: width - 48, height: height - 48 };
    }
  }

  function renderThemeCanvases(themeId, payload) {
    const theme = getTheme(themeId);
    const { backgroundCanvas, overlayCanvas, index = 0, totalCount = 1 } = payload;
    if (backgroundCanvas) {
      const bgCtx = backgroundCanvas.getContext('2d');
      bgCtx.clearRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
      if (theme.drawBackground) {
        theme.drawBackground(bgCtx, backgroundCanvas.width, backgroundCanvas.height, theme);
      }
    }
    if (overlayCanvas) {
      const fgCtx = overlayCanvas.getContext('2d');
      fgCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
      if (theme.drawForeground) {
        theme.drawForeground(fgCtx, overlayCanvas.width, overlayCanvas.height, index, totalCount, theme);
      }
    }
  }

  global.XHSStandaloneThemes = { CARD_WIDTH, CARD_HEIGHT, getTheme, listThemes, applyTheme, getContentRect, renderThemeCanvases };
}(window));
