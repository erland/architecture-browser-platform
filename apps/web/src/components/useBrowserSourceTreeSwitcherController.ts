import { type Dispatch, type FormEvent, type SetStateAction, useEffect, useMemo, useState } from 'react';
import { emptyRepositoryForm, type Repository, type RepositorySourceType, type RepositoryUpdateRequest } from '../appModel';
import type { SourceTreeLauncherItem } from '../appModel.sourceTree';

export type BrowserSourceTreeSwitcherControllerArgs = {
  isOpen: boolean;
  items: SourceTreeLauncherItem[];
  repositories: Repository[];
  onSelectSourceTree: (item: SourceTreeLauncherItem) => void;
  onCreateRepository: (payload: typeof emptyRepositoryForm) => Promise<void>;
  onRequestReindex: (repository: Repository) => Promise<void>;
  onArchiveRepository: (repository: Repository) => Promise<void>;
  onUpdateRepository: (repository: Repository, payload: RepositoryUpdateRequest) => Promise<void>;
  onClose: () => void;
};

export type BrowserSourceTreeSwitcherController = {
  repositoriesById: Map<string, Repository>;
  isAddDialogOpen: boolean;
  repositoryForm: typeof emptyRepositoryForm;
  setRepositoryForm: Dispatch<SetStateAction<typeof emptyRepositoryForm>>;
  actionRepositoryId: string | null;
  editRepositoryId: string | null;
  editRepositoryForm: RepositoryUpdateRequest;
  setEditRepositoryForm: Dispatch<SetStateAction<RepositoryUpdateRequest>>;
  closeAddDialog: () => void;
  closeEditDialog: () => void;
  openAddDialog: () => void;
  openEditDialog: (repository: Repository) => void;
  selectItem: (item: SourceTreeLauncherItem) => void;
  createRepository: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  updateRepository: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  reindexItem: (item: SourceTreeLauncherItem) => Promise<void>;
  archiveItem: (item: SourceTreeLauncherItem) => Promise<void>;
};

function buildInitialRepositoryForm() {
  return { ...emptyRepositoryForm };
}

export function isGitSource(sourceType: RepositorySourceType) {
  return sourceType === 'GIT';
}

export function isLocalSource(sourceType: RepositorySourceType) {
  return sourceType === 'LOCAL_PATH';
}

export function formatLastIndexedLabel(value: string | null) {
  return value ? `Indexed ${value}` : 'Not indexed yet';
}

export function useBrowserSourceTreeSwitcherController({
  isOpen,
  repositories,
  onSelectSourceTree,
  onCreateRepository,
  onRequestReindex,
  onArchiveRepository,
  onUpdateRepository,
  onClose,
}: BrowserSourceTreeSwitcherControllerArgs): BrowserSourceTreeSwitcherController {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [repositoryForm, setRepositoryForm] = useState(buildInitialRepositoryForm);
  const [actionRepositoryId, setActionRepositoryId] = useState<string | null>(null);
  const [editRepositoryId, setEditRepositoryId] = useState<string | null>(null);
  const [editRepositoryForm, setEditRepositoryForm] = useState<RepositoryUpdateRequest>({
    name: '',
    localPath: '',
    remoteUrl: '',
    defaultBranch: 'main',
    metadataJson: '',
  });

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }
      if (editRepositoryId) {
        setEditRepositoryId(null);
        return;
      }
      if (isAddDialogOpen) {
        setIsAddDialogOpen(false);
        return;
      }
      onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isAddDialogOpen, editRepositoryId, onClose]);

  const repositoriesById = useMemo(() => {
    const result = new Map<string, Repository>();
    for (const repository of repositories) {
      result.set(repository.id, repository);
    }
    return result;
  }, [repositories]);

  const openAddDialog = () => {
    setRepositoryForm(buildInitialRepositoryForm());
    setIsAddDialogOpen(true);
  };

  const closeAddDialog = () => {
    setIsAddDialogOpen(false);
  };

  const openEditDialog = (repository: Repository) => {
    setEditRepositoryId(repository.id);
    setEditRepositoryForm({
      name: repository.name,
      localPath: repository.localPath ?? '',
      remoteUrl: repository.remoteUrl ?? '',
      defaultBranch: repository.defaultBranch ?? '',
      metadataJson: repository.metadataJson ?? '',
    });
  };

  const closeEditDialog = () => {
    setEditRepositoryId(null);
  };

  const updateRepository = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editRepositoryId) {
      return;
    }
    const repository = repositoriesById.get(editRepositoryId);
    if (!repository) {
      return;
    }
    setActionRepositoryId(repository.id);
    try {
      await onUpdateRepository(repository, editRepositoryForm);
      setEditRepositoryId(null);
    } finally {
      setActionRepositoryId(null);
    }
  };

  const createRepository = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onCreateRepository(repositoryForm);
    setRepositoryForm(buildInitialRepositoryForm());
    setIsAddDialogOpen(false);
  };

  const reindexItem = async (item: SourceTreeLauncherItem) => {
    const repository = repositoriesById.get(item.repositoryId);
    if (!repository) {
      return;
    }
    setActionRepositoryId(repository.id);
    try {
      await onRequestReindex(repository);
    } finally {
      setActionRepositoryId(null);
    }
  };

  const archiveItem = async (item: SourceTreeLauncherItem) => {
    const repository = repositoriesById.get(item.repositoryId);
    if (!repository) {
      return;
    }
    const confirmed = typeof window === 'undefined'
      ? true
      : window.confirm(`Archive source tree "${item.sourceTreeLabel}"?`);
    if (!confirmed) {
      return;
    }
    setActionRepositoryId(repository.id);
    try {
      await onArchiveRepository(repository);
    } finally {
      setActionRepositoryId(null);
    }
  };

  const selectItem = (item: SourceTreeLauncherItem) => {
    onSelectSourceTree(item);
    onClose();
  };

  return {
    repositoriesById,
    isAddDialogOpen,
    repositoryForm,
    setRepositoryForm,
    actionRepositoryId,
    editRepositoryId,
    editRepositoryForm,
    setEditRepositoryForm,
    closeAddDialog,
    closeEditDialog,
    openAddDialog,
    openEditDialog,
    selectItem,
    createRepository,
    updateRepository,
    reindexItem,
    archiveItem,
  };
}
