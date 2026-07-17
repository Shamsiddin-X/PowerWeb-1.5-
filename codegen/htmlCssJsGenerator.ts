import { CanvasElement, ElementStyle, LogicBlock, Condition, Action, Project, Page } from '../types';

// --- Types ---
interface StylePattern {
  className: string;
  elements: CanvasElement[];
  styles: Record<string, any>;
  count: number;
}

interface GeneratedCode {
  html: string;
  htmlBody: string;
  css: string;
  js: string;
}

// --- Helpers ---

// Helper to convert px to vw based on root page width
const toVW = (px: number, rootWidth: number): string => {
  return ((px / rootWidth) * 100).toFixed(3);
};

// Map internal ElementStyle to CSS properties with True Proportional Scaling
const mapStyleToCSS = (style: ElementStyle, type: string, rootPageWidth: number): Record<string, any> => {
  const css: Record<string, any> = {};

  if (type !== 'text' && type !== 'image' && type !== 'video') {
    // For DIV shapes (rect/circle), use background. SVG fill handled inline.
    if (type === 'rect' || type === 'circle' || type === 'roundedRect') {
        css['background'] = style.fill;
    }
  }
  
  // Border logic for Divs
  if ((type === 'rect' || type === 'circle' || type === 'roundedRect') && style.strokeWidth > 0) {
    const strokeVw = toVW(style.strokeWidth, rootPageWidth);
    css['border-width'] = `max(${strokeVw}vw, 1px)`;
    css['border-style'] = 'solid';
    css['border-color'] = style.stroke;
  }

  css['opacity'] = style.opacity;
  
  if (type !== 'line') {
      css['border-radius'] = `${toVW(style.borderRadius, rootPageWidth)}vw`;
  }
  
  if (style.shadowBlur && style.shadowBlur > 0) {
    const blurVw = toVW(style.shadowBlur, rootPageWidth);
    css['box-shadow'] = `0 0 ${blurVw}vw ${style.shadowColor}`;
    // For SVGs, box-shadow behaves differently (rect bounding box), typically filtered.
    // CSS filter drop-shadow is better for SVG shapes but handled inline for simplicity or class
    if (type !== 'rect' && type !== 'circle' && type !== 'roundedRect' && type !== 'text' && type !== 'button' && type !== 'image' && type !== 'video') {
       css['filter'] = `drop-shadow(0 0 ${blurVw}vw ${style.shadowColor})`;
       delete css['box-shadow'];
    }
  }

  if (style.backdropBlur && style.backdropBlur > 0) {
      css['backdrop-filter'] = `blur(${style.backdropBlur}px)`;
      css['-webkit-backdrop-filter'] = `blur(${style.backdropBlur}px)`;
  }

  if (type === 'text' || type === 'button') {
    css['color'] = style.color;
    
    const fontSizeVw = toVW(style.fontSize || 16, rootPageWidth);
    css['font-size'] = `${fontSizeVw}vw`;
    css['line-height'] = '1.6'; 
    
    css['font-family'] = style.fontFamily;
    css['font-weight'] = style.fontWeight;
    css['font-style'] = style.fontStyle;
    css['text-align'] = style.textAlign;
    css['display'] = 'flex';
    css['align-items'] = 'flex-start';
    css['justify-content'] = style.textAlign === 'center' ? 'center' : style.textAlign === 'right' ? 'flex-end' : 'flex-start';
    
    if(type === 'button') {
        css['align-items'] = 'center';
        css['justify-content'] = 'center';
        css['cursor'] = 'pointer';
    }

    css['white-space'] = 'pre-wrap';
    css['word-break'] = 'break-word'; 
  }

  if (type === 'image') {
      css['object-fit'] = 'cover';
  }

  return css;
};

import { getSvgPath } from '../utils/shapeData';

// --- 2️⃣ PATTERN DETECTION ---

