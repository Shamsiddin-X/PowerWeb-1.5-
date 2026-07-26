import { useEffect } from 'react';
import { useEditorStore } from '../store/useEditorStore';

export const useTheme = () => {
  const theme = useEditorStore(state => state.theme);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
};
