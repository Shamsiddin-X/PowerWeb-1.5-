import { useEffect } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { saveCurrentProject, openCurrentProject, reportError } from '../services/editorCommands';
export const useKeyboardShortcuts = () => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (useEditorStore.getState().isPluginRunning || useEditorStore.getState().showShaderEditor || useEditorStore.getState().showShaderCodeEditor) return;
      if (e.isComposing || e.altKey) return;
      const target = e.target as HTMLElement;
      const ctrl = e.ctrlKey || e.metaKey;
      const session = useEditorStore.getState();
      if (ctrl && e.code === 'KeyZ' && (session.isDragging || session.isResizing || session.insertMode)) {
        e.preventDefault(); session.setInsertMode(null);
        window.dispatchEvent(new Event('powerweb:cancel-gesture')); return;
      }
      if ((session.isDragging || session.isResizing) && e.code !== 'Escape') { e.preventDefault(); return; }
      if (ctrl && ['Equal','Minus','Digit0','NumpadAdd','NumpadSubtract'].includes(e.code)) {
        e.preventDefault(); session.setUiScale(e.code==='Digit0'?1:session.uiScale+(['Minus','NumpadSubtract'].includes(e.code)?-.1:.1));
        return;
      }
      if (ctrl && e.code === 'KeyS') { e.preventDefault(); if (session.hasOpenProject) void saveCurrentProject().catch(reportError); return; }
      if (ctrl && e.code === 'KeyO') { e.preventDefault(); void openCurrentProject().catch(reportError); return; }
      if (session.showStartScreen) return;
      if (target.closest('input,textarea,select,[contenteditable="true"]')) return;
      const s = useEditorStore.getState();
      if(e.code==='F8'){e.preventDefault();s.toggleViewOption('focusMode');return;}
      const commands: Record<string, () => void> = {
        KeyC: s.copySelected, KeyX: s.cutSelected, KeyV: s.pasteElements, KeyD: s.duplicateSelected,
        KeyA: s.selectAll, KeyZ: e.shiftKey ? s.redo : s.undo, KeyY: s.redo,
        KeyG: e.shiftKey ? s.ungroupSelected : s.groupSelected,
      };
      if (ctrl && commands[e.code]) { e.preventDefault(); commands[e.code](); }
      else if (e.code === 'Delete' || e.code === 'Backspace') { e.preventDefault(); s.deleteSelected(); }
      else if (e.code === 'Escape') { s.setInsertMode(null); s.closeContextMenu(); s.deselectAll(); }
      else if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code)) {
        e.preventDefault(); if (!s.historyTransaction) s.beginTransaction('Nudge');
        const step = e.shiftKey ? 10 : 1;
        s.moveElements(s.selectedElementIds, e.code === 'ArrowLeft' ? -step : e.code === 'ArrowRight' ? step : 0,
          e.code === 'ArrowUp' ? -step : e.code === 'ArrowDown' ? step : 0);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => { if (e.code.startsWith('Arrow')) useEditorStore.getState().commitTransaction(); };
    const onBlur = () => useEditorStore.getState().commitTransaction();
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey) || (e.target as HTMLElement).closest('[data-canvas-viewport]')) return;
      e.preventDefault(); const state=useEditorStore.getState();state.setUiScale(state.uiScale+(e.deltaY<0?0.05:-0.05));
    };
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    window.addEventListener('wheel', onWheel, { passive:false });
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('wheel',onWheel); window.removeEventListener('keyup',onKeyUp); window.removeEventListener('blur',onBlur); };
  }, []);
};
