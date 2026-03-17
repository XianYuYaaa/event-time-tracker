/**
 * XHSStandaloneThemes - 小红书卡片主题库（精简版）
 * 
 * 新增功能：
 * - 每个模板定义 contentBox 属性，指定内容区域的位置和尺寸
 * - applyTheme() 自动设置 CSS 变量，让内容自适应模板布局
 * - 支持动态卡片高度（非封面卡片根据内容自动延展）
 */
(function (global) {
  const CARD_WIDTH = 360;
  const CARD_MIN_HEIGHT = 480;

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

  // 默认内容区域（无偏移）
  const defaultContentBox = {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 24,
    paddingBottom: 24,
    paddingLeft: 24,
    paddingRight: 24
  };

  function makeHtmlTheme(theme) {
    return {
      ...theme,
      source: 'standalone',
      contentBox: theme.contentBox || defaultContentBox,
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
    
    // 效率笔记 - 内容区域在分隔线下方
    'notion-style': { 
      id: 'notion-style', 
      name: '效率笔记', 
      source: 'project', 
      bgOuter: '#f6f5f3', 
      bgCard: '#FFFFFF', 
      bgColor: '#FFFFFF', 
      textColor: '#37352F', 
      primary: '#0F7B6C', 
      accent: '#0F7B6C', 
      secondary: '#37352F', 
      tagBg: '#eef4f2', 
      accentBorder: '#d9ebe6', 
      btnFrom: '#0F7B6C', 
      btnTo: '#0b5f54', 
      fontFamily: "'Noto Sans SC', sans-serif",  
      fontSize: 16, 
      lineHeight: 1.8, 
      letterSpacing: 0.2, 
      textPadding: 40, 
      showPageNumber: true,
      contentBox: {
        top: 40,
        left: 0,
        right: 0,
        bottom: 30,
        paddingTop: 5,
        paddingBottom: 20,
        paddingLeft: 30,
        paddingRight: 40
      },
      drawBackground(ctx, width, height, theme) { 
        fillBaseBackground(ctx, width, height, theme); 
      },
      drawForeground(ctx, width, height, index, totalCount, theme) { 
      } 
    },
    
    // 书籍内页 - 内容区域考虑顶部装饰和页码
    'elegant-book': { 
      id: 'elegant-book', 
      name: '书籍内页', 
      source: 'project', 
      bgOuter: '#f6f1e8', 
      bgCard: '#FDFBF7', 
      bgColor: '#FDFBF7', 
      textColor: '#2B2B2B', 
      primary: '#8C3A3A', 
      accent: '#8C3A3A', 
      secondary: '#2B2B2B', 
      tagBg: '#f4ece1', 
      accentBorder: '#dbcdbf', 
      btnFrom: '#8C3A3A', 
      btnTo: '#6e2d2d', 
      fontFamily: "'Noto Serif SC', 'Source Han Serif SC', serif", 
      fontSize: 17, 
      lineHeight: 1.9, 
      letterSpacing: 0.2, 
      textPadding: 55, 
      showPageNumber: true,
      contentBox: {
        top: 40,
        left: 0,
        right: 0,
        bottom: 40,
        paddingTop: 5,
        paddingBottom: 20,
        paddingLeft: 35,
        paddingRight: 30
      },
      drawBackground(ctx, width, height, theme) { 
        const grad = ctx.createLinearGradient(width, 0, 0, 0); 
        grad.addColorStop(0, theme.bgColor); 
        grad.addColorStop(1, hexToRgba(theme.bgColor, 0.96)); 
        ctx.fillStyle = grad; 
        ctx.fillRect(0, 0, width, height); 
        ctx.globalCompositeOperation = 'multiply'; 
        ctx.drawImage(createPaperTexture(width, height), 0, 0); 
        ctx.globalCompositeOperation = 'source-over'; 
        const gutter = ctx.createLinearGradient(0, 0, width * 0.12, 0); 
        gutter.addColorStop(0, 'rgba(0,0,0,0.15)'); 
        gutter.addColorStop(0.3, 'rgba(0,0,0,0.06)'); 
        gutter.addColorStop(1, 'rgba(0,0,0,0)'); 
        ctx.fillStyle = gutter; 
        ctx.fillRect(0, 0, width * 0.12, height); 
      },
      drawForeground(ctx, width, height, index, totalCount, theme) { 
      } 
    },
    
    // 苹果备忘录 - 内容区域在白色纸张内，顶部有日期栏
    'ios-memo': { 
      id: 'ios-memo', 
      name: '苹果备忘录', 
      source: 'project', 
      bgOuter: '#ebecef', 
      bgCard: '#F2F2F7', 
      bgColor: '#F2F2F7', 
      textColor: '#1C1C1E', 
      primary: '#FF9500', 
      accent: '#FF9500', 
      secondary: '#1C1C1E', 
      tagBg: '#fff0db', 
      accentBorder: '#ffd29a', 
      btnFrom: '#FF9500', 
      btnTo: '#ff6a00', 
      fontFamily: "'Noto Sans SC', sans-serif", 
      fontSize: 18, 
      lineHeight: 1.6, 
      letterSpacing: 0, 
      textPadding: 30, 
      showPageNumber: true,
      // 内容区域：纸张(15,55)-(345,425)，日期栏占35px
      contentBox: {
        top: 25,
        left: 15,
        right: 15,
        paddingTop: 20,
        paddingBottom: 25,
        paddingLeft: 21,
        paddingRight: 30
      },
      drawBackground(ctx, width, height, theme) { 
        fillBaseBackground(ctx, width, height, theme); 
        withCtx(ctx, () => { 
          ctx.shadowColor = 'rgba(0,0,0,0.05)'; 
          ctx.shadowBlur = 18; 
          ctx.shadowOffsetY = 5; 
          drawRoundedRect(ctx, 15, 25, width - 30, height - 50, 12, '#ffffff'); 
        }); 
        withCtx(ctx, () => { 
          ctx.strokeStyle = '#F2F2F7'; 
          const lineSpacing = 18 * 1.6; 
          for (let y = 55 + 30 + lineSpacing; y < height - 55; y += lineSpacing) { 
            ctx.beginPath(); 
            ctx.moveTo(15, y); 
            ctx.lineTo(width - 15, y); 
            ctx.stroke(); 
          } 
        }); 
      },
      drawForeground(ctx, width, height, index, totalCount, theme) { 
      } 
    },
    
    // 苏黎世工作室
    'swiss-studio': { 
      id: 'swiss-studio', 
      name: '苏黎世工作室', 
      source: 'project', 
      bgOuter: '#ededed', 
      bgCard: '#F2F2F2', 
      bgColor: '#F2F2F2', 
      textColor: '#1A1A1A', 
      primary: '#FF4500', 
      accent: '#FF4500', 
      secondary: '#1A1A1A', 
      tagBg: '#fff1ea', 
      accentBorder: '#ffd3c2', 
      btnFrom: '#FF4500', 
      btnTo: '#cc3600', 
      fontFamily: "'Noto Sans SC', sans-serif", 
      fontSize: 17, 
      lineHeight: 1.5, 
      letterSpacing: 0.2, 
      textPadding: 50, 
      showPageNumber: true,
      contentBox: {
        top: 25,
        left: 6,
        right: 0,
        bottom: 10,
        paddingTop: 20,
        paddingBottom: 10,
        paddingLeft: 25,
        paddingRight: 24
      },
      drawBackground(ctx, width, height, theme) { 
        fillBaseBackground(ctx, width, height, theme); 
        ctx.fillStyle = theme.accent; 
        ctx.fillRect(0, 0, 6, height); 
        withCtx(ctx, () => { 
          ctx.strokeStyle = 'rgba(0,0,0,0.03)'; 
          for (let x = 40; x < width; x += 40) { 
            ctx.beginPath(); 
            ctx.moveTo(x, 0); 
            ctx.lineTo(x, height); 
            ctx.stroke(); 
          } 
        }); 
      },
      drawForeground(ctx, width, height, index, totalCount, theme) { 
      } 
    },
    
    // 极简杂志
    'minimalist-magazine': { 
      id: 'minimalist-magazine', 
      name: '极简杂志', 
      source: 'project', 
      bgOuter: '#f7f7f7', 
      bgCard: '#FFFFFF', 
      bgColor: '#FFFFFF', 
      textColor: '#1A1A1A', 
      primary: '#1A1A1A', 
      accent: '#1A1A1A', 
      secondary: '#1A1A1A', 
      tagBg: '#f0f0f0', 
      accentBorder: '#d8d8d8', 
      btnFrom: '#1A1A1A', 
      btnTo: '#444444', 
      fontFamily: "'Noto Serif SC', serif", 
      fontSize: 17, 
      lineHeight: 1.8, 
      letterSpacing: 0.3, 
      textPadding: 45, 
      showPageNumber: true,
      contentBox: {
        top: 35,
        left: 0,
        right: 0,
        bottom: 0,
        paddingTop: 10,
        paddingBottom: 20,
        paddingLeft: 35,
        paddingRight: 25
      },
      drawForeground(ctx, width, height, index, totalCount, theme) { 
      } 
    },
    
    // 弥散极光
    'aura-gradient': { 
      id: 'aura-gradient', 
      name: '弥散极光', 
      source: 'project', 
      bgOuter: '#f5f3f1', 
      bgCard: '#FFFFFF', 
      bgColor: '#FFFFFF', 
      textColor: '#2D3436', 
      primary: '#2D3436', 
      accent: '#2D3436', 
      secondary: '#2D3436', 
      tagBg: '#eff1f2', 
      accentBorder: '#d8dfe2', 
      btnFrom: '#2D3436', 
      btnTo: '#58636b', 
      fontFamily: "'Noto Sans SC', sans-serif", 
      fontSize: 17, 
      lineHeight: 1.7, 
      letterSpacing: 0.3, 
      textPadding: 35, 
      showPageNumber: true,
      contentBox: {
        top: 30,
        left: 25,
        right: 25,
        bottom: 15,
        paddingTop: 20,
        paddingBottom: 15,
        paddingLeft: 15,
        paddingRight: 5
      },
      drawBackground(ctx, width, height, theme) { 
        fillBaseBackground(ctx, width, height, theme); 
        [{ x: 0, y: 0, r: 1, c1: 'rgba(255,195,160,0.3)', c2: 'rgba(255,195,160,0)' }, { x: 1, y: 0.2, r: 0.8, c1: 'rgba(255,175,189,0.25)', c2: 'rgba(255,175,189,0)' }, { x: 0.5, y: 1, r: 1.2, c1: 'rgba(33,147,176,0.15)', c2: 'rgba(33,147,176,0)' }].forEach((item) => { 
          const grad = ctx.createRadialGradient(width * item.x, height * item.y, 0, width * item.x, height * item.y, width * item.r); 
          grad.addColorStop(0, item.c1); 
          grad.addColorStop(1, item.c2); 
          ctx.fillStyle = grad; 
          ctx.fillRect(0, 0, width, height); 
        }); 
        ctx.drawImage(createNoiseTexture(width, height, 0.04), 0, 0); 
        withCtx(ctx, () => { 
          ctx.shadowColor = 'rgba(0,0,0,0.03)'; 
          ctx.shadowBlur = 28; 
          ctx.shadowOffsetY = 10; 
          drawRoundedRect(ctx, 25, 30, width - 50, height - 65, 28, 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0.45)'); 
        }); 
      },
      drawForeground(ctx, width, height, index, totalCount, theme) { 
        drawPageNumber(ctx, width, height, index, totalCount, projectConfig(theme)); 
      } 
    },
    
    // 大厂文档
    'pro-doc': { 
      id: 'pro-doc', 
      name: '大厂文档', 
      source: 'project', 
      bgOuter: '#f1f5f9', 
      bgCard: '#F9FAFB', 
      bgColor: '#F9FAFB', 
      textColor: '#111827', 
      primary: '#0066FF', 
      accent: '#0066FF', 
      secondary: '#111827', 
      tagBg: '#edf4ff', 
      accentBorder: '#cadfff', 
      btnFrom: '#0066FF', 
      btnTo: '#004fc7', 
      fontFamily: "'Noto Sans SC', sans-serif", 
      fontSize: 17, 
      lineHeight: 1.7, 
      letterSpacing: 0.2, 
      textPadding: 35, 
      showPageNumber: true,
      contentBox: {
        top: 40,
        left: 15,
        right: 15,
        bottom: 10,
        paddingTop: 30,
        paddingBottom: 20,
        paddingLeft: 18,
        paddingRight: 18
      },
      drawBackground(ctx, width, height, theme) { 
        fillBaseBackground(ctx, width, height, theme); 
        withCtx(ctx, () => { 
          ctx.strokeStyle = 'rgba(0,102,255,0.02)'; 
          for (let i = 0; i < width; i += 10) { 
            ctx.beginPath(); 
            ctx.moveTo(i, 0); 
            ctx.lineTo(i, height); 
            ctx.stroke(); 
          } 
          for (let i = 0; i < height; i += 10) { 
            ctx.beginPath(); 
            ctx.moveTo(0, i); 
            ctx.lineTo(width, i); 
            ctx.stroke(); 
          } 
        }); 
        withCtx(ctx, () => { 
          ctx.shadowColor = 'rgba(0,0,0,0.08)'; 
          ctx.shadowBlur = 24; 
          ctx.shadowOffsetY = 10; 
          drawRoundedRect(ctx, 15, 25, width - 30, height - 55, 12, '#ffffff', 'rgba(0,0,0,0.05)'); 
        }); 
        drawRoundedRect(ctx, 15, 25, width - 30, 30, { tl: 12, tr: 12, bl: 0, br: 0 }, 'rgba(17,24,39,0.05)'); 
        [['#FF5F56', 35], ['#FFBD2E', 53], ['#27C93F', 71]].forEach(([color, x]) => { 
          ctx.fillStyle = color; 
          ctx.beginPath(); 
          ctx.arc(x, 40, 5, 0, Math.PI * 2); 
          ctx.fill(); 
        }); 
        ctx.fillStyle = 'rgba(17,24,39,0.4)'; 
        ctx.font = '700 10px sans-serif'; 
        ctx.textAlign = 'center'; 
        ctx.fillText('DOCUMENT VIEWER', width / 2, 45); 
      },
      drawForeground(ctx, width, height, index, totalCount, theme) { 
      } 
    },
    
    // 空白模板
    blank: { 
      id: 'blank', 
      name: '空白模板', 
      source: 'project', 
      bgOuter: '#f6f6f6', 
      bgCard: '#FFFFFF', 
      bgColor: '#FFFFFF', 
      textColor: '#1A1A1A', 
      primary: '#1A1A1A', 
      accent: '#999999', 
      secondary: '#1A1A1A', 
      tagBg: '#f2f2f2', 
      accentBorder: '#dddddd', 
      btnFrom: '#1A1A1A', 
      btnTo: '#555555', 
      fontFamily: "'Noto Sans SC', sans-serif", 
      fontSize: 16, 
      lineHeight: 1.8, 
      letterSpacing: 0.5, 
      textPadding: 35, 
      showPageNumber: true,
      contentBox: defaultContentBox,
      drawBackground(ctx, width, height, theme) { 
        fillBaseBackground(ctx, width, height, theme); 
      },
      drawForeground(ctx, width, height, index, totalCount, theme) { 
        drawPageNumber(ctx, width, height, index, totalCount, projectConfig(theme)); 
      } 
    }
  };

  const themeOrder = ['pink', 'macaron', 'ocean', 'forest', 'sunset', 'midnight', 'notion-style', 'elegant-book', 'ios-memo', 'swiss-studio', 'minimalist-magazine', 'aura-gradient', 'pro-doc', 'blank'];

  function getTheme(themeId) {
    return themes[themeId] || themes.pink;
  }

  function listThemes() {
    return themeOrder.map((id) => themes[id]).filter(Boolean);
  }

  function applyTheme(themeId, options) {
    const settings = { root: document.documentElement, body: document.body, ...options };
    const theme = getTheme(themeId);
    
    // 原有的主题变量
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
    
    // 新增：内容区域 CSS 变量
    const box = theme.contentBox || defaultContentBox;
    settings.root.style.setProperty('--content-top', `${box.top}px`);
    settings.root.style.setProperty('--content-left', `${box.left}px`);
    settings.root.style.setProperty('--content-right', `${box.right}px`);
    settings.root.style.setProperty('--content-bottom', `${box.bottom}px`);
    settings.root.style.setProperty('--content-padding-top', `${box.paddingTop}px`);
    settings.root.style.setProperty('--content-padding-bottom', `${box.paddingBottom}px`);
    settings.root.style.setProperty('--content-padding-left', `${box.paddingLeft}px`);
    settings.root.style.setProperty('--content-padding-right', `${box.paddingRight}px`);
    
    return theme;
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

  global.XHSStandaloneThemes = { CARD_WIDTH, CARD_MIN_HEIGHT, getTheme, listThemes, applyTheme, renderThemeCanvases };
}(window));