class StyleAnalyzer {
  analyzeProjectStyles(project: Project): StylePattern[] {
    const styleGroups = new Map<string, CanvasElement[]>();
    const allElements: CanvasElement[] = [];
    
    project.pages.forEach(page => {
        page.layers.forEach(layer => {
            if(layer.visible) {
                allElements.push(...layer.elements);
            }
        });
    });

    const refWidth = project.pages[0]?.width || 1200;

    allElements.forEach(element => {
      if (element.type === 'group') return; 

      const cssStyles = mapStyleToCSS(element.style, element.type, refWidth);
      const styleHash = this.createStyleHash(cssStyles);

      if (!styleGroups.has(styleHash)) {
        styleGroups.set(styleHash, []);
      }
      styleGroups.get(styleHash)!.push(element);
    });

    const patterns: StylePattern[] = [];

    styleGroups.forEach((elementsGroup, styleHash) => {
      if (elementsGroup.length >= 2) {
        patterns.push({
          className: this.generateClassName(elementsGroup[0].type),
          elements: elementsGroup,
          styles: mapStyleToCSS(elementsGroup[0].style, elementsGroup[0].type, refWidth),
          count: elementsGroup.length
        });
      }
    });

    return patterns;
  }

  private createStyleHash(styles: Record<string, any>): string {
    const sortedKeys = Object.keys(styles).sort();
    const hashString = sortedKeys.map(key => `${key}:${styles[key]}`).join('|');
    return this.hashCode(hashString);
  }

  private generateClassName(elementType: string): string {
    const randomSuffix = Math.random().toString(36).substring(7);
    return `${elementType}-${randomSuffix}`;
  }

  private hashCode(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}

// --- 3️⃣ HTML GENERATION ---

class HTMLGenerator {
  private patterns: StylePattern[];

  constructor(patterns: StylePattern[]) {
    this.patterns = patterns;
  }

  generateProjectHTML(project: Project): string {
    return project.pages.map((page, index) => this.generatePageSlide(page, index === 0)).join('\n\n');
  }

  private generatePageSlide(page: Page, isActive: boolean): string {
      const rootWidth = page.width;

      const elementsHTML = page.layers.map(layer => {
          if(!layer.visible) return '';
          // Filter root elements (exclude children of groups)
          const rootElements = layer.elements.filter(el => {
              const isChild = layer.elements.some(parent => 
                  parent.type === 'group' && parent.elements?.some(child => child.id === el.id)
              );
              return !isChild;
          });
          
          return rootElements.map(el => this.generateElement(el, page.width, page.height, rootWidth)).join('\n      ');
      }).join('\n');

      // CRITICAL FIX: Removed inline 'display: block/none'. Visibility is now controlled 100% by the 'active' class via CSS.
      const activeClass = isActive ? ' active' : '';
      const transitionType = page.transition || 'none';
      const transitionDuration = page.transitionDuration || 0.5;
      const heightVw = toVW(page.height, rootWidth);
      const heightStyle = `min-height: 100vh; height: ${heightVw}vw;`;

      return `
    <!-- Slide: ${page.name} -->
    <div id="${page.id}" class="pwb-slide${activeClass}" style="background: ${page.backgroundColor}; ${heightStyle}" data-transition="${transitionType}" data-duration="${transitionDuration}">
      ${elementsHTML}
    </div>`;
  }

