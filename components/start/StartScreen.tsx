import React, { useMemo, useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Clock3, FilePlus2, FileText, FolderOpen, House, LayoutTemplate, Moon, Pin, Plus, Search, Sun, Trash2, Zap } from 'lucide-react';
import { useEditorStore } from '../../store/useEditorStore';
import { createCurrentProject, openCurrentProject, openRecentProject } from '../../services/editorCommands';
import { pinRecentProject, readRecentProjects, removeRecentProject } from '../../services/projectLibrary';
import { createProjectFromTemplate, PROJECT_TEMPLATES } from '../../utils/projectTemplates';
import { CanvasElement, Language, Project } from '../../types';
import { LanguagePicker } from '../ui/LanguagePicker';
import { languageInfo } from '../../utils/languages';
import '../ribbon/view.css';
import { t } from '../../utils/localization';
import './start.css';

function ProjectPreview({ project }: { project: Project }) {
  const page = project.pages[0];
  const render = (element: CanvasElement): React.ReactNode => {
    const { id, x, y, width, height, style, type } = element;
    if (type === 'text' || type === 'button') {
      const size = style.fontSize || 16;
      const words = (element.content || '').split(/\s+/);
      const lines: string[] = [''];
      const length = Math.max(1, Math.floor(width / (size * .56)));
      words.forEach(word => {
        const last = lines.length - 1;
        if ((lines[last] + ' ' + word).length > length && lines[last]) lines.push(word);
        else lines[last] += (lines[last] ? ' ' : '') + word;
      });
      return <g key={id}>
        {type === 'button' && <rect x={x} y={y} width={width} height={height} rx={style.borderRadius} fill={style.fill} />}
        <text x={type === 'button' ? x + width / 2 : x} y={type === 'button' ? y + height / 2 + size * .35 : y + size}
          textAnchor={type === 'button' ? 'middle' : 'start'} fill={style.color} fontFamily="Inter, sans-serif" fontSize={size} fontWeight={style.fontWeight}>
          {lines.slice(0, Math.max(1, Math.floor(height / (size * 1.2)))).map((line, i) => <tspan key={i} x={type === 'button' ? x + width / 2 : x} dy={i ? size * 1.2 : 0}>{line}</tspan>)}
        </text>
      </g>;
    }
    if (type === 'circle') return <ellipse key={id} cx={x + width / 2} cy={y + height / 2} rx={width / 2} ry={height / 2} fill={style.fill} />;
    if (type === 'rect') return <rect key={id} x={x} y={y} width={width} height={height} rx={style.borderRadius} fill={style.fill} />;
    return null;
  };
  return <svg direction="ltr" viewBox={`0 0 ${page.width} ${page.height}`} aria-hidden="true">
    <rect width={page.width} height={page.height} fill={page.backgroundColor} />
    {page.layers.filter(layer => layer.visible).flatMap(layer => layer.elements).map(render)}
  </svg>;
}

