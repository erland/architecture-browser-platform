import type { Repository } from "../../appModel";
import type { RepositoryEditor, WorkspaceEditor } from "./workspaceData.types";

export const initialRetentionForm = {
  keepSnapshotsPerRepository: "2",
  keepRunsPerRepository: "5",
};

export function toErrorMessage(caught: unknown) {
  return caught instanceof Error ? caught.message : "Unknown error";
}

export function emptyWorkspaceEditor(): WorkspaceEditor {
  return { name: "", description: "" };
}

export function emptyRepositoryEditor(): RepositoryEditor {
  return {
    id: null,
    name: "",
    localPath: "",
    remoteUrl: "",
    defaultBranch: "main",
    metadataJson: "",
  };
}

export function isEmptyRepositoryEditor(editor: RepositoryEditor) {
  return editor.id === null
    && editor.name === ""
    && editor.localPath === ""
    && editor.remoteUrl === ""
    && editor.defaultBranch === "main"
    && editor.metadataJson === "";
}

export function toRepositoryEditor(repository: Repository): RepositoryEditor {
  return {
    id: repository.id,
    name: repository.name,
    localPath: repository.localPath ?? "",
    remoteUrl: repository.remoteUrl ?? "",
    defaultBranch: repository.defaultBranch ?? "",
    metadataJson: repository.metadataJson ?? "",
  };
}

export function sameRepositoryEditor(left: RepositoryEditor, right: RepositoryEditor) {
  return left.id === right.id
    && left.name === right.name
    && left.localPath === right.localPath
    && left.remoteUrl === right.remoteUrl
    && left.defaultBranch === right.defaultBranch
    && left.metadataJson === right.metadataJson;
}
