import { useContext } from 'react';
import { diagramRoleContext } from '@/context/diagram-role-context/diagram-role-context';

export const useDiagramRole = () => useContext(diagramRoleContext);
