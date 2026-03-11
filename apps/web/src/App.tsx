import { useEffect, useState } from "react";

type ApiHealth = {
  status: string;
  service: string;
  version: string;
  time: string;
};

type DomainModel = {
  aggregateRoots: string[];
  importProjection: string[];
  notes: string[];
};

const initialHealth: ApiHealth = {
  status: "unknown",
  service: "architecture-browser-platform-api",
  version: "0.1.0",
  time: "",
};

const initialDomainModel: DomainModel = {
  aggregateRoots: [],
  importProjection: [],
  notes: [],
};

export function App() {
  const [health, setHealth] = useState<ApiHealth>(initialHealth);
  const [domainModel, setDomainModel] = useState<DomainModel>(initialDomainModel);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    Promise.all([
      fetch("/api/health", { signal: abortController.signal }).then(async (response) => {
        if (!response.ok) {
          throw new Error(`Health request failed with status ${response.status}`);
        }
        return response.json() as Promise<ApiHealth>;
      }),
      fetch("/api/domain-model", { signal: abortController.signal }).then(async (response) => {
        if (!response.ok) {
          throw new Error(`Domain model request failed with status ${response.status}`);
        }
        return response.json() as Promise<DomainModel>;
      }),
    ])
      .then(([healthPayload, domainModelPayload]) => {
        setHealth(healthPayload);
        setDomainModel(domainModelPayload);
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
        <h1>Core domain model and import contract</h1>
        <p className="lead">
          Step 2 defines the platform aggregates, Flyway-backed schema baseline, and a versioned
          stub import path for immutable indexer snapshots.
        </p>
      </section>

      <section className="grid">
        <article className="card">
          <h2>Step 2 deliverables</h2>
          <ul>
            <li>Workspace, repository, run, snapshot, overlay, saved-view, audit aggregates</li>
            <li>Flyway migrations owned by the API application</li>
            <li>JPA/Panache persistence model</li>
            <li>Versioned indexer IR validation and stub storage path</li>
          </ul>
        </article>

        <article className="card">
          <h2>Domain model</h2>
          <p>Aggregate roots</p>
          <ul>
            {domainModel.aggregateRoots.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>Imported projections</p>
          <ul>
            {domainModel.importProjection.map((item) => (
              <li key={item}>{item}</li>
            ))}
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

        <article className="card card--wide">
          <h2>Notes</h2>
          <ul>
            {domainModel.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}
