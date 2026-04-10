import { useEffect } from 'react';
import type { AppSelectionState } from '../../routing/appSelectionState';
import { persistAppSelection, syncAppSelectionSearch } from './appSelectionStorage';

export function useAppSelectionPersistence(selection: AppSelectionState) {
  useEffect(() => {
    persistAppSelection(selection);
    syncAppSelectionSearch(selection);
  }, [selection]);
}
