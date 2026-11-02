import { StateCreator } from 'zustand';
import { EditorState } from '../../types';
import { contextOf, normalizeContext, withHistory } from '../helpers';
export interface HistorySlice {
  undo: () => void;
  redo: () => void;
  beginTransaction: (label?: string) => void;
  commitTransaction: () => void;
  cancelTransaction: () => void;
  markSaved: () => void;
}
type State = EditorState & HistorySlice;
export const createHistorySlice: StateCreator<State, [], [], HistorySlice> = (set, get) => ({
  beginTransaction: (label = 'Edit') => set(s => s.historyTransaction ? {} : {
    historyTransaction: { project: s.project, ...contextOf(s), label }, historyMergeKey: null,
  }),
  commitTransaction: () => set(s => {
    const tx = s.historyTransaction;
    if (!tx) return {};
    const change = withHistory({ ...s, project: tx.project, ...contextOf(tx), historyTransaction: null }, s.project);
    return { ...change, ...normalizeContext(s.project, contextOf(s)), historyTransaction: null, historyMergeKey: null };
  }),
  cancelTransaction: () => set(s => !s.historyTransaction ? {} : {
    project: s.historyTransaction.project, ...normalizeContext(s.historyTransaction.project, s.historyTransaction),
    historyTransaction: null, historyMergeKey: null, isDragging: false, isResizing: false,
  }),
  undo: () => {
    get().commitTransaction();
    set(s => {
      if (s.historyIndex <= 0) return {};
      const index = s.historyIndex - 1;
      const contexts = [...s.historyContexts];
      contexts[s.historyIndex] = contextOf(s);
      return { project: s.history[index], ...normalizeContext(s.history[index], contexts[index] || contextOf(s)),
        historyIndex: index, historyContexts: contexts, historyMergeKey: null, insertMode: null,
        isDragging: false, isResizing: false, contextMenu: { ...s.contextMenu, visible: false } };
    });
  },
  redo: () => {
    get().commitTransaction();
    set(s => {
      if (s.historyIndex >= s.history.length - 1) return {};
      const index = s.historyIndex + 1;
      return { project: s.history[index], ...normalizeContext(s.history[index], s.historyContexts[index] || contextOf(s)),
        historyIndex: index, historyMergeKey: null, insertMode: null, isDragging: false, isResizing: false };
    });
  },
  markSaved: () => set(s => ({ savedProject: s.project })),
});
