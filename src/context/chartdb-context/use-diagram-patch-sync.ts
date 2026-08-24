import { useEffect, useRef } from 'react';
import { useChartDB } from '@/hooks/use-chartdb';
import { useDiagramSocket } from '@/hooks/use-diagram-socket';
import { diagramPatchDispatchTable } from '@/context/diagram-socket-context/diagram-patch-dispatch-table';

// Applies remote edits (from other users editing the same diagram) to local
// state as they arrive. Kept outside the dispatch-table effect's deps via a
// ref so it doesn't resubscribe on every state change -- ChartDB context
// changes on nearly every keystroke.
export const useDiagramPatchSync = () => {
    const chartDB = useChartDB();
    const chartDBRef = useRef(chartDB);
    chartDBRef.current = chartDB;

    const { subscribePatch } = useDiagramSocket();

    useEffect(() => {
        return subscribePatch((message) => {
            const handler = diagramPatchDispatchTable[message.resource];
            handler?.(
                chartDBRef.current,
                message.action,
                message.id,
                message.payload
            );
        });
    }, [subscribePatch]);
};
