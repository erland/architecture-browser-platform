import { useEffect, useState } from "react";
import type { BrowserSnapshotIndex } from "../browserSnapshotIndex";
import { getOrBuildBrowserSnapshotIndex } from "../browserSnapshotIndex";
import { getBrowserSnapshotCache } from "../snapshotCache";

function toErrorMessage(caught: unknown) {
  return caught instanceof Error ? caught.message : "Unknown error";
}

export type LocalSnapshotIndexStatus = "idle" | "loading" | "ready" | "missing" | "error";

export function useLocalSnapshotIndex(snapshotId: string | null) {
  const [status, setStatus] = useState<LocalSnapshotIndexStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [index, setIndex] = useState<BrowserSnapshotIndex | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadIndex() {
      if (!snapshotId) {
        if (!cancelled) {
          setStatus("idle");
          setMessage(null);
          setIndex(null);
        }
        return;
      }

      if (!cancelled) {
        setStatus("loading");
        setMessage("Building local browser indexes…");
      }

      try {
        const record = await getBrowserSnapshotCache().getSnapshot(snapshotId);
        if (!record) {
          if (!cancelled) {
            setStatus("missing");
            setMessage("Snapshot is not cached locally yet.");
            setIndex(null);
          }
          return;
        }

        const built = getOrBuildBrowserSnapshotIndex(record.payload);
        if (!cancelled) {
          setStatus("ready");
          setMessage(`Local browser indexes ready for snapshot ${record.payload.snapshot.snapshotKey}.`);
          setIndex(built);
        }
      } catch (caught) {
        if (!cancelled) {
          setStatus("error");
          setMessage(`Local browser indexes failed: ${toErrorMessage(caught)}`);
          setIndex(null);
        }
      }
    }

    void loadIndex();

    return () => {
      cancelled = true;
    };
  }, [snapshotId]);

  return {
    status,
    message,
    index,
    isReady: status === "ready",
  };
}
