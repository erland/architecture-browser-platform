import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { emptyRepositoryForm, type RepositorySourceType, type RepositoryUpdateRequest } from '../../app-model';
import { isGitSource, isLocalSource } from './useBrowserSourceTreeSwitcherController';

export type BrowserSourceTreeCreateFormPanelProps = {
  repositoryForm: typeof emptyRepositoryForm;
  onChange: Dispatch<SetStateAction<typeof emptyRepositoryForm>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onClose: () => void;
};

export type BrowserSourceTreeEditFormPanelProps = {
  repositoryForm: RepositoryUpdateRequest;
  onChange: Dispatch<SetStateAction<RepositoryUpdateRequest>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onClose: () => void;
};

export function BrowserSourceTreeCreateFormPanel({
  repositoryForm,
  onChange,
  onSubmit,
  onClose,
}: BrowserSourceTreeCreateFormPanelProps) {
  return (
    <section className="card browser-dialog__nested-panel" aria-label="Add source tree">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Register source tree</p>
          <h3>Add source tree</h3>
        </div>
        <button type="button" className="button-secondary" onClick={onClose}>Close</button>
      </div>
      <form className="grid-form" onSubmit={(event) => void onSubmit(event)}>
        <label>
          <span>Key</span>
          <input
            value={repositoryForm.repositoryKey}
            onChange={(event) => onChange((current) => ({ ...current, repositoryKey: event.target.value }))}
            placeholder="customs-api"
            required
          />
        </label>
        <label>
          <span>Name</span>
          <input
            value={repositoryForm.name}
            onChange={(event) => onChange((current) => ({ ...current, name: event.target.value }))}
            placeholder="Customs API"
            required
          />
        </label>
        <label>
          <span>Source type</span>
          <select
            value={repositoryForm.sourceType}
            onChange={(event) => onChange((current) => ({
              ...current,
              sourceType: event.target.value as RepositorySourceType,
              localPath: event.target.value === 'LOCAL_PATH' ? current.localPath : '',
              remoteUrl: event.target.value === 'GIT' ? current.remoteUrl : '',
            }))}
          >
            <option value="LOCAL_PATH">Local path</option>
            <option value="GIT">Git</option>
          </select>
        </label>
        {isLocalSource(repositoryForm.sourceType) ? (
          <label>
            <span>Local path</span>
            <input
              value={repositoryForm.localPath}
              onChange={(event) => onChange((current) => ({ ...current, localPath: event.target.value }))}
              placeholder="/repos/customs-api"
              required
            />
          </label>
        ) : null}
        {isGitSource(repositoryForm.sourceType) ? (
          <label>
            <span>Remote URL</span>
            <input
              value={repositoryForm.remoteUrl}
              onChange={(event) => onChange((current) => ({ ...current, remoteUrl: event.target.value }))}
              placeholder="https://github.com/example/customs-api.git"
              required
            />
          </label>
        ) : null}
        <label>
          <span>Default branch</span>
          <input
            value={repositoryForm.defaultBranch}
            onChange={(event) => onChange((current) => ({ ...current, defaultBranch: event.target.value }))}
            placeholder="main"
          />
        </label>
        <label>
          <span>Metadata JSON</span>
          <textarea
            value={repositoryForm.metadataJson}
            onChange={(event) => onChange((current) => ({ ...current, metadataJson: event.target.value }))}
            placeholder='{"team":"platform"}'
          />
        </label>
        <div className="actions">
          <button type="submit">Save source tree</button>
        </div>
      </form>
    </section>
  );
}

export function BrowserSourceTreeEditFormPanel({
  repositoryForm,
  onChange,
  onSubmit,
  onClose,
}: BrowserSourceTreeEditFormPanelProps) {
  return (
    <section className="card browser-dialog__nested-panel" aria-label="Edit source tree">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Source tree settings</p>
          <h3>Edit source tree</h3>
        </div>
        <button type="button" className="button-secondary" onClick={onClose}>Close</button>
      </div>
      <form className="grid-form" onSubmit={(event) => void onSubmit(event)}>
        <label>
          <span>Name</span>
          <input value={repositoryForm.name} onChange={(event) => onChange((current) => ({ ...current, name: event.target.value }))} required />
        </label>
        <label>
          <span>Local path</span>
          <input value={repositoryForm.localPath ?? ''} onChange={(event) => onChange((current) => ({ ...current, localPath: event.target.value }))} />
        </label>
        <label>
          <span>Remote URL</span>
          <input value={repositoryForm.remoteUrl ?? ''} onChange={(event) => onChange((current) => ({ ...current, remoteUrl: event.target.value }))} />
        </label>
        <label>
          <span>Default branch</span>
          <input value={repositoryForm.defaultBranch ?? ''} onChange={(event) => onChange((current) => ({ ...current, defaultBranch: event.target.value }))} placeholder="main" />
        </label>
        <label>
          <span>Metadata JSON</span>
          <textarea
            value={repositoryForm.metadataJson ?? ''}
            onChange={(event) => onChange((current) => ({ ...current, metadataJson: event.target.value }))}
            placeholder='{"team":"platform"}'
          />
        </label>
        <div className="actions">
          <button type="submit">Save source tree</button>
        </div>
      </form>
    </section>
  );
}
