import type React from 'react';
import type { BrowserWorkspaceNodeModel } from '../../browser-graph/workspace';
import { renderCompartmentSubtitle } from './BrowserGraphWorkspace.actions';
import type { ViewportEventHandlers } from './BrowserGraphWorkspace.types';

function BrowserGraphWorkspaceNode({
  node,
  suppressClickRef,
  beginNodeDrag,
  draggingNodeId,
  onFocusScope,
  onFocusEntity,
  onSelectEntity,
}: {
  node: BrowserWorkspaceNodeModel;
  suppressClickRef: React.MutableRefObject<boolean>;
  beginNodeDrag: ViewportEventHandlers['beginNodeDrag'];
  draggingNodeId?: string | null;
  onFocusScope: (scopeId: string) => void;
  onFocusEntity: (entityId: string) => void;
  onSelectEntity: (entityId: string, additive?: boolean) => void;
}) {
  return (
    <article
      key={`${node.kind}:${node.id}`}
      data-browser-node-id={node.id}
      data-browser-node-kind={node.kind}
      data-layout-x={node.x}
      data-layout-y={node.y}
      data-layout-width={node.width}
      data-layout-height={node.height}
      className={[
        'browser-canvas__node',
        `browser-canvas__node--${node.kind}`,
        node.selected ? 'browser-canvas__node--selected' : '',
        node.focused ? 'browser-canvas__node--focused' : '',
        node.pinned ? 'browser-canvas__node--pinned' : '',
        draggingNodeId === node.id ? 'browser-canvas__node--dragging' : '',
      ].filter(Boolean).join(' ')}
      style={{ left: node.x, top: node.y, width: node.width, minHeight: node.height }}
      onMouseDown={(event) => beginNodeDrag(event, node)}
    >
      <button
        type="button"
        className="browser-canvas__node-main"
        onClick={(event) => {
          if (suppressClickRef.current) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          if (node.kind === 'scope') {
            onFocusScope(node.id);
            return;
          }
          onSelectEntity(node.id, event.shiftKey || event.metaKey || event.ctrlKey);
          onFocusEntity(node.id);
        }}
      >
        <span className="badge">{node.badgeLabel}</span>
        <strong>{node.title}</strong>
        {node.kind !== 'uml-class' && node.subtitle ? <span className="browser-canvas__node-subtitle muted">{node.subtitle}</span> : null}
      </button>

      {node.kind === 'uml-class' && node.compartments.length > 0 ? (
        <div className="browser-canvas__uml" aria-label={`${node.title} class details`}>
          {node.compartments.map((compartment) => (
            <section key={`${node.id}:${compartment.kind}`} className="browser-canvas__uml-compartment" aria-label={compartment.kind}>
              <div className="browser-canvas__uml-compartment-label">{compartment.kind}</div>
              <ul className="browser-canvas__uml-members">
                {compartment.items.map((item) => (
                  <li key={item.entityId} className="browser-canvas__uml-member">
                    <button
                      type="button"
                      className={[
                        'browser-canvas__uml-member-button',
                        item.selected ? 'browser-canvas__uml-member-button--selected' : '',
                        item.focused ? 'browser-canvas__uml-member-button--focused' : '',
                      ].filter(Boolean).join(' ')}
                      onMouseDown={(event) => {
                        event.stopPropagation();
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectEntity(item.entityId, event.shiftKey || event.metaKey || event.ctrlKey);
                        onFocusEntity(item.entityId);
                      }}
                    >
                      <span className="browser-canvas__uml-member-title">{item.title}</span>
                      <span className="browser-canvas__uml-member-kind">{renderCompartmentSubtitle(item.kind)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function BrowserGraphWorkspaceNodeLayer({
  nodes,
  suppressClickRef,
  beginNodeDrag,
  draggingNodeId,
  onFocusScope,
  onFocusEntity,
  onSelectEntity,
}: {
  nodes: BrowserWorkspaceNodeModel[];
  suppressClickRef: React.MutableRefObject<boolean>;
  beginNodeDrag: ViewportEventHandlers['beginNodeDrag'];
  draggingNodeId?: string | null;
  onFocusScope: (scopeId: string) => void;
  onFocusEntity: (entityId: string) => void;
  onSelectEntity: (entityId: string, additive?: boolean) => void;
}) {
  return (
    <>
      {nodes.map((node) => (
        <BrowserGraphWorkspaceNode
          key={`${node.kind}:${node.id}`}
          node={node}
          suppressClickRef={suppressClickRef}
          beginNodeDrag={beginNodeDrag}
          draggingNodeId={draggingNodeId}
          onFocusScope={onFocusScope}
          onFocusEntity={onFocusEntity}
          onSelectEntity={onSelectEntity}
        />
      ))}
    </>
  );
}
