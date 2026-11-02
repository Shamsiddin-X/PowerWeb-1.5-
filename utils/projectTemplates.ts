import { DEFAULT_PAGE_SIZE } from './pageDefaults';
import { CanvasElement, ElementStyle, Language, Project, DEFAULT_STYLE } from '../types';
import { generateId } from './ids';
import { t } from './localization';

export const PROJECT_TEMPLATES = [
  { id: 'blank', name: 'Blank project', description: 'A clean canvas for your ideas', color: '#ffffff' },
  { id: 'studio', name: 'Creative studio', description: 'A bold landing page', color: '#fff8ed' },
  { id: 'portfolio', name: 'Portfolio', description: 'A place for your best work', color: '#172e29' },
  { id: 'business', name: 'Business', description: 'A clear introduction to your brand', color: '#edf0fb' },
] as const;
export type ProjectTemplateId = typeof PROJECT_TEMPLATES[number]['id'];

export function createProjectFromTemplate(template: ProjectTemplateId, language: Language): Project {
  const pageId = generateId();
  const elements: CanvasElement[] = [];
  const add = (type: CanvasElement['type'], x: number, y: number, width: number, height: number, content: string, style: Partial<ElementStyle> = {}) => {
    elements.push({ id: generateId(), type, x, y, width, height, content,
      style: { ...DEFAULT_STYLE, strokeWidth: 0, fill: 'transparent', fontFamily: 'Inter, sans-serif', ...style } });
  };
  const text = (x: number, y: number, w: number, h: number, content: string, size: number, color: string, bold = false) =>
    add('text', x, y, w, h, content, { fontSize: size, color, fontWeight: bold ? 'bold' : 'normal' });
  if (template !== 'blank') {
    const dark = template === 'portfolio';
    const color = dark ? '#f1f5e8' : '#202938';
    const accent = template === 'studio' ? '#ea580c' : dark ? '#c8e5a0' : '#5556d9';
    const heading = template === 'studio' ? 'Ideas become reality' : dark ? 'Selected work.\nMade with purpose.' : 'Your next chapter\nstarts here.';
    text(72, 42, 400, 40, template === 'studio' ? 'STUDIO / 01' : dark ? 'PORTFOLIO' : 'YOUR COMPANY', 22, color, true);
    text(820, 48, 320, 30, t('About · Work · Contact', language), 16, color);
    text(72, 190, 690, 185, t(heading, language), 64, color, true);
    text(76, 410, 570, 90, t('A short introduction to what you do and what makes it special.', language), 23, dark ? '#a9c3b5' : '#64748b');
    add('button', 76, 545, 225, 58, t('Let’s get started', language), { fill: accent, color: dark ? '#172e29' : '#fff', borderRadius: 8, fontSize: 19, fontWeight: 'bold' });
    add('circle', 850, 210, 245, 245, '', { fill: accent });
    add('rect', 790, 410, 175, 175, '', { fill: dark ? '#315448' : template === 'studio' ? '#f5c397' : '#bfc7f3', borderRadius: 24 });
    text(76, 725, 1000, 30, t('Built with PowerWeb. Make it yours.', language), 15, dark ? '#a9c3b5' : '#64748b');
  }
  const preset = PROJECT_TEMPLATES.find(item => item.id === template)!;
  return { id: generateId(), name: t(preset.name, language), activePageId: pageId,
    pages: [{ id: pageId, name: t('Home', language), width: template === 'blank' ? DEFAULT_PAGE_SIZE.width : 1200, height: template === 'blank' ? DEFAULT_PAGE_SIZE.height : 800, backgroundColor: preset.color,
      transition: 'none', transitionDuration: 0.5,
      layers: [{ id: generateId(), name: t('Layer', language) + ' 1', visible: true, locked: false, elements }] }] };
}
