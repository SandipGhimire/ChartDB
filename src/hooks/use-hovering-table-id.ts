import { useContext } from 'react';
import { hoveringTableIdContext } from '@/context/canvas-context/canvas-context';

export const useHoveringTableId = () => useContext(hoveringTableIdContext);