  private generateElement(element: CanvasElement, parentWidth: number, parentHeight: number, rootWidth: number): string {
    const tag = this.getTag(element);
    let className = this.getClassNameForElement(element) || '';
    
    // Proportional Calculations
    const leftPercent = (element.x / parentWidth) * 100;
    const widthPercent = (element.width / parentWidth) * 100;
    const topVw = toVW(element.y, rootWidth);
    const heightVw = toVW(element.height, rootWidth);
    const safeHeight = element.type === 'line' ? `max(${heightVw}vw, 1px)` : `${heightVw}vw`;

    let position = 'absolute';
    let zIndex: string | undefined = undefined;

    if (element.positionMode === 'fixed') {
        position = 'fixed';
        zIndex = '1000';
    }

    const positionStyles: Record<string, any> = {
      position: position,
      left: `${leftPercent.toFixed(4)}%`,
      width: `${widthPercent.toFixed(4)}%`,
      top: `${topVw}vw`,
      height: safeHeight,
      ...(zIndex ? { 'z-index': zIndex } : {})
    };

    let uniqueStyles: Record<string, any> = {};
    if (!className) {
        uniqueStyles = mapStyleToCSS(element.style, element.type, rootWidth);
    }

    // --- CHECK LOGIC & ANIMATIONS FOR POINTER EVENTS ---
    
    // Logic: 
    // 1. By default, 'none' to allow click-through for decorative elements.
    // 2. If 'button' or 'input' or 'video', default to 'auto' because they are inherently interactive.
    // 3. If any element has explicit logic attached, force 'auto' and 'cursor: pointer'.

    let pointerEvents = 'none';
    let cursorStyle = 'default';

    const hasClickLogic = element.logic?.some(l => l.event?.type === 'click' && l.actions.length > 0);
    const hasHoverLogic = element.logic?.some(l => l.event?.type === 'hover') || 
                          element.animations?.some(a => a.trigger === 'onHover' || a.trigger === 'onClick');

    // Inherently interactive types
    if (element.type === 'button' || element.type === 'video' || tag === 'input' || tag === 'button') {
        pointerEvents = 'auto';
    }

    // Explicit logic overrides
    if (hasClickLogic || hasHoverLogic) {
        pointerEvents = 'auto';
        if (hasClickLogic) {
            cursorStyle = 'pointer';
        }
    }

    uniqueStyles['pointer-events'] = pointerEvents;
    if (cursorStyle !== 'default') {
        uniqueStyles['cursor'] = cursorStyle;
    }

    // --- RECURSIVE GROUP RENDERING ---
    let innerHTML = '';
    if (element.type === 'group' && element.elements) {
        // Group Container Interactions
        // If the group itself has logic, it captures events.
        // If not, it lets events pass through to children or elements below.
        uniqueStyles['pointer-events'] = (hasClickLogic || hasHoverLogic) ? 'auto' : 'none';
        if(hasClickLogic) uniqueStyles['cursor'] = 'pointer';

        positionStyles['border'] = 'none';
        positionStyles['background'] = 'transparent';
        
        innerHTML = element.elements.map(child => {
             const childWithRelPos = { ...child, positionMode: 'absolute' as const };
             // Generate child with correct parent dimensions (group width/height)
             return this.generateElement(childWithRelPos, element.width, element.height, rootWidth);
        }).join('\n');
    } 
    else if (element.type === 'image' && element.content) {
        const attributes = ` id="${element.id}"`;
        const styleString = this.stylesToString({ ...positionStyles, ...uniqueStyles });
        return `<img${attributes}${className ? ` class="${className}"` : ''} style="${styleString}" src="${element.content}" alt="Image" />`;
    } 
    else if (element.type === 'video' && element.content) {
        const props = element.videoProps;
        const autoPlay = props?.autoplay ? ' autoplay' : '';
        const loop = props?.loop ? ' loop' : '';
        const muted = props?.muted ? ' muted' : '';
        const radiusVw = toVW(element.style.borderRadius, rootWidth);
        const videoStyle = `object-fit: cover; width: 100%; height: 100%; border-radius: ${radiusVw}vw; pointer-events: auto;`;
        
        const styleString = this.stylesToString({ ...positionStyles, ...uniqueStyles });
        const attributes = ` id="${element.id}"`;
        return `
        <div${attributes}${className ? ` class="${className}"` : ''} style="${styleString}">
            <video src="${element.content}"${autoPlay}${loop}${muted} style="${videoStyle}"></video>
        </div>`;
    }
    // SVG SHAPES GENERATION
    else if (['rect', 'roundedRect', 'circle', 'text', 'button', 'line'].includes(element.type) === false) {
        // It's a shape (triangle, etc)
        const pathData = getSvgPath(element.type);
        const isPath = element.type === 'heart';
        
        // CSS for SVG
        const svgStyle = `width: 100%; height: 100%; overflow: visible;`;
        
        const styleString = this.stylesToString({ ...positionStyles, ...uniqueStyles });
        const attributes = ` id="${element.id}"`;
        
        innerHTML = `
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="${svgStyle}">
            ${isPath ? 
                `<path d="${pathData}" fill="${element.style.fill}" stroke="${element.style.stroke}" stroke-width="${element.style.strokeWidth}" vector-effect="non-scaling-stroke" />` : 
                `<polygon points="${pathData}" fill="${element.style.fill}" stroke="${element.style.stroke}" stroke-width="${element.style.strokeWidth}" vector-effect="non-scaling-stroke" />`
            }
        </svg>
        `;
    }
    else {
        innerHTML = element.content || '';
    }

    const allInlineStyles = { ...positionStyles, ...uniqueStyles };
    const styleString = this.stylesToString(allInlineStyles);

    let attributes = ` id="${element.id}"`;
    
    if (element.animations && element.animations.length > 0) {
        const animJson = JSON.stringify(element.animations).replace(/"/g, '&quot;');
        attributes += ` data-animations="${animJson}"`;
        if (element.animations.some(a => a.trigger === 'onScroll' || a.trigger === 'onLoad')) {
            className += ' pwb-invisible';
        }
    }

    const classAttr = className ? ` class="${className.trim()}"` : '';
    const styleAttr = ` style="${styleString}"`;

    return `<${tag}${attributes}${classAttr}${styleAttr}>${innerHTML}</${tag}>`;
  }

  private getTag(el: CanvasElement): string {
    if (el.tagName) return el.tagName;
    switch(el.type) {
      case 'image': return 'img';
      case 'button': return 'button';
      default: return 'div';
    }
  }

  private getClassNameForElement(element: CanvasElement): string | null {
    const pattern = this.patterns.find(p => 
      p.elements.some(el => el.id === element.id)
    );
    return pattern ? pattern.className : null;
  }

  private stylesToString(styles: Record<string, any>): string {
    return Object.entries(styles)
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ');
  }
}

// --- 4️⃣ CSS GENERATION ---

class CSSGenerator {
  private patterns: StylePattern[];

