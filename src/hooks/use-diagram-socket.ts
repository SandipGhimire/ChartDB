import { useContext } from 'react';
import { diagramSocketContext } from '@/context/diagram-socket-context/diagram-socket-context';

export const useDiagramSocket = () => useContext(diagramSocketContext);
