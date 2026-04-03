import { createBrowserAutoLayoutPipelineContext } from '../../core/pipeline';
import type {
  BrowserAutoLayoutPipelineContext,
  BrowserAutoLayoutStrategy,
} from '../../core/pipeline';
import type {
  BrowserAutoLayoutGraph,
  BrowserAutoLayoutMode,
  BrowserAutoLayoutRequest,
  BrowserAutoLayoutResult,
} from '../../core/types';
import { getBrowserAutoLayoutConfig } from '../../core/config';

export type BrowserAutoLayoutModeEngine = {
  mode: BrowserAutoLayoutMode;
  runWithContext: (context: BrowserAutoLayoutPipelineContext) => BrowserAutoLayoutResult;
  strategy: BrowserAutoLayoutStrategy;
  createContext: (request: BrowserAutoLayoutRequest, graph?: BrowserAutoLayoutGraph) => BrowserAutoLayoutPipelineContext;
  run: (request: BrowserAutoLayoutRequest, graph?: BrowserAutoLayoutGraph) => BrowserAutoLayoutResult;
};

export function createBrowserAutoLayoutModeContext(
  request: BrowserAutoLayoutRequest,
  graph?: BrowserAutoLayoutGraph,
): BrowserAutoLayoutPipelineContext {
  if (!graph) {
    return createBrowserAutoLayoutPipelineContext(request);
  }

  return {
    request,
    config: getBrowserAutoLayoutConfig(request),
    graph,
    mode: request.mode,
  };
}

export function createBrowserAutoLayoutModeEngine(
  mode: BrowserAutoLayoutMode,
  runWithContext: (context: BrowserAutoLayoutPipelineContext) => BrowserAutoLayoutResult,
): BrowserAutoLayoutModeEngine {
  return {
    mode,
    runWithContext,
    strategy: {
      mode,
      run: runWithContext,
    },
    createContext: (request, graph) => createBrowserAutoLayoutModeContext(request, graph),
    run: (request, graph) => runWithContext(createBrowserAutoLayoutModeContext(request, graph)),
  };
}
