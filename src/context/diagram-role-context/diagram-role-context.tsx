import { createContext } from 'react';
import { emptyFn } from '@/lib/utils';

export type DiagramRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface DiagramRoleContext {
    diagramRole?: DiagramRole;
    setDiagramRole: (role: DiagramRole | undefined) => void;
}

export const diagramRoleContext = createContext<DiagramRoleContext>({
    diagramRole: undefined,
    setDiagramRole: emptyFn,
});
