import { useEffect, useState } from "react";

type ApiHealth = {
  status: string;
  service: string;
  version: string;
  time: string;
};

const initialHealth: ApiHealth = {
  status: "unknown",
  service: "architecture-browser-platform-api",
  version: "0.1.0",
  time: "",
};

export function App() {
  const [health, setHealth] = useState<ApiHealth>(initialHealth);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    fetch("/api/health", { signal: abortController.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Health request failed with status ${response.status}`);
        }
        return response.json() as Promise<ApiHealth>;
      })
      .then((payload) => {
        setHealth(payload);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (abortController.signal.aborted) {
          return;
        }
        const message = caught instanceof Error ? caught.message : "Unknown error";
        setError(message);
      });

    return () => abortController.abort();
  }, []);

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Architecture Browser Platform</p>
        <h1>Monorepo baseline</h1>
        <p className="lead">
          Step 1 establishes the web app, API, contracts module, Compose packaging,
          and documentation needed to start the platform implementation.
        </p>
      </section>

      <section className="grid">
        <article className="card">
          <h2>Current scope</h2>
          <ul>
            <li>Platform repository skeleton</li>
            <li>React + TypeScript UI scaffold</li>
            <li>Quarkus API scaffold</li>
            <li>PostgreSQL Compose baseline</li>
            <li>Indexer IR handoff notes</li>
          </ul>
        </article>

        <article className="card">
          <h2>Next planned slices</h2>
          <ul>
            <li>Core domain model and import contract</li>
            <li>Workspace and repository registration</li>
            <li>Index run orchestration and status tracking</li>
            <li>Snapshot import and catalog browsing</li>
          </ul>
        </article>

        <article className="card">
          <h2>API health</h2>
          <dl className="kv">
            <div>
              <dt>Status</dt>
              <dd>{health.status}</dd>
            </div>
            <div>
              <dt>Service</dt>
              <dd>{health.service}</dd>
            </div>
            <div>
              <dt>Version</dt>
              <dd>{health.version}</dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>{health.time || "—"}</dd>
            </div>
          </dl>
          {error ? <p className="error">{error}</p> : null}
        </article>
      </section>
    </main>
  );
}
