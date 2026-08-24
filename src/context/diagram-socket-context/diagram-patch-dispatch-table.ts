import type { ChartDBContext } from '@/context/chartdb-context/chartdb-context';
import type { DiagramPatchAction } from './diagram-socket-context';
import type { DBTable } from '@/lib/domain/db-table';
import type { DBRelationship } from '@/lib/domain/db-relationship';
import type { DBDependency } from '@/lib/domain/db-dependency';
import type { Area } from '@/lib/domain/area';
import type { DBCustomType } from '@/lib/domain/db-custom-type';
import type { Note } from '@/lib/domain/note';
import type { Diagram } from '@/lib/domain/diagram';

// Applied to already-committed remote changes -- never re-persist or
// re-enter this client's own undo stack.
const REMOTE_OPTIONS = { updateHistory: false, skipPersist: true };

type PatchHandler = (
    chartDB: ChartDBContext,
    action: DiagramPatchAction,
    id: string,
    payload: unknown
) => void;

export const diagramPatchDispatchTable: Record<string, PatchHandler> = {
    table: (chartDB, action, id, payload) => {
        if (action === 'add') {
            chartDB.addTable(payload as DBTable, REMOTE_OPTIONS);
        } else if (action === 'update') {
            chartDB.updateTable(
                id,
                payload as Partial<DBTable>,
                REMOTE_OPTIONS
            );
        } else {
            chartDB.removeTable(id, REMOTE_OPTIONS);
        }
    },
    relationship: (chartDB, action, id, payload) => {
        if (action === 'add') {
            chartDB.addRelationship(payload as DBRelationship, REMOTE_OPTIONS);
        } else if (action === 'update') {
            chartDB.updateRelationship(
                id,
                payload as Partial<DBRelationship>,
                REMOTE_OPTIONS
            );
        } else {
            chartDB.removeRelationship(id, REMOTE_OPTIONS);
        }
    },
    dependency: (chartDB, action, id, payload) => {
        if (action === 'add') {
            chartDB.addDependency(payload as DBDependency, REMOTE_OPTIONS);
        } else if (action === 'update') {
            chartDB.updateDependency(
                id,
                payload as Partial<DBDependency>,
                REMOTE_OPTIONS
            );
        } else {
            chartDB.removeDependency(id, REMOTE_OPTIONS);
        }
    },
    area: (chartDB, action, id, payload) => {
        if (action === 'add') {
            chartDB.addArea(payload as Area, REMOTE_OPTIONS);
        } else if (action === 'update') {
            chartDB.updateArea(id, payload as Partial<Area>, REMOTE_OPTIONS);
        } else {
            chartDB.removeArea(id, REMOTE_OPTIONS);
        }
    },
    customType: (chartDB, action, id, payload) => {
        if (action === 'add') {
            chartDB.addCustomType(payload as DBCustomType, REMOTE_OPTIONS);
        } else if (action === 'update') {
            chartDB.updateCustomType(
                id,
                payload as Partial<DBCustomType>,
                REMOTE_OPTIONS
            );
        } else {
            chartDB.removeCustomType(id, REMOTE_OPTIONS);
        }
    },
    note: (chartDB, action, id, payload) => {
        if (action === 'add') {
            chartDB.addNote(payload as Note, REMOTE_OPTIONS);
        } else if (action === 'update') {
            chartDB.updateNote(id, payload as Partial<Note>, REMOTE_OPTIONS);
        } else {
            chartDB.removeNote(id, REMOTE_OPTIONS);
        }
    },
    // Diagram-level patches are only sent for name changes today (see
    // api-storage-provider's updateDiagram) -- database type/edition rarely
    // change mid-session and updateDatabaseType/updateDatabaseEdition don't
    // support skipPersist, so they're not wired for realtime sync.
    diagram: (chartDB, action, _id, payload) => {
        if (action !== 'update') return;
        const attributes = payload as Partial<Diagram>;
        if (typeof attributes.name === 'string') {
            chartDB.updateDiagramName(attributes.name, REMOTE_OPTIONS);
        }
    },
};
