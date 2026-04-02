export type BrowserRoutingFeatureFlags = {
  orthogonalRouting: boolean;
  laneSeparation: boolean;
  postLayoutCleanup: boolean;
};

export type BrowserRoutingConservativeDefaults = {
  gridSize: number;
  obstacleMargin: number;
  laneSpacing: number;
  maxChannelShiftSteps: number;
  endpointStubLength: number;
  maxLaneCountForSpacing: number;
};

export type BrowserRoutingLayoutConfig = {
  features: BrowserRoutingFeatureFlags;
  defaults: BrowserRoutingConservativeDefaults;
};

export function createDefaultBrowserRoutingLayoutConfig(): BrowserRoutingLayoutConfig {
  return {
    features: {
      orthogonalRouting: true,
      laneSeparation: true,
      postLayoutCleanup: true,
    },
    defaults: {
      gridSize: 20,
      obstacleMargin: 10,
      laneSpacing: 16,
      maxChannelShiftSteps: 12,
      endpointStubLength: 10,
      maxLaneCountForSpacing: 5,
    },
  };
}

export function normalizeBrowserRoutingLayoutConfig(
  value?: Partial<BrowserRoutingLayoutConfig> | null,
): BrowserRoutingLayoutConfig {
  const defaults = createDefaultBrowserRoutingLayoutConfig();
  return {
    features: {
      orthogonalRouting: value?.features?.orthogonalRouting ?? defaults.features.orthogonalRouting,
      laneSeparation: value?.features?.laneSeparation ?? defaults.features.laneSeparation,
      postLayoutCleanup: value?.features?.postLayoutCleanup ?? defaults.features.postLayoutCleanup,
    },
    defaults: {
      gridSize: Number.isFinite(value?.defaults?.gridSize) ? Math.max(4, value!.defaults!.gridSize) : defaults.defaults.gridSize,
      obstacleMargin: Number.isFinite(value?.defaults?.obstacleMargin) ? Math.max(0, value!.defaults!.obstacleMargin) : defaults.defaults.obstacleMargin,
      laneSpacing: Number.isFinite(value?.defaults?.laneSpacing) ? Math.max(0, value!.defaults!.laneSpacing) : defaults.defaults.laneSpacing,
      maxChannelShiftSteps: Number.isFinite(value?.defaults?.maxChannelShiftSteps)
        ? Math.max(0, Math.round(value!.defaults!.maxChannelShiftSteps))
        : defaults.defaults.maxChannelShiftSteps,
      endpointStubLength: Number.isFinite(value?.defaults?.endpointStubLength)
        ? Math.max(0, value!.defaults!.endpointStubLength)
        : defaults.defaults.endpointStubLength,
      maxLaneCountForSpacing: Number.isFinite(value?.defaults?.maxLaneCountForSpacing)
        ? Math.max(1, Math.round(value!.defaults!.maxLaneCountForSpacing))
        : defaults.defaults.maxLaneCountForSpacing,
    },
  };
}