  constructor(patterns: StylePattern[]) {
    this.patterns = patterns;
  }

  generate(): string {
    let css = '/* PowerWeb Generated Styles */\n\n';
    css += this.generateBaseStyles();
    css += this.generateTransitionAnimations();
    css += this.generateElementAnimations();
    css += this.generatePatternClasses();
    return css;
  }

  private generateBaseStyles(): string {
    return `/* Base Styles & Reset */
:root {
  --transition-duration: 0.5s;
}
* { box-sizing: border-box; }
html, body { 
    margin: 0; 
    padding: 0; 
    width: 100%; 
    min-height: 100vh;
    font-family: system-ui, -apple-system, sans-serif; 
    overflow-x: hidden;
}
#app {
    width: 100%;
    min-height: 100vh;
    position: relative;
    background-color: #000;
}
.pwb-slide {
    display: none; /* Hidden by default */
    width: 100%;
    position: absolute;
    top: 0; 
    left: 0;
    overflow: hidden;
}
.pwb-slide.active {
    display: block; /* Visible when active */
    position: relative; 
    z-index: 10;
}
.pwb-slide.slide-exit {
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 5;
    height: 100vh;
}
.pwb-invisible { opacity: 0; }
.pwb-animated { animation-fill-mode: both; }
`;
  }

  private generateTransitionAnimations(): string {
      return `/* Transitions */
.trans-fade { animation: fadeIn var(--transition-duration) forwards; }
.trans-push_right { animation: slideInRight var(--transition-duration) forwards; }
.trans-push_left { animation: slideInLeft var(--transition-duration) forwards; }
.trans-push_up { animation: slideInUp var(--transition-duration) forwards; }
.trans-push_down { animation: slideInDown var(--transition-duration) forwards; }
.trans-zoom_in { animation: zoomIn var(--transition-duration) forwards; }

@keyframes slideInRight { from { transform: translateX(-100%); } to { transform: translateX(0); } }
@keyframes slideInLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }
@keyframes slideInUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes slideInDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }
`;
  }

