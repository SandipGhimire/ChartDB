import React, { useState } from 'react';
import type { DiagramRole } from './diagram-role-context';
import { diagramRoleContext } from './diagram-role-context';

export const DiagramRoleProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const [diagramRole, setDiagramRole] = useState<DiagramRole | undefined>();

    return (
        <diagramRoleContext.Provider value={{ diagramRole, setDiagramRole }}>
            {children}
        </diagramRoleContext.Provider>
    );
};
