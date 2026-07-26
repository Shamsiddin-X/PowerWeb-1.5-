import { useEffect } from 'react';
import { useEditorStore } from '../store/useEditorStore';

export const useKeyboardShortcuts = () => {
  const { deleteSelected, copySelected, pasteElements, cutSelected, duplicateSelected, undo, redo, groupSelected, ungroupSelected } = useEditorStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if in input, textarea or content editable
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelected();
      }
      else if (ctrl && e.key === 'c') {
        e.preventDefault();
        copySelected();
      }
      else if (ctrl && e.key === 'v') {
        e.preventDefault();
        pasteElements();
      }
      else if (ctrl && e.key === 'x') {
        e.preventDefault();
        cutSelected();
      }
      else if (ctrl && e.key === 'd') {
        e.preventDefault();
        duplicateSelected();
      }
      else if (ctrl && e.key === 'z') {
        e.preventDefault();
        if (shift) {
          redo();
        } else {
          undo();
        }
      }
      else if (ctrl && e.key === 'y') {
        e.preventDefault();
        redo();
      }
      else if (ctrl && e.key === 'g') {
        e.preventDefault();
        if (shift) {
          ungroupSelected();
        } else {
          groupSelected();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelected, copySelected, pasteElements, cutSelected, duplicateSelected, undo, redo, groupSelected, ungroupSelected]);
};