  private generateElementAnimations(): string {
      return `/* ============================================================
   POWERWEB ELEMENT ANIMATIONS — 35+ EFFECTS
   ============================================================ */

/* --- ENTRANCE --- */
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.anim-fadeIn { animation-name: fadeIn; }

@keyframes fadeInUp { from { opacity: 0; transform: translate3d(0, 60px, 0); } to { opacity: 1; transform: none; } }
.anim-fadeInUp { animation-name: fadeInUp; }

@keyframes fadeInDown { from { opacity: 0; transform: translate3d(0, -60px, 0); } to { opacity: 1; transform: none; } }
.anim-fadeInDown { animation-name: fadeInDown; }

@keyframes fadeInLeft { from { opacity: 0; transform: translate3d(-80px, 0, 0); } to { opacity: 1; transform: none; } }
.anim-fadeInLeft { animation-name: fadeInLeft; }

@keyframes fadeInRight { from { opacity: 0; transform: translate3d(80px, 0, 0); } to { opacity: 1; transform: none; } }
.anim-fadeInRight { animation-name: fadeInRight; }

@keyframes zoomIn { from { opacity: 0; transform: scale3d(0.3,0.3,0.3); } 50% { opacity: 1; } to { opacity: 1; transform: scale3d(1,1,1); } }
.anim-zoomIn { animation-name: zoomIn; }

@keyframes zoomInUp { from { opacity: 0; transform: scale3d(0.1,0.1,0.1) translate3d(0,1000px,0); } 60% { opacity: 1; transform: scale3d(0.475,0.475,0.475) translate3d(0,-60px,0); } to { opacity: 1; transform: scale3d(1,1,1); } }
.anim-zoomInUp { animation-name: zoomInUp; }

@keyframes bounceIn { 0% { opacity: 0; transform: scale3d(0.3,0.3,0.3); } 20% { transform: scale3d(1.1,1.1,1.1); } 40% { transform: scale3d(0.9,0.9,0.9); } 60% { opacity: 1; transform: scale3d(1.03,1.03,1.03); } 80% { transform: scale3d(0.97,0.97,0.97); } to { opacity: 1; transform: scale3d(1,1,1); } }
.anim-bounceIn { animation-name: bounceIn; }

@keyframes slideInUp { from { transform: translate3d(0,100%,0); opacity: 0; } to { transform: none; opacity: 1; } }
.anim-slideInUp { animation-name: slideInUp; }

@keyframes slideInLeft { from { transform: translate3d(-100%,0,0); opacity: 0; } to { transform: none; opacity: 1; } }
.anim-slideInLeft { animation-name: slideInLeft; }

@keyframes slideInRight { from { transform: translate3d(100%,0,0); opacity: 0; } to { transform: none; opacity: 1; } }
.anim-slideInRight { animation-name: slideInRight; }

@keyframes flipInX { from { transform: perspective(400px) rotate3d(1,0,0,90deg); opacity: 0; } 40% { transform: perspective(400px) rotate3d(1,0,0,-20deg); } 60% { transform: perspective(400px) rotate3d(1,0,0,10deg); opacity: 1; } 80% { transform: perspective(400px) rotate3d(1,0,0,-5deg); } to { transform: perspective(400px); opacity: 1; } }
.anim-flipInX { animation-name: flipInX; }

@keyframes flipInY { from { transform: perspective(400px) rotate3d(0,1,0,90deg); opacity: 0; } 40% { transform: perspective(400px) rotate3d(0,1,0,-20deg); } 60% { transform: perspective(400px) rotate3d(0,1,0,10deg); opacity: 1; } 80% { transform: perspective(400px) rotate3d(0,1,0,-5deg); } to { transform: perspective(400px); opacity: 1; } }
.anim-flipInY { animation-name: flipInY; }

@keyframes rollIn { from { opacity: 0; transform: translate3d(-100%,0,0) rotate3d(0,0,1,-120deg); } to { opacity: 1; transform: none; } }
.anim-rollIn { animation-name: rollIn; }

@keyframes backInDown { from { opacity: 0.7; transform: translateY(-1200px) scale(0.7); } 80% { opacity: 0.7; transform: translateY(0) scale(0.7); } to { opacity: 1; transform: scale(1); } }
.anim-backInDown { animation-name: backInDown; }

@keyframes backInUp { from { opacity: 0.7; transform: translateY(1200px) scale(0.7); } 80% { opacity: 0.7; transform: translateY(0) scale(0.7); } to { opacity: 1; transform: scale(1); } }
.anim-backInUp { animation-name: backInUp; }

@keyframes rotateIn { from { transform: rotate3d(0,0,1,-200deg); opacity: 0; } to { transform: none; opacity: 1; } }
.anim-rotateIn { animation-name: rotateIn; transform-origin: center; }

@keyframes lightSpeedIn { from { transform: translateX(100%) skewX(-30deg); opacity: 0; } 60% { transform: skewX(20deg); opacity: 1; } 80% { transform: skewX(-5deg); } to { transform: none; opacity: 1; } }
.anim-lightSpeedIn { animation-name: lightSpeedIn; animation-timing-function: ease-out !important; }

/* --- ATTENTION --- */
@keyframes pulse { from { transform: scale3d(1,1,1); } 50% { transform: scale3d(1.06,1.06,1.06); } to { transform: scale3d(1,1,1); } }
.anim-pulse { animation-name: pulse; }

@keyframes bounce { from,20%,53%,to { transform: none; } 40%,43% { transform: translate3d(0,-24px,0) scaleY(1.1); } 70% { transform: translate3d(0,-12px,0) scaleY(1.05); } 90% { transform: translate3d(0,-4px,0) scaleY(1.02); } }
.anim-bounce { animation-name: bounce; transform-origin: center bottom; }

@keyframes shake { from,to { transform: none; } 10%,30%,50%,70%,90% { transform: translate3d(-6px,0,0); } 20%,40%,60%,80% { transform: translate3d(6px,0,0); } }
.anim-shake { animation-name: shake; }

@keyframes swing { 20% { transform: rotate3d(0,0,1,15deg); } 40% { transform: rotate3d(0,0,1,-10deg); } 60% { transform: rotate3d(0,0,1,5deg); } 80% { transform: rotate3d(0,0,1,-5deg); } to { transform: none; } }
.anim-swing { animation-name: swing; transform-origin: top center; }

@keyframes rubberBand { from { transform: scale3d(1,1,1); } 30% { transform: scale3d(1.25,0.75,1); } 40% { transform: scale3d(0.75,1.25,1); } 50% { transform: scale3d(1.15,0.85,1); } 65% { transform: scale3d(0.95,1.05,1); } 75% { transform: scale3d(1.05,0.95,1); } to { transform: scale3d(1,1,1); } }
.anim-rubberBand { animation-name: rubberBand; }

@keyframes jello { from,11.1%,to { transform: none; } 22.2% { transform: skewX(-12.5deg) skewY(-12.5deg); } 33.3% { transform: skewX(6.25deg) skewY(6.25deg); } 44.4% { transform: skewX(-3.125deg) skewY(-3.125deg); } 55.5% { transform: skewX(1.5625deg) skewY(1.5625deg); } 66.6% { transform: skewX(-0.78125deg) skewY(-0.78125deg); } 77.7% { transform: skewX(0.390625deg) skewY(0.390625deg); } 88.8% { transform: skewX(-0.1953125deg) skewY(-0.1953125deg); } }
.anim-jello { animation-name: jello; transform-origin: center; }

@keyframes wobble { from { transform: none; } 15% { transform: translate3d(-25%,0,0) rotate3d(0,0,1,-5deg); } 30% { transform: translate3d(20%,0,0) rotate3d(0,0,1,3deg); } 45% { transform: translate3d(-15%,0,0) rotate3d(0,0,1,-3deg); } 60% { transform: translate3d(10%,0,0) rotate3d(0,0,1,2deg); } 75% { transform: translate3d(-5%,0,0) rotate3d(0,0,1,-1deg); } to { transform: none; } }
.anim-wobble { animation-name: wobble; }

@keyframes tada { from { transform: scale3d(1,1,1); } 10%,20% { transform: scale3d(0.9,0.9,0.9) rotate3d(0,0,1,-3deg); } 30%,50%,70%,90% { transform: scale3d(1.1,1.1,1.1) rotate3d(0,0,1,3deg); } 40%,60%,80% { transform: scale3d(1.1,1.1,1.1) rotate3d(0,0,1,-3deg); } to { transform: scale3d(1,1,1); } }
.anim-tada { animation-name: tada; }

@keyframes flash { from,50%,to { opacity: 1; } 25%,75% { opacity: 0; } }
.anim-flash { animation-name: flash; }

@keyframes heartBeat { 0% { transform: scale(1); } 14% { transform: scale(1.3); } 28% { transform: scale(1); } 42% { transform: scale(1.3); } 70% { transform: scale(1); } }
.anim-heartBeat { animation-name: heartBeat; animation-timing-function: ease-in-out !important; }

/* --- CONTINUOUS --- */
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.anim-spin { animation-name: spin; animation-timing-function: linear !important; }

@keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-16px); } }
.anim-float { animation-name: float; animation-timing-function: ease-in-out !important; }

@keyframes glow { 0%,100% { opacity: 1; } 50% { opacity: 0.5; filter: brightness(1.5); } }
.anim-glow { animation-name: glow; animation-timing-function: ease-in-out !important; }

/* --- EXIT --- */
@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
.anim-fadeOut { animation-name: fadeOut; }

@keyframes zoomOut { from { opacity: 1; } 50% { opacity: 0; transform: scale3d(0.3,0.3,0.3); } to { opacity: 0; } }
.anim-zoomOut { animation-name: zoomOut; }

@keyframes slideOutDown { from { transform: none; } to { opacity: 0; transform: translate3d(0,100%,0); } }
.anim-slideOutDown { animation-name: slideOutDown; }

/* --- LEGACY --- */
@keyframes scaleUp { from { transform: scale(1); } to { transform: scale(1.1); } }
.anim-scaleUp { animation-name: scaleUp; }
@keyframes slideUp { from { transform: translate3d(0,100%,0); opacity: 0; } to { transform: none; opacity: 1; } }
.anim-slideUp { animation-name: slideUp; }
`;
  }

