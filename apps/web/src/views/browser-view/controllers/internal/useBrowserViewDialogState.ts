import { useCallback, useState } from 'react';

type SavedCanvasDialogLike = {
  isSavedCanvasDialogOpen: boolean;
  setIsSavedCanvasDialogOpen: (value: boolean) => void;
};

export function useBrowserViewDialogState({
  savedCanvas,
}: {
  savedCanvas: SavedCanvasDialogLike;
}) {
  const [isViewpointDialogOpen, setIsViewpointDialogOpen] = useState(false);

  const openViewpointDialog = useCallback(() => {
    setIsViewpointDialogOpen(true);
  }, []);

  const closeViewpointDialog = useCallback(() => {
    setIsViewpointDialogOpen(false);
  }, []);

  const openSavedCanvasDialog = useCallback(() => {
    savedCanvas.setIsSavedCanvasDialogOpen(true);
  }, [savedCanvas]);

  const closeSavedCanvasDialog = useCallback(() => {
    savedCanvas.setIsSavedCanvasDialogOpen(false);
  }, [savedCanvas]);

  return {
    isViewpointDialogOpen,
    setIsViewpointDialogOpen,
    openViewpointDialog,
    closeViewpointDialog,
    isSavedCanvasDialogOpen: savedCanvas.isSavedCanvasDialogOpen,
    setIsSavedCanvasDialogOpen: savedCanvas.setIsSavedCanvasDialogOpen,
    openSavedCanvasDialog,
    closeSavedCanvasDialog,
  };
}
