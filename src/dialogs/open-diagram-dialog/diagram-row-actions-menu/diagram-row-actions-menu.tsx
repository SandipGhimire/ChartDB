import React, { useCallback, useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/dropdown-menu/dropdown-menu';
import { Button } from '@/components/button/button';
import {
    Ellipsis,
    Layers2,
    Share2,
    SquareArrowOutUpRight,
    Trash2,
} from 'lucide-react';
import { useChartDB } from '@/hooks/use-chartdb';
import type { Diagram } from '@/lib/domain';
import { useStorage } from '@/hooks/use-storage';
import { cloneDiagram } from '@/lib/clone';
import { useTranslation } from 'react-i18next';
import { ShareDiagramDialog } from '@/dialogs/share-diagram-dialog/share-diagram-dialog';

interface DiagramRowActionsMenuProps {
    diagram: Diagram;
    onOpen: () => void;
    refetch: () => void;
    numberOfDiagrams: number;
}

export const DiagramRowActionsMenu: React.FC<DiagramRowActionsMenuProps> = ({
    diagram,
    onOpen,
    refetch,
    numberOfDiagrams,
}) => {
    const { diagramId } = useChartDB();
    const { deleteDiagram, addDiagram } = useStorage();
    const { t } = useTranslation();
    const [shareOpen, setShareOpen] = useState(false);

    // In API mode, listDiagrams() embeds the caller's role on each diagram
    // (not part of the Diagram domain type, so read it loosely). Absent in
    // local/Dexie mode, where there's no ownership concept — everyone can
    // delete, and sharing doesn't apply, matching today's behavior.
    const currentUserRole = (diagram as Diagram & { currentUserRole?: string })
        .currentUserRole;
    const canDelete = !currentUserRole || currentUserRole === 'OWNER';
    const canShare = currentUserRole === 'OWNER';

    const onDelete = useCallback(async () => {
        deleteDiagram(diagram.id);
        refetch();

        if (diagram.id === diagramId || numberOfDiagrams <= 1) {
            window.location.href = '/';
        }
    }, [deleteDiagram, diagram.id, diagramId, refetch, numberOfDiagrams]);

    const onDuplicate = useCallback(async () => {
        const duplicatedDiagram = cloneDiagram(diagram);

        const diagramToAdd = duplicatedDiagram.diagram;

        if (!diagramToAdd) {
            return;
        }

        diagramToAdd.name = `${diagram.name} (Copy)`;

        addDiagram({ diagram: diagramToAdd });
        refetch();
    }, [addDiagram, refetch, diagram]);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Ellipsis className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem
                        onClick={onOpen}
                        className="flex justify-between gap-4"
                    >
                        {t('open_diagram_dialog.diagram_actions.open')}
                        <SquareArrowOutUpRight className="size-3.5" />
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={onDuplicate}
                        className="flex justify-between gap-4"
                    >
                        {t('open_diagram_dialog.diagram_actions.duplicate')}
                        <Layers2 className="size-3.5" />
                    </DropdownMenuItem>

                    {canShare ? (
                        <DropdownMenuItem
                            onClick={() => setShareOpen(true)}
                            className="flex justify-between gap-4"
                        >
                            Share
                            <Share2 className="size-3.5" />
                        </DropdownMenuItem>
                    ) : null}

                    {canDelete ? (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={onDelete}
                                className="flex justify-between gap-4 text-red-700"
                            >
                                {t(
                                    'open_diagram_dialog.diagram_actions.delete'
                                )}
                                <Trash2 className="size-3.5 text-red-700" />
                            </DropdownMenuItem>
                        </>
                    ) : null}
                </DropdownMenuContent>
            </DropdownMenu>
            {canShare ? (
                <ShareDiagramDialog
                    diagramId={shareOpen ? diagram.id : undefined}
                    onOpenChange={(open) => !open && setShareOpen(false)}
                />
            ) : null}
        </>
    );
};