  private generatePatternClasses(): string {
    if (this.patterns.length === 0) return '';
    let css = '/* Shared Styles */\n';
    
    this.patterns.forEach(pattern => {
      css += `.${pattern.className} {\n`;
      Object.entries(pattern.styles).forEach(([key, value]) => {
        css += `  ${key}: ${value};\n`;
      });
      css += `}\n\n`;
    });
    return css;
  }
}

// --- 5️⃣ JAVASCRIPT GENERATION ---

class JSGenerator {
  generate(project: Project): string {
    let js = '// PowerWeb SPA Navigation & Animation Script\n\n';
    
    // 1. Navigation Function
    js += `
    function goToSlide(slideId) {
        console.log('Navigating to:', slideId);
        let targetSlide = document.getElementById(slideId);
        
        if (!targetSlide) {
            console.error('Target slide not found:', slideId);
            // Fallback: Try to find the next slide or the first slide
            const allSlides = document.querySelectorAll('.pwb-slide');
            if (allSlides.length > 0) {
                targetSlide = allSlides[0];
                console.log('Fallback to first slide:', targetSlide.id);
            } else {
                return;
            }
        }

        // Get all active slides to handle self-healing (if multiple are active by mistake)
        const activeSlides = document.querySelectorAll('.pwb-slide.active');
        
        window.scrollTo({ top: 0, behavior: 'smooth' });

        const effect = targetSlide.getAttribute('data-transition') || 'none';
        const duration = parseFloat(targetSlide.getAttribute('data-duration') || '0.5');

        document.documentElement.style.setProperty('--transition-duration', duration + 's');

        // CRITICAL FIX: Always apply active class even if seemingly active, to ensure transitions trigger correctly
        targetSlide.classList.add('active');
        
        // Deactivate others
        activeSlides.forEach(slide => {
            if (slide !== targetSlide) {
                if (effect !== 'none') {
                    targetSlide.classList.add('trans-' + effect);
                    slide.classList.remove('active');
                    slide.classList.add('slide-exit');
                    
                    setTimeout(() => {
                        targetSlide.classList.remove('trans-' + effect);
                        slide.classList.remove('slide-exit');
                    }, duration * 1000);
                } else {
                    slide.classList.remove('active');
                }
            }
        });
    }\n\n`;

    // 2. Observer and Interactions
    js += `
    document.addEventListener("DOMContentLoaded", function() {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const anims = JSON.parse(el.getAttribute('data-animations') || '[]');
                    
                    anims.forEach(anim => {
                        if (anim.trigger === 'onScroll' || anim.trigger === 'onLoad') {
                            el.style.animationDuration = anim.duration + 's';
                            el.style.animationDelay = anim.delay + 's';
                            el.classList.add('anim-' + anim.name, 'pwb-animated');
                            el.classList.remove('pwb-invisible');
                        }
                    });
                    observer.unobserve(el);
                }
            });
        }, observerOptions);

        document.querySelectorAll('[data-animations]').forEach(el => {
            const anims = JSON.parse(el.getAttribute('data-animations') || '[]');
            let observeScroll = false;

            function applyAnim(el, anim) {
                el.style.animationDuration = anim.duration + 's';
                el.style.animationDelay = anim.delay + 's';
                if (anim.easing) el.style.animationTimingFunction = anim.easing;
                el.style.animationIterationCount = anim.iterationCount || 1;
                el.classList.add('anim-' + anim.name, 'pwb-animated');
            }

            function removeAnim(el, anim) {
                el.classList.remove('anim-' + anim.name, 'pwb-animated');
                el.style.animationDuration = '';
                el.style.animationDelay = '';
                el.style.animationTimingFunction = '';
                el.style.animationIterationCount = '';
            }

            anims.forEach(anim => {
                if (anim.trigger === 'onScroll' || anim.trigger === 'onLoad') {
                    observeScroll = true;
                }
                if (anim.trigger === 'onHover') {
                    el.style.pointerEvents = 'auto';
                    el.addEventListener('mouseenter', () => { applyAnim(el, anim); });
                    el.addEventListener('mouseleave', () => { removeAnim(el, anim); });
                }
                if (anim.trigger === 'onClick') {
                    el.style.pointerEvents = 'auto';
                    el.addEventListener('click', () => {
                        removeAnim(el, anim);
                        void el.offsetWidth; // force reflow
                        applyAnim(el, anim);
                    });
                }
            });

            if (observeScroll) {
                observer.observe(el);
            }
        });
    `;
    
    // 3. Navigation Links (Fixed Variable Scoping & Naming)
    project.pages.forEach(page => {
        page.layers.forEach(layer => {
            const processElements = (elements: CanvasElement[]) => {
                elements.forEach(el => {
                    if (el.type === 'group' && el.elements) {
                        processElements(el.elements);
                    }

                    if (el.logic && el.logic.length > 0) {
                        el.logic.forEach(logic => {
                            if (logic.event && logic.event.type === 'click' && logic.actions.length > 0) {
                                 
                                 // USE ISOLATED BLOCK SCOPE { ... } TO AVOID GLOBAL VAR CONFLICTS WITH HYPHENATED IDS
                                 js += `
            {
                const el = document.getElementById("${el.id}");
                if (el) {
                    el.addEventListener("click", function(e) { 
                        e.stopPropagation();
`;
                                // Process ALL actions for this click event
                                logic.actions.forEach(action => {
                                     if (action.type === 'navigateToPage') {
                                         // Fallback if targetId is empty
                                         const target = action.targetId ? action.targetId : '';
                                         js += `                        goToSlide("${target}");\n`;
                                     }
                                     else if (action.type === 'navigateToUrl' && action.url) {
                                          js += `                        window.open("${action.url}", "_blank");\n`;
                                     }
                                     else if (action.type === 'showModal' && action.targetId) {
                                         js += `
                        {
                            const modal = document.getElementById("${action.targetId}");
                            if(modal) {
                                modal.style.display = 'flex';
                                modal.style.justifyContent = 'center';
                                modal.style.alignItems = 'center';
                                modal.style.opacity = '1';
                                modal.style.zIndex = '9999';
                                // Close on click outside or self
                                const closeHandler = (evt) => {
                                    if(evt.target === modal) {
                                        modal.style.display = 'none';
                                        modal.removeEventListener('click', closeHandler);
                                    }
                                };
                                modal.addEventListener('click', closeHandler);
                            }
                        }
`;
                                     }
                                     else if (action.type === 'hideElement' && action.targetId) {
                                         js += `
                        {
                            const target = document.getElementById("${action.targetId}");
                            if(target) target.style.display = 'none';
                        }
`;
                                     }
                                     else if (action.type === 'toggleClass' && action.targetId && action.className) {
                                         js += `
                        {
                            const target = document.getElementById("${action.targetId}");
                            if(target) target.classList.toggle("${action.className}");
                        }
`;
                                     }
                                });

                                js += `                    });
                }
            }`;
                            }
                        });
                    }
                });
            };
            processElements(layer.elements);
        });
    });

    js += '    });\n';
    return js;
  }
}

// --- 6️⃣ MAIN GENERATOR ---

export class PowerWebCodeGenerator {
  private project: Project;

  constructor(project: Project) {
    this.project = project;
  }

  generate(): GeneratedCode {
    const analyzer = new StyleAnalyzer();
    const patterns = analyzer.analyzeProjectStyles(this.project);

    const htmlGenerator = new HTMLGenerator(patterns);
    const htmlBody = htmlGenerator.generateProjectHTML(this.project);

    const cssGenerator = new CSSGenerator(patterns);
    const css = cssGenerator.generate();

    const jsGenerator = new JSGenerator();
    const js = jsGenerator.generate(this.project);

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.project.name}</title>
    <noscript><style>.pwb-invisible { opacity: 1 !important; }</style></noscript>
    <style>
${css}
    </style>
</head>
<body>
    <div id="app">
${htmlBody}
    </div>
    <script>
${js}
    </script>
</body>
</html>`;

    return {
        html: fullHtml,
        htmlBody,
        css,
        js
    };
  }
}