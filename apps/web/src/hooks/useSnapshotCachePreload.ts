import { useEffect, useState } from "react";
import type { FullSnapshotPayload, SnapshotSummary } from "../appModel";
import { platformApi } from "../platformApi";
import { getBrowserSnapshotCache } from "../snapshotCache";

function toErrorMessage(caught: unknown) {
  return caught instanceof Error ? caught.message : "Unknown error";
}

export type SnapshotCacheStatus = "idle" | "checking" | "downloading" | "cached" | "error";

export function useSnapshotCachePreload(workspaceId: string | null, snapshot: SnapshotSummary | null) {
  const [status, setStatus] = useState<SnapshotCacheStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function preloadSelectedSnapshot() {
      if (!workspaceId || !snapshot) {
        if (!cancelled) {
          setStatus("idle");
          setMessage(null);
        }
        return;
      }

      const snapshotCache = getBrowserSnapshotCache();
      if (!cancelled) {
        setStatus("checking");
        setMessage("Checking local snapshot cache…");
      }

      try {
        const cachedRecord = await snapshotCache.getSnapshot(snapshot.id);
        if (snapshotCache.isSnapshotCurrent(snapshot, cachedRecord)) {
          if (!cancelled) {
            setStatus("cached");
            setMessage(cachedRecord ? `Snapshot cached locally (${cachedRecord.cachedAt}).` : "Snapshot cached locally.");
          }
          return;
        }

        if (!cancelled) {
          setStatus("downloading");
          setMessage("Downloading snapshot for local browser cache…");
        }

        const payload = await platformApi.getFullSnapshotPayload<FullSnapshotPayload>(workspaceId, snapshot.id);
        await snapshotCache.putSnapshot({
          workspaceId,
          repositoryId: snapshot.repositoryRegistrationId,
          snapshotKey: snapshot.snapshotKey,
          cacheVersion: snapshotCache.buildCacheVersion(snapshot),
          payload,
        });

        if (!cancelled) {
          setStatus("cached");
          setMessage("Snapshot cached locally for Browser.");
        }
      } catch (caught) {
        if (!cancelled) {
          setStatus("error");
          setMessage(`Snapshot cache failed: ${toErrorMessage(caught)}`);
        }
      }
    }

    void preloadSelectedSnapshot();

    return () => {
      cancelled = true;
    };
  }, [workspaceId, snapshot]);

  return {
    status,
    message,
    isReady: status === "cached",
  };
}
