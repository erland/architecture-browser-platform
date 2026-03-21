import { useWorkspaceDataActions } from "./workspaceData/useWorkspaceDataActions";
import { useWorkspaceDataLoaders } from "./workspaceData/useWorkspaceDataLoaders";
import { useWorkspaceDataSelectionSync } from "./workspaceData/useWorkspaceDataSelectionSync";
import { useWorkspaceDataState } from "./workspaceData/useWorkspaceDataState";
import type { UseWorkspaceDataArgs } from "./workspaceData/workspaceData.types";

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