export function StartScreen() {
  const { language, setLanguage, theme, toggleTheme, hasOpenProject, project, setShowStartScreen } = useEditorStore();
  const [section, setSection] = useState<'home' | 'create' | 'open'>('home');
  const [filter, setFilter] = useState<'recent' | 'pinned'>('recent');
  const [search, setSearch] = useState('');
  const [entries, setEntries] = useState(readRecentProjects);
  useEffect(()=>{const refresh=()=>setEntries(readRecentProjects());window.addEventListener('powerweb:recent-projects-changed',refresh);return ()=>window.removeEventListener('powerweb:recent-projects-changed',refresh);},[]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const templates = useMemo(() => PROJECT_TEMPLATES.map(item => ({ ...item, project: createProjectFromTemplate(item.id, language) })), [language]);
  const hour = new Date().getHours();
  const greeting = hour < 6 ? 'Good night' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const locale = languageInfo(language).locale;
  const shown = entries.filter(entry => (filter === 'recent' || entry.pinned) && entry.project.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const run = async (action: () => unknown) => {
    if (busy) return;
    setError(''); setBusy(true);
    try { await action(); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };
  const updateLibrary = (action: () => boolean) => {
    if (!action()) setError(t('Could not update local projects. Your current work is still open.', language));
    else { setEntries(readRecentProjects()); setError(''); }
  };

  return <div dir={language==='ar'?'rtl':'ltr'} className="start-screen" data-start-screen>
    <aside className="start-sidebar">
      <div className="start-brand"><span className="start-brand-icon"><Zap size={25} fill="currentColor" /></span><span>PowerWeb<small>Beta 1.5.1</small></span></div>
      {hasOpenProject && <button className="start-return" onClick={() => setShowStartScreen(false)}><ArrowLeft size={17} /><span>{t('Back to editor', language)}</span></button>}
      <nav aria-label={t('Start menu', language)}>
        {([{ id: 'home', icon: House, label: 'Home' }, { id: 'create', icon: FilePlus2, label: 'Create' }, { id: 'open', icon: FolderOpen, label: 'Open' }] as const).map(item =>
          <button key={item.id} onClick={() => setSection(item.id)} aria-current={section === item.id ? 'page' : undefined}>
            <item.icon size={23} strokeWidth={1.5} /><span>{t(item.label, language)}</span>
          </button>)}
      </nav>
      <div className="start-sidebar-bottom"><span>{t('Your ideas. Your website.', language)}</span><small>{t('Create with PowerWeb', language)}</small></div>
    </aside>

    <div className="start-workspace">
      <header className="start-header"><span>{t('Welcome to your workspace', language)}</span>
        <div className="start-preferences">
          <LanguagePicker value={language} onChange={setLanguage}/>
          <button onClick={toggleTheme} aria-label={t(theme === 'light' ? 'Dark theme' : 'Light theme', language)} title={t(theme === 'light' ? 'Dark theme' : 'Light theme', language)}>{theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}</button>
        </div>
      </header>
      <main className="start-main" aria-busy={busy}>
        <div className="start-heading"><div><h1>{t(section === 'home' ? greeting : section === 'create' ? 'Create a project' : 'Open a project', language)}</h1>
          <p>{t(section === 'open' ? 'Continue with a .pwb file or a local copy.' : 'Every great website starts with an idea.', language)}</p></div>
          {hasOpenProject && <button className="start-continue" onClick={() => setShowStartScreen(false)}><span>{t('Continue editing', language)}<small>{project.name}</small></span><ArrowRight size={19} /></button>}
        </div>
        {error && <div role="alert" className="start-error">{error}</div>}

        {section === 'open' ? <section className="start-open-card">
          <div className="start-open-icon"><FolderOpen size={34} strokeWidth={1.4} /></div>
          <div><h2>{t('Open from your device', language)}</h2><p>{t('Choose a PowerWeb project to continue working.', language)}</p></div>
          <button className="start-primary" disabled={busy} onClick={() => void run(openCurrentProject)}><FolderOpen size={17} />{t('Choose .pwb file', language)}</button>
        </section> : <section aria-labelledby="start-create-title" className="start-template-section">
          <div className="start-section-title"><h2 id="start-create-title"><LayoutTemplate size={19} />{t('Create', language)}</h2><span>{t('Choose your starting point', language)}</span></div>
          <div className="start-templates">
            {templates.map(item => <button key={item.id} className={`start-template ${item.id === 'blank' ? 'is-blank' : ''}`} disabled={busy} onClick={() => void run(() => createCurrentProject(item.id))}>
              <div className="start-template-preview">{item.id === 'blank' ? <div className="start-blank-page"><Plus size={27} strokeWidth={1.3} /></div> : <ProjectPreview project={item.project} />}
                <span className="start-template-add"><Plus size={16} /></span>
              </div>
              <strong>{t(item.name, language)}</strong><small>{t(item.description, language)}</small>
            </button>)}
          </div>
        </section>}

        {section !== 'create' && <section className="start-recents" aria-label={t('Recent projects', language)}>
          <div className="start-recent-toolbar"><div className="start-recent-tabs" role="group" aria-label={t('Project list', language)}>
            <button aria-pressed={filter === 'recent'} onClick={() => setFilter('recent')}><Clock3 size={16} />{t('Recent', language)}</button>
            <button aria-pressed={filter === 'pinned'} onClick={() => setFilter('pinned')}><Pin size={16} />{t('Pinned', language)}</button>
          </div><label className="start-search"><Search size={16} /><input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('Find a project', language)} aria-label={t('Find a project', language)} /></label></div>
          <p className="start-local-note">{t('Local copies on this device. Save a .pwb file to keep a separate copy.', language)}</p>
          {shown.length ? <div className="start-project-list"><div className="start-list-heading"><span>{t('Name', language)}</span><span>{t('Last opened', language)}</span><span /></div>
            {shown.map(entry => <div key={entry.project.id} className="start-project-row">
              <button className="start-project-open" disabled={busy} onClick={() => void run(() => openRecentProject(entry.project.id))}>
                <span className="start-recent-preview">{entry.preview?<img src={entry.preview} alt=""/>:<FileText size={22} strokeWidth={1.5}/>}</span><span><strong>{entry.project.name}</strong><small>{t('Local project', language)} · {entry.project.pages.length} {t('pages', language)}</small></span>
              </button>
              <time dateTime={new Date(entry.updatedAt).toISOString()}>{new Date(entry.updatedAt).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}</time>
              <div className="start-row-actions"><button aria-pressed={entry.pinned} aria-label={`${t(entry.pinned ? 'Unpin' : 'Pin', language)}: ${entry.project.name}`} title={t(entry.pinned ? 'Unpin' : 'Pin', language)} onClick={() => updateLibrary(() => pinRecentProject(entry.project.id))}><Pin size={16} fill={entry.pinned ? 'currentColor' : 'none'} /></button>
                <button aria-label={`${t('Remove from list', language)}: ${entry.project.name}`} title={t('Remove from list', language)} onClick={() => updateLibrary(() => removeRecentProject(entry.project.id))}><Trash2 size={16} /></button></div>
            </div>)}
          </div> : <div className="start-empty"><span className="start-empty-icon">{filter === 'pinned' ? <Pin size={27} strokeWidth={1.3} /> : <FolderOpen size={29} strokeWidth={1.3} />}</span>
            <h3>{t(search ? 'No projects found' : filter === 'pinned' ? 'Keep your favourites close' : 'Your next project starts here', language)}</h3>
            <p>{t(search ? 'Try a different project name.' : filter === 'pinned' ? 'Pin a recent project to find it here.' : 'Create a new project or open an existing .pwb file.', language)}</p>
            {!search && filter === 'recent' && <button className="start-text-button" disabled={busy} onClick={() => void run(openCurrentProject)}>{t('Open a project', language)}<ArrowRight size={16} /></button>}
          </div>}
        </section>}
        <footer className="start-footer"><span>POWERWEB <span>1.5.1</span></span><span>{t('Made for your next idea', language)}</span></footer>
      </main>
    </div>
  </div>;
}
