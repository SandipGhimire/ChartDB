import React, { useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { Edge, EdgeProps } from '@xyflow/react';
import {
    getSmoothStepPath,
    Position,
    useReactFlow,
    useStore,
} from '@xyflow/react';
import type { DBRelationship, Cardinality } from '@/lib/domain/db-relationship';
import { RIGHT_HANDLE_ID_PREFIX } from '../table-node/table-node-field';
import { useChartDB } from '@/hooks/use-chartdb';
import { cn } from '@/lib/utils';
import { getCardinalityMarkerId } from '../canvas-utils';
import { useDiff } from '@/context/diff-context/use-diff';
import { useLocalConfig } from '@/hooks/use-local-config';
import { useCanvas } from '@/hooks/use-canvas';
import { EditRelationshipPopover } from './edit-relationship-popover';
import { EllipsisIcon } from 'lucide-react';

export type RelationshipEdgeType = Edge<
    {
        relationship: DBRelationship;
        highlighted?: boolean;
    },
    'relationship-edge'
>;

export const RelationshipEdge: React.FC<EdgeProps<RelationshipEdgeType>> =
    React.memo(
        ({
            id,
            sourceX,
            sourceY,
            targetX,
            targetY,
            source,
            target,
            selected,
            data,
        }) => {
            const { getInternalNode, getEdge, getNodes } = useReactFlow();
            // Obstacle collision-detection below is O(tables) — cheap once,
            // but source/target position deps make this memo re-run on
            // every animation frame while either end is being dragged, so
            // that cost would otherwise run per frame too. Skip it while
            // actively dragging (route with the plain offset instead) and
            // let it settle once the drag stops and `tables` commits.
            const isDraggingEndpoint = useStore(
                (s) =>
                    (s.nodeLookup.get(source)?.dragging ?? false) ||
                    (s.nodeLookup.get(target)?.dragging ?? false)
            );
            const { checkIfRelationshipRemoved, checkIfNewRelationship } =
                useDiff();
            const { showCardinality } = useLocalConfig();

            const {
                tables,
                relationships,
                updateRelationship,
                removeRelationship,
            } = useChartDB();
            const {
                editRelationshipPopover,
                openRelationshipPopover,
                closeRelationshipPopover,
            } = useCanvas();

            const relationship = data?.relationship;

            const isPopoverOpen = useMemo(
                () => editRelationshipPopover?.relationshipId === id,
                [editRelationshipPopover, id]
            );

            const handleEdgeClick = useCallback(
                (e: React.MouseEvent) => {
                    if (e.detail === 2) {
                        // Double click - open popover
                        openRelationshipPopover({
                            relationshipId: id,
                            position: { x: e.clientX, y: e.clientY },
                        });
                    }
                    // Single click just selects the edge, doesn't open popover
                },
                [openRelationshipPopover, id]
            );

            const handleContextMenu = useCallback(
                (e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openRelationshipPopover({
                        relationshipId: id,
                        position: { x: e.clientX, y: e.clientY },
                    });
                },
                [id, openRelationshipPopover]
            );

            const handleIndicatorClick = useCallback(
                (e: React.MouseEvent) => {
                    e.stopPropagation();
                    openRelationshipPopover({
                        relationshipId: id,
                        position: { x: e.clientX, y: e.clientY },
                    });
                },
                [id, openRelationshipPopover]
            );

            const handleSwitchTables = useCallback(async () => {
                if (!relationship) return;

                const sameCardinality =
                    relationship.sourceCardinality ===
                    relationship.targetCardinality;

                if (sameCardinality) {
                    // Equal cardinalities: swap everything (tables, fields, schemas, cardinalities)
                    await updateRelationship(
                        id,
                        {
                            sourceSchema: relationship.targetSchema,
                            targetSchema: relationship.sourceSchema,
                            sourceTableId: relationship.targetTableId,
                            targetTableId: relationship.sourceTableId,
                            sourceFieldId: relationship.targetFieldId,
                            targetFieldId: relationship.sourceFieldId,
                            sourceCardinality: relationship.targetCardinality,
                            targetCardinality: relationship.sourceCardinality,
                        },
                        { updateHistory: true }
                    );
                } else if (relationship.sourceCardinality === 'many') {
                    // many:one → one:many (swap cardinalities so "many" moves to target)
                    await updateRelationship(
                        id,
                        {
                            sourceCardinality: 'one',
                            targetCardinality: 'many',
                        },
                        { updateHistory: true }
                    );
                } else {
                    // one:many → swap tables/fields/schemas (keeps one:many with different tables)
                    await updateRelationship(
                        id,
                        {
                            sourceSchema: relationship.targetSchema,
                            targetSchema: relationship.sourceSchema,
                            sourceTableId: relationship.targetTableId,
                            targetTableId: relationship.sourceTableId,
                            sourceFieldId: relationship.targetFieldId,
                            targetFieldId: relationship.sourceFieldId,
                        },
                        { updateHistory: true }
                    );
                }

                closeRelationshipPopover();
            }, [
                id,
                relationship,
                updateRelationship,
                closeRelationshipPopover,
            ]);

            const handleCardinalityChange = useCallback(
                async (
                    newSourceCardinality: Cardinality,
                    newTargetCardinality: Cardinality
                ) => {
                    if (!relationship) return;

                    // Ensure "many" is always on target side when cardinalities differ
                    // If trying to set many:one (N:1), swap tables and set one:many
                    if (
                        newSourceCardinality === 'many' &&
                        newTargetCardinality === 'one'
                    ) {
                        await updateRelationship(
                            id,
                            {
                                // Swap tables/fields/schemas
                                sourceSchema: relationship.targetSchema,
                                targetSchema: relationship.sourceSchema,
                                sourceTableId: relationship.targetTableId,
                                targetTableId: relationship.sourceTableId,
                                sourceFieldId: relationship.targetFieldId,
                                targetFieldId: relationship.sourceFieldId,
                                // Set one:many (many on target)
                                sourceCardinality: 'one',
                                targetCardinality: 'many',
                            },
                            { updateHistory: true }
                        );
                    } else {
                        await updateRelationship(
                            id,
                            {
                                sourceCardinality: newSourceCardinality,
                                targetCardinality: newTargetCardinality,
                            },
                            { updateHistory: true }
                        );
                    }
                    closeRelationshipPopover();
                },
                [id, relationship, updateRelationship, closeRelationshipPopover]
            );

            const handleDelete = useCallback(() => {
                removeRelationship(id, { updateHistory: true });
                closeRelationshipPopover();
            }, [id, removeRelationship, closeRelationshipPopover]);

            const edgeNumber = useMemo(() => {
                let index = 0;
                for (const rel of relationships) {
                    if (
                        (rel.targetTableId === target &&
                            rel.sourceTableId === source) ||
                        (rel.targetTableId === source &&
                            rel.sourceTableId === target)
                    ) {
                        if (rel.id === id) return index;
                        index++;
                    }
                }
                return -1;
            }, [relationships, id, source, target]);

            const sourceNode = useMemo(
                () => getInternalNode(source),
                [getInternalNode, source]
            );
            const targetNode = useMemo(
                () => getInternalNode(target),
                [getInternalNode, target]
            );
            const edge = useMemo(() => getEdge(id), [getEdge, id]);

            const sourceHandle: 'left' | 'right' = useMemo(
                () =>
                    edge?.sourceHandle?.startsWith?.(RIGHT_HANDLE_ID_PREFIX)
                        ? 'right'
                        : 'left',
                [edge?.sourceHandle]
            );

            const sourceWidth = sourceNode?.measured.width ?? 0;
            const sourceLeftX =
                sourceHandle === 'left'
                    ? sourceX + 3
                    : sourceX - sourceWidth - 10;
            const sourceRightX =
                sourceHandle === 'left' ? sourceX + sourceWidth + 9 : sourceX;

            const targetWidth = targetNode?.measured.width ?? 0;
            const targetLeftX = targetX - 1;
            const targetRightX = targetX + targetWidth + 10;

            const { sourceSide, targetSide } = useMemo(() => {
                const distances = {
                    leftToLeft: Math.abs(sourceLeftX - targetLeftX),
                    leftToRight: Math.abs(sourceLeftX - targetRightX),
                    rightToLeft: Math.abs(sourceRightX - targetLeftX),
                    rightToRight: Math.abs(sourceRightX - targetRightX),
                };

                const minDistance = Math.min(
                    distances.leftToLeft,
                    distances.leftToRight,
                    distances.rightToLeft,
                    distances.rightToRight
                );

                const minDistanceKey = Object.keys(distances).find(
                    (key) =>
                        distances[key as keyof typeof distances] === minDistance
                ) as keyof typeof distances;

                switch (minDistanceKey) {
                    case 'leftToRight':
                        return { sourceSide: 'left', targetSide: 'right' };
                    case 'rightToLeft':
                        return { sourceSide: 'right', targetSide: 'left' };
                    case 'rightToRight':
                        return { sourceSide: 'right', targetSide: 'right' };
                    default:
                        return { sourceSide: 'left', targetSide: 'left' };
                }
            }, [sourceLeftX, sourceRightX, targetLeftX, targetRightX]);

            const edgePath = useMemo(() => {
                // Round values to prevent tiny changes from triggering recalculation
                const roundedSourceX = Math.round(
                    sourceSide === 'left' ? sourceLeftX : sourceRightX
                );
                const roundedTargetX = Math.round(
                    targetSide === 'left' ? targetLeftX : targetRightX
                );
                const roundedSourceY = Math.round(sourceY);
                const roundedTargetY = Math.round(targetY);

                const baseOffset =
                    (edgeNumber + 1 + (showCardinality ? 1.5 : 0)) * 14;

                // Tables are often arranged in a stacked column, and the
                // step-out offset controls how far the trunk of the line
                // sits from source/target before turning — too small and
                // it routes straight through whatever sits between them.
                // Check the actual bounding boxes of every other table and
                // push the trunk out until it clears them (or we give up
                // after a few tries). Heuristic, not true pathfinding —
                // doesn't handle every layout, but clears the common case
                // of a table sitting directly between source and target.
                // `tables` isn't used directly below — its only job is to
                // widen this memo's deps so a move/resize of ANY other
                // table (not just this edge's own source/target) forces a
                // re-check against the fresh obstacle positions pulled from
                // getNodes(). Table drags only commit to `tables` once on
                // release (not per drag frame), so this stays cheap.
                void tables;

                let offset = baseOffset;
                if (!isDraggingEndpoint) {
                    const direction = sourceSide === 'left' ? -1 : 1;
                    const minY = Math.min(roundedSourceY, roundedTargetY);
                    const maxY = Math.max(roundedSourceY, roundedTargetY);
                    const obstacles = getNodes().filter(
                        (node) =>
                            node.type === 'table' &&
                            node.id !== source &&
                            node.id !== target
                    );

                    const clearanceMargin = 6;
                    for (let attempt = 0; attempt < 6; attempt++) {
                        const trunkX = roundedSourceX + direction * offset;
                        const blocked = obstacles.some((node) => {
                            const width =
                                node.measured?.width ?? node.width ?? 0;
                            const height =
                                node.measured?.height ?? node.height ?? 0;
                            const left = node.position.x - clearanceMargin;
                            const right =
                                node.position.x + width + clearanceMargin;
                            const top = node.position.y - clearanceMargin;
                            const bottom =
                                node.position.y + height + clearanceMargin;
                            return (
                                trunkX >= left &&
                                trunkX <= right &&
                                maxY >= top &&
                                minY <= bottom
                            );
                        });
                        if (!blocked) break;
                        offset += 40;
                    }
                }

                const [path] = getSmoothStepPath({
                    sourceX: roundedSourceX,
                    sourceY: roundedSourceY,
                    targetX: roundedTargetX,
                    targetY: roundedTargetY,
                    borderRadius: 14,
                    sourcePosition:
                        sourceSide === 'left' ? Position.Left : Position.Right,
                    targetPosition:
                        targetSide === 'left' ? Position.Left : Position.Right,
                    offset,
                });
                return path;
            }, [
                sourceLeftX,
                sourceRightX,
                targetLeftX,
                targetRightX,
                sourceY,
                targetY,
                sourceSide,
                targetSide,
                edgeNumber,
                showCardinality,
                getNodes,
                source,
                target,
                tables,
                isDraggingEndpoint,
            ]);

            const sourceMarker = useMemo(
                () =>
                    getCardinalityMarkerId({
                        cardinality: relationship?.sourceCardinality ?? 'one',
                        selected: selected ?? false,
                        side: sourceSide as 'left' | 'right',
                    }),
                [relationship?.sourceCardinality, selected, sourceSide]
            );
            const targetMarker = useMemo(
                () =>
                    getCardinalityMarkerId({
                        cardinality: relationship?.targetCardinality ?? 'one',
                        selected: selected ?? false,
                        side: targetSide as 'left' | 'right',
                    }),
                [relationship?.targetCardinality, selected, targetSide]
            );

            const isDiffNewRelationship = useMemo(
                () =>
                    relationship?.id
                        ? checkIfNewRelationship({
                              relationshipId: relationship.id,
                          })
                        : false,
                [checkIfNewRelationship, relationship?.id]
            );

            const isDiffRelationshipRemoved = useMemo(
                () =>
                    relationship?.id
                        ? checkIfRelationshipRemoved({
                              relationshipId: relationship.id,
                          })
                        : false,
                [checkIfRelationshipRemoved, relationship?.id]
            );

            // Calculate the midpoint of the edge for the indicator
            const edgeMidpoint = useMemo(() => {
                const sourceXPos =
                    sourceSide === 'left' ? sourceLeftX : sourceRightX;
                const targetXPos =
                    targetSide === 'left' ? targetLeftX : targetRightX;
                return {
                    x: (sourceXPos + targetXPos) / 2,
                    y: (sourceY + targetY) / 2,
                };
            }, [
                sourceSide,
                targetSide,
                sourceLeftX,
                sourceRightX,
                targetLeftX,
                targetRightX,
                sourceY,
                targetY,
            ]);

            return (
                <>
                    <path
                        id={id}
                        d={edgePath}
                        markerStart={`url(#${sourceMarker})`}
                        markerEnd={`url(#${targetMarker})`}
                        fill="none"
                        className={cn([
                            'react-flow__edge-path',
                            `!stroke-2 ${selected ? '!stroke-pink-600' : '!stroke-slate-400'}`,
                            {
                                '!stroke-green-500 !stroke-[3px]':
                                    isDiffNewRelationship,
                                '!stroke-red-500 !stroke-[3px]':
                                    isDiffRelationshipRemoved,
                            },
                        ])}
                        onClick={handleEdgeClick}
                        onContextMenu={handleContextMenu}
                    />
                    <path
                        d={edgePath}
                        fill="none"
                        strokeOpacity={0}
                        strokeWidth={20}
                        // eslint-disable-next-line tailwindcss/no-custom-classname
                        className="react-flow__edge-interaction"
                        onClick={handleEdgeClick}
                        onContextMenu={handleContextMenu}
                    />
                    {selected && (
                        <foreignObject
                            width={24}
                            height={24}
                            x={edgeMidpoint.x - 12}
                            y={edgeMidpoint.y - 12}
                            className="overflow-visible"
                            style={{ pointerEvents: 'all' }}
                        >
                            <button
                                onClick={handleIndicatorClick}
                                className="relative flex size-6 items-center justify-center rounded-full border-2 border-pink-600 bg-background shadow-lg transition-all hover:scale-110 hover:bg-pink-50"
                                title="Edit relationship"
                                style={{ zIndex: 10 }}
                            >
                                <EllipsisIcon className="size-4 text-pink-600" />
                            </button>
                        </foreignObject>
                    )}
                    {relationship &&
                        isPopoverOpen &&
                        editRelationshipPopover?.position &&
                        createPortal(
                            <EditRelationshipPopover
                                anchorPosition={
                                    editRelationshipPopover.position
                                }
                                relationshipId={id}
                                sourceCardinality={
                                    relationship.sourceCardinality ?? 'one'
                                }
                                targetCardinality={
                                    relationship.targetCardinality ?? 'one'
                                }
                                onCardinalityChange={handleCardinalityChange}
                                onSwitch={handleSwitchTables}
                                onDelete={handleDelete}
                            />,
                            document.body
                        )}
                </>
                // <BaseEdge
                //     id={id}
                //     path={edgePath}
                //     markerStart="url(#cardinality_one)"
                //     markerEnd="url(#cardinality_one)"
                //     className={`!stroke-2 ${selected ? '!stroke-slate-500' : '!stroke-slate-300'}`}
                // />
            );
        }
    );

RelationshipEdge.displayName = 'RelationshipEdge';
