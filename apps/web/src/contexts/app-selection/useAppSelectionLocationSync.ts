import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { AppSelectionState } from '../../routing/appSelectionState';
import { mergeSelectionWithLocationSearch } from './appSelectionPolicy';

export function useAppSelectionLocationSync(
  setSelection: Dispatch<SetStateAction<AppSelectionState>>,
) {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handlePopState = () => {
      setSelection((current) => mergeSelectionWithLocationSearch(current, window.location.search));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setSelection]);
}
