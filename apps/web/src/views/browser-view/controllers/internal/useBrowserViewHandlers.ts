export function useBrowserViewHandlers<TSourceTreeController extends {
  handleSelectSourceTree: (...args: any[]) => any;
}, TRepositoryActions extends Record<string, unknown>>({
  sourceTreeController,
  repositoryActions,
}: {
  sourceTreeController: TSourceTreeController;
  repositoryActions: TRepositoryActions;
}) {
  return {
    handleSelectSourceTree: sourceTreeController.handleSelectSourceTree,
    ...repositoryActions,
  };
}
