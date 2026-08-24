import React, { useCallback } from 'react';
import type { StorageContext } from './storage-context';
import { storageContext } from './storage-context';
import type { Diagram } from '@/lib/domain/diagram';
import type { DatabaseType } from '@/lib/domain/database-type';
import type { DatabaseEdition } from '@/lib/domain/database-edition';
import type { DBTable } from '@/lib/domain/db-table';
import type { DBRelationship } from '@/lib/domain/db-relationship';
import type { ChartDBConfig } from '@/lib/domain/config';
import type { DBDependency } from '@/lib/domain/db-dependency';
import type { Area } from '@/lib/domain/area';
import type { DBCustomType } from '@/lib/domain/db-custom-type';
import type { DiagramFilter } from '@/lib/domain/diagram-filter/diagram-filter';
import type { Note } from '@/lib/domain/note';

interface ApiFetchOptions extends RequestInit {
    // Some StorageContext getters return `undefined` for a missing record
    // rather than throwing (e.g. `db.diagrams.get(id)`); a 404 from the API
    // (not-found, or not-a-member — the server doesn't distinguish, on
    // purpose) maps to that same `undefined` when this is set.
    treatNotFoundAsUndefined?: boolean;
}

async function apiFetch<T>(
    path: string,
    options: ApiFetchOptions = {}
): Promise<T> {
    const { treatNotFoundAsUndefined, ...init } = options;
    const res = await fetch(`/api${path}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        ...init,
    });

    if (res.status === 404 && treatNotFoundAsUndefined) {
        return undefined as T;
    }

    if (res.status === 204) {
        return undefined as T;
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(
            typeof data?.error === 'string'
                ? data.error
                : `Request failed (${res.status})`
        );
    }

    return data as T;
}

const rehydrateDiagram = (raw: Diagram): Diagram => ({
    ...raw,
    databaseType: raw.databaseType as DatabaseType,
    databaseEdition: (raw.databaseEdition ?? undefined) as
        | DatabaseEdition
        | undefined,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
});

const buildIncludeQuery = (options?: {
    includeTables?: boolean;
    includeRelationships?: boolean;
    includeDependencies?: boolean;
    includeAreas?: boolean;
    includeCustomTypes?: boolean;
    includeNotes?: boolean;
}): string => {
    if (!options) return '';
    const parts: string[] = [];
    if (options.includeTables) parts.push('tables');
    if (options.includeRelationships) parts.push('relationships');
    if (options.includeDependencies) parts.push('dependencies');
    if (options.includeAreas) parts.push('areas');
    if (options.includeCustomTypes) parts.push('customTypes');
    if (options.includeNotes) parts.push('notes');
    return parts.length > 0 ? `?include=${parts.join(',')}` : '';
};

export const ApiStorageProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    // Config operations
    const getConfig: StorageContext['getConfig'] = useCallback(async () => {
        const { config } = await apiFetch<{ config: ChartDBConfig }>('/config');
        return config;
    }, []);

    const updateConfig: StorageContext['updateConfig'] = useCallback(
        async (config) => {
            await apiFetch('/config', {
                method: 'PATCH',
                body: JSON.stringify(config),
            });
        },
        []
    );

    // Diagram filter operations
    const getDiagramFilter: StorageContext['getDiagramFilter'] = useCallback(
        async (diagramId) => {
            const { filter } = await apiFetch<{
                filter: (DiagramFilter & { diagramId?: string }) | null;
            }>(`/diagrams/${diagramId}/filter`);
            if (!filter) return undefined;
            // The API row carries `diagramId` and stores unset JSON columns
            // as `null`; the domain type only knows optional arrays.
            return {
                schemaIds: filter.schemaIds ?? undefined,
                tableIds: filter.tableIds ?? undefined,
            };
        },
        []
    );

    const updateDiagramFilter: StorageContext['updateDiagramFilter'] =
        useCallback(async (diagramId, filter) => {
            await apiFetch(`/diagrams/${diagramId}/filter`, {
                method: 'PUT',
                body: JSON.stringify(filter),
            });
        }, []);

    const deleteDiagramFilter: StorageContext['deleteDiagramFilter'] =
        useCallback(async (diagramId) => {
            await apiFetch(`/diagrams/${diagramId}/filter`, {
                method: 'DELETE',
            });
        }, []);

    // Table operations
    const addTable: StorageContext['addTable'] = useCallback(
        async ({ diagramId, table }) => {
            await apiFetch(`/diagrams/${diagramId}/tables`, {
                method: 'POST',
                body: JSON.stringify(table),
            });
        },
        []
    );

    const getTable: StorageContext['getTable'] = useCallback(
        async ({ diagramId, id }) => {
            const { item } = await apiFetch<{ item: DBTable }>(
                `/diagrams/${diagramId}/tables/${id}`,
                { treatNotFoundAsUndefined: true }
            );
            return item;
        },
        []
    );

    const updateTable: StorageContext['updateTable'] = useCallback(
        async ({ id, attributes }) => {
            await apiFetch(`/tables/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(attributes),
            });
        },
        []
    );

    const putTable: StorageContext['putTable'] = useCallback(
        async ({ diagramId, table }) => {
            await apiFetch(`/diagrams/${diagramId}/tables/${table.id}`, {
                method: 'PUT',
                body: JSON.stringify(table),
            });
        },
        []
    );

    const deleteTable: StorageContext['deleteTable'] = useCallback(
        async ({ diagramId, id }) => {
            await apiFetch(`/diagrams/${diagramId}/tables/${id}`, {
                method: 'DELETE',
            });
        },
        []
    );

    const listTables: StorageContext['listTables'] = useCallback(
        async (diagramId) => {
            const { items } = await apiFetch<{ items: DBTable[] }>(
                `/diagrams/${diagramId}/tables`
            );
            return items;
        },
        []
    );

    const deleteDiagramTables: StorageContext['deleteDiagramTables'] =
        useCallback(async (diagramId) => {
            await apiFetch(`/diagrams/${diagramId}/tables`, {
                method: 'DELETE',
            });
        }, []);

    // Relationships operations
    const addRelationship: StorageContext['addRelationship'] = useCallback(
        async ({ diagramId, relationship }) => {
            await apiFetch(`/diagrams/${diagramId}/relationships`, {
                method: 'POST',
                body: JSON.stringify(relationship),
            });
        },
        []
    );

    const getRelationship: StorageContext['getRelationship'] = useCallback(
        async ({ diagramId, id }) => {
            const { item } = await apiFetch<{ item: DBRelationship }>(
                `/diagrams/${diagramId}/relationships/${id}`,
                { treatNotFoundAsUndefined: true }
            );
            return item;
        },
        []
    );

    const updateRelationship: StorageContext['updateRelationship'] =
        useCallback(async ({ id, attributes }) => {
            await apiFetch(`/relationships/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(attributes),
            });
        }, []);

    const deleteRelationship: StorageContext['deleteRelationship'] =
        useCallback(async ({ diagramId, id }) => {
            await apiFetch(`/diagrams/${diagramId}/relationships/${id}`, {
                method: 'DELETE',
            });
        }, []);

    const listRelationships: StorageContext['listRelationships'] = useCallback(
        async (diagramId) => {
            const { items } = await apiFetch<{ items: DBRelationship[] }>(
                `/diagrams/${diagramId}/relationships`
            );
            return items;
        },
        []
    );

    const deleteDiagramRelationships: StorageContext['deleteDiagramRelationships'] =
        useCallback(async (diagramId) => {
            await apiFetch(`/diagrams/${diagramId}/relationships`, {
                method: 'DELETE',
            });
        }, []);

    // Dependencies operations
    const addDependency: StorageContext['addDependency'] = useCallback(
        async ({ diagramId, dependency }) => {
            await apiFetch(`/diagrams/${diagramId}/dependencies`, {
                method: 'POST',
                body: JSON.stringify(dependency),
            });
        },
        []
    );

    const getDependency: StorageContext['getDependency'] = useCallback(
        async ({ diagramId, id }) => {
            const { item } = await apiFetch<{ item: DBDependency }>(
                `/diagrams/${diagramId}/dependencies/${id}`,
                { treatNotFoundAsUndefined: true }
            );
            return item;
        },
        []
    );

    const updateDependency: StorageContext['updateDependency'] = useCallback(
        async ({ id, attributes }) => {
            await apiFetch(`/dependencies/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(attributes),
            });
        },
        []
    );

    const deleteDependency: StorageContext['deleteDependency'] = useCallback(
        async ({ diagramId, id }) => {
            await apiFetch(`/diagrams/${diagramId}/dependencies/${id}`, {
                method: 'DELETE',
            });
        },
        []
    );

    const listDependencies: StorageContext['listDependencies'] = useCallback(
        async (diagramId) => {
            const { items } = await apiFetch<{ items: DBDependency[] }>(
                `/diagrams/${diagramId}/dependencies`
            );
            return items;
        },
        []
    );

    const deleteDiagramDependencies: StorageContext['deleteDiagramDependencies'] =
        useCallback(async (diagramId) => {
            await apiFetch(`/diagrams/${diagramId}/dependencies`, {
                method: 'DELETE',
            });
        }, []);

    // Area operations
    const addArea: StorageContext['addArea'] = useCallback(
        async ({ diagramId, area }) => {
            await apiFetch(`/diagrams/${diagramId}/areas`, {
                method: 'POST',
                body: JSON.stringify(area),
            });
        },
        []
    );

    const getArea: StorageContext['getArea'] = useCallback(
        async ({ diagramId, id }) => {
            const { item } = await apiFetch<{ item: Area }>(
                `/diagrams/${diagramId}/areas/${id}`,
                { treatNotFoundAsUndefined: true }
            );
            return item;
        },
        []
    );

    const updateArea: StorageContext['updateArea'] = useCallback(
        async ({ id, attributes }) => {
            await apiFetch(`/areas/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(attributes),
            });
        },
        []
    );

    const deleteArea: StorageContext['deleteArea'] = useCallback(
        async ({ diagramId, id }) => {
            await apiFetch(`/diagrams/${diagramId}/areas/${id}`, {
                method: 'DELETE',
            });
        },
        []
    );

    const listAreas: StorageContext['listAreas'] = useCallback(
        async (diagramId) => {
            const { items } = await apiFetch<{ items: Area[] }>(
                `/diagrams/${diagramId}/areas`
            );
            return items;
        },
        []
    );

    const deleteDiagramAreas: StorageContext['deleteDiagramAreas'] =
        useCallback(async (diagramId) => {
            await apiFetch(`/diagrams/${diagramId}/areas`, {
                method: 'DELETE',
            });
        }, []);

    // Custom type operations
    const addCustomType: StorageContext['addCustomType'] = useCallback(
        async ({ diagramId, customType }) => {
            await apiFetch(`/diagrams/${diagramId}/custom-types`, {
                method: 'POST',
                body: JSON.stringify(customType),
            });
        },
        []
    );

    const getCustomType: StorageContext['getCustomType'] = useCallback(
        async ({ diagramId, id }) => {
            const { item } = await apiFetch<{ item: DBCustomType }>(
                `/diagrams/${diagramId}/custom-types/${id}`,
                { treatNotFoundAsUndefined: true }
            );
            return item;
        },
        []
    );

    const updateCustomType: StorageContext['updateCustomType'] = useCallback(
        async ({ id, attributes }) => {
            await apiFetch(`/custom-types/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(attributes),
            });
        },
        []
    );

    const deleteCustomType: StorageContext['deleteCustomType'] = useCallback(
        async ({ diagramId, id }) => {
            await apiFetch(`/diagrams/${diagramId}/custom-types/${id}`, {
                method: 'DELETE',
            });
        },
        []
    );

    const listCustomTypes: StorageContext['listCustomTypes'] = useCallback(
        async (diagramId) => {
            const { items } = await apiFetch<{ items: DBCustomType[] }>(
                `/diagrams/${diagramId}/custom-types`
            );
            return items;
        },
        []
    );

    const deleteDiagramCustomTypes: StorageContext['deleteDiagramCustomTypes'] =
        useCallback(async (diagramId) => {
            await apiFetch(`/diagrams/${diagramId}/custom-types`, {
                method: 'DELETE',
            });
        }, []);

    // Note operations
    const addNote: StorageContext['addNote'] = useCallback(
        async ({ diagramId, note }) => {
            await apiFetch(`/diagrams/${diagramId}/notes`, {
                method: 'POST',
                body: JSON.stringify(note),
            });
        },
        []
    );

    const getNote: StorageContext['getNote'] = useCallback(
        async ({ diagramId, id }) => {
            const { item } = await apiFetch<{ item: Note }>(
                `/diagrams/${diagramId}/notes/${id}`,
                { treatNotFoundAsUndefined: true }
            );
            return item;
        },
        []
    );

    const updateNote: StorageContext['updateNote'] = useCallback(
        async ({ id, attributes }) => {
            await apiFetch(`/notes/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(attributes),
            });
        },
        []
    );

    const deleteNote: StorageContext['deleteNote'] = useCallback(
        async ({ diagramId, id }) => {
            await apiFetch(`/diagrams/${diagramId}/notes/${id}`, {
                method: 'DELETE',
            });
        },
        []
    );

    const listNotes: StorageContext['listNotes'] = useCallback(
        async (diagramId) => {
            const { items } = await apiFetch<{ items: Note[] }>(
                `/diagrams/${diagramId}/notes`
            );
            return items;
        },
        []
    );

    const deleteDiagramNotes: StorageContext['deleteDiagramNotes'] =
        useCallback(async (diagramId) => {
            await apiFetch(`/diagrams/${diagramId}/notes`, {
                method: 'DELETE',
            });
        }, []);

    // Diagram operations
    const addDiagram: StorageContext['addDiagram'] = useCallback(
        async ({ diagram }) => {
            await apiFetch('/diagrams', {
                method: 'POST',
                body: JSON.stringify({
                    id: diagram.id,
                    name: diagram.name,
                    databaseType: diagram.databaseType,
                    databaseEdition: diagram.databaseEdition,
                }),
            });

            const promises: Promise<unknown>[] = [];

            const tables = diagram.tables ?? [];
            promises.push(
                ...tables.map((table) =>
                    addTable({ diagramId: diagram.id, table })
                )
            );

            const relationships = diagram.relationships ?? [];
            promises.push(
                ...relationships.map((relationship) =>
                    addRelationship({ diagramId: diagram.id, relationship })
                )
            );

            const dependencies = diagram.dependencies ?? [];
            promises.push(
                ...dependencies.map((dependency) =>
                    addDependency({ diagramId: diagram.id, dependency })
                )
            );

            const areas = diagram.areas ?? [];
            promises.push(
                ...areas.map((area) => addArea({ diagramId: diagram.id, area }))
            );

            const customTypes = diagram.customTypes ?? [];
            promises.push(
                ...customTypes.map((customType) =>
                    addCustomType({ diagramId: diagram.id, customType })
                )
            );

            const notes = diagram.notes ?? [];
            promises.push(
                ...notes.map((note) => addNote({ diagramId: diagram.id, note }))
            );

            await Promise.all(promises);
        },
        [
            addArea,
            addCustomType,
            addDependency,
            addRelationship,
            addTable,
            addNote,
        ]
    );

    const listDiagrams: StorageContext['listDiagrams'] = useCallback(
        async (options) => {
            const { diagrams } = await apiFetch<{ diagrams: Diagram[] }>(
                `/diagrams${buildIncludeQuery(options)}`
            );
            return diagrams.map(rehydrateDiagram);
        },
        []
    );

    const getDiagram: StorageContext['getDiagram'] = useCallback(
        async (id, options) => {
            const { diagram } = await apiFetch<{ diagram: Diagram | null }>(
                `/diagrams/${id}${buildIncludeQuery(options)}`,
                { treatNotFoundAsUndefined: true }
            );
            return diagram ? rehydrateDiagram(diagram) : undefined;
        },
        []
    );

    const updateDiagram: StorageContext['updateDiagram'] = useCallback(
        async ({ id, attributes }) => {
            const keys = Object.keys(attributes);
            // The server derives `updatedAt` itself on every child mutation
            // (see touchDiagram); a client write that's *only* bumping
            // updatedAt is a pure round trip with nothing new to persist.
            if (
                keys.length === 0 ||
                (keys.length === 1 && keys[0] === 'updatedAt')
            ) {
                return;
            }
            await apiFetch(`/diagrams/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(attributes),
            });
        },
        []
    );

    const deleteDiagram: StorageContext['deleteDiagram'] = useCallback(
        async (id) => {
            await apiFetch(`/diagrams/${id}`, { method: 'DELETE' });
        },
        []
    );

    return (
        <storageContext.Provider
            value={{
                getConfig,
                updateConfig,
                addDiagram,
                listDiagrams,
                getDiagram,
                updateDiagram,
                deleteDiagram,
                addTable,
                getTable,
                updateTable,
                putTable,
                deleteTable,
                listTables,
                addRelationship,
                getRelationship,
                updateRelationship,
                deleteRelationship,
                listRelationships,
                deleteDiagramTables,
                deleteDiagramRelationships,
                addDependency,
                getDependency,
                updateDependency,
                deleteDependency,
                listDependencies,
                deleteDiagramDependencies,
                addArea,
                getArea,
                updateArea,
                deleteArea,
                listAreas,
                deleteDiagramAreas,
                addCustomType,
                getCustomType,
                updateCustomType,
                deleteCustomType,
                listCustomTypes,
                deleteDiagramCustomTypes,
                addNote,
                getNote,
                updateNote,
                deleteNote,
                listNotes,
                deleteDiagramNotes,
                getDiagramFilter,
                updateDiagramFilter,
                deleteDiagramFilter,
            }}
        >
            {children}
        </storageContext.Provider>
    );
};
