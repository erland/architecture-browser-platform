import { BrowserGraphWorkspace, type BrowserGraphWorkspaceProps } from '../../components/browser-graph-workspace/BrowserGraphWorkspace';
import { BrowserSourceTreeLauncher } from '../../components/browser-source-tree/BrowserSourceTreeLauncher';
import type { SourceTreeLauncherItem } from '../../app-model/appModel.sourceTree';

export type BrowserViewCenterContentProps = {
  launcher: {
    title: string;
    description: string;
    items: SourceTreeLauncherItem[];
    onSelectSourceTree: (item: SourceTreeLauncherItem) => void;
    onOpenSourceTreeDialog: () => void;
  };
  graphWorkspace: BrowserGraphWorkspaceProps | null;
};

export function BrowserViewCenterContent({ launcher, graphWorkspace }: BrowserViewCenterContentProps) {
  if (!graphWorkspace) {
    return (
      <BrowserSourceTreeLauncher
        title={launcher.title}
        description={launcher.description}
        items={launcher.items}
        onSelectSourceTree={launcher.onSelectSourceTree}
        onOpenSourceTreeDialog={launcher.onOpenSourceTreeDialog}
      />
    );
  }

  return (
    <div className="browser-workspace__stage">
      <BrowserGraphWorkspace {...graphWorkspace} />
    </div>
  );
}
