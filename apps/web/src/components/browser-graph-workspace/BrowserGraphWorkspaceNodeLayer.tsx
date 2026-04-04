import type React from 'react';
import type { BrowserWorkspaceNodeModel } from '../../browser-graph/workspace';
import type { BrowserProjectionCompartmentKind } from '../../browser-projection';
import { renderCompartmentSubtitle } from './BrowserGraphWorkspace.actions';
import type { BrowserGraphWorkspaceInteractionHandlers, ViewportEventHandlers } from './BrowserGraphWorkspace.types';


function renderCompartmentLabel(kind: BrowserProjectionCompartmentKind) {
  return kind === 'attributes' ? 'Fields' : 'Functions';
}


function BrowserGraphWorkspaceNode({
  node,
  suppressClickRef,
  beginNodeDrag,
  draggingNodeId,
  interactionHandlers,
}: {
  node: BrowserWorkspaceNodeModel;
  suppressClickRef: React.MutableRefObject<boolean>;
  beginNodeDrag: ViewportEventHandlers['beginNodeDrag'];
  draggingNodeId?: string | null;
  interactionHandlers: BrowserGraphWorkspaceInteractionHandlers;
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
        node.classPresentationMode ? 'browser-canvas__node--class' : '',
        node.classPresentationMode ? `browser-canvas__node--class-${node.classPresentationMode}` : '',
        node.classVisibleCompartmentKinds?.includes('attributes') ? 'browser-canvas__node--class-fields' : '',
        node.classVisibleCompartmentKinds?.includes('operations') ? 'browser-canvas__node--class-functions' : '',
        node.isExpandedClassMember ? 'browser-canvas__node--class-member' : '',
        node.selected ? 'browser-canvas__node--selected' : '',
        node.focused ? 'browser-canvas__node--focused' : '',
        node.pinned ? 'browser-canvas__node--pinned' : '',
        draggingNodeId === node.id ? 'browser-canvas__node--dragging' : '',
      ].filter(Boolean).join(' ')}
      style={{ left: node.x, top: node.y, width: node.width, minHeight: node.height }}
      data-class-presentation-mode={node.classPresentationMode}
      data-class-compartments={node.classVisibleCompartmentKinds?.join(',') ?? ''}
      data-class-member-parent-id={node.parentClassEntityId}
      data-class-member-kind={node.memberKind}
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
            interactionHandlers.onActivateScopeNode(node.id);
            return;
          }
          interactionHandlers.onActivateEntityNode(node.id, event.shiftKey || event.metaKey || event.ctrlKey);
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
              <div className="browser-canvas__uml-compartment-label">{renderCompartmentLabel(compartment.kind)}</div>
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
                        interactionHandlers.onActivateEntityNode(item.entityId, event.shiftKey || event.metaKey || event.ctrlKey);
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
  interactionHandlers,
}: {
  nodes: BrowserWorkspaceNodeModel[];
  suppressClickRef: React.MutableRefObject<boolean>;
  beginNodeDrag: ViewportEventHandlers['beginNodeDrag'];
  draggingNodeId?: string | null;
  interactionHandlers: BrowserGraphWorkspaceInteractionHandlers;
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
          interactionHandlers={interactionHandlers}
        />
      ))}
    </>
  );
}
