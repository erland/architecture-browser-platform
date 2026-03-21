import {
  useWorkspaceDataActions,
  useWorkspaceDataLoaders,
  useWorkspaceDataSelectionSync,
  useWorkspaceDataState,
  type UseWorkspaceDataArgs,
} from "./workspaceData";

export function useWorkspaceData(args: UseWorkspaceDataArgs) {
  const state = useWorkspaceDataState(args.selectedWorkspaceId);
  const loaders = useWorkspaceDataLoaders(args, state);

  useWorkspaceDataSelectionSync(args, state, loaders);

  const actions = useWorkspaceDataActions(args, state, loaders);

  return {
    ...state,
    selectedWorkspaceId: args.selectedWorkspaceId,
    setSelectedWorkspaceId: args.setSelectedWorkspaceId,
    selectedRepositoryId: args.selectedRepositoryId,
    setSelectedRepositoryId: args.setSelectedRepositoryId,
    ...loaders,
    ...actions,
  };
}
