import {
    createChildResourceRouter,
    createFlatUpdateRouter,
} from './diagram-child-resource.js';
import {
    dbTableCreateSchema,
    dbTableUpdateSchema,
    dbRelationshipCreateSchema,
    dbRelationshipUpdateSchema,
    dbDependencyCreateSchema,
    dbDependencyUpdateSchema,
    areaCreateSchema,
    areaUpdateSchema,
    dbCustomTypeCreateSchema,
    dbCustomTypeUpdateSchema,
    noteCreateSchema,
    noteUpdateSchema,
} from '../lib/schemas.js';

export const tablesRouter = createChildResourceRouter({
    modelName: 'dbTable',
    createSchema: dbTableCreateSchema,
    updateSchema: dbTableUpdateSchema,
    hasBigIntCreatedAt: true,
    supportsUpsert: true,
});

export const relationshipsRouter = createChildResourceRouter({
    modelName: 'dbRelationship',
    createSchema: dbRelationshipCreateSchema,
    updateSchema: dbRelationshipUpdateSchema,
    hasBigIntCreatedAt: true,
});

export const dependenciesRouter = createChildResourceRouter({
    modelName: 'dbDependency',
    createSchema: dbDependencyCreateSchema,
    updateSchema: dbDependencyUpdateSchema,
    hasBigIntCreatedAt: true,
});

export const areasRouter = createChildResourceRouter({
    modelName: 'area',
    createSchema: areaCreateSchema,
    updateSchema: areaUpdateSchema,
});

export const customTypesRouter = createChildResourceRouter({
    modelName: 'dbCustomType',
    createSchema: dbCustomTypeCreateSchema,
    updateSchema: dbCustomTypeUpdateSchema,
});

export const notesRouter = createChildResourceRouter({
    modelName: 'note',
    createSchema: noteCreateSchema,
    updateSchema: noteUpdateSchema,
});

// Flat /api/<resource>/:id routers backing StorageContext's update*()
// methods, which don't carry a diagramId — see createFlatUpdateRouter.
export const tablesFlatUpdateRouter = createFlatUpdateRouter({
    modelName: 'dbTable',
    updateSchema: dbTableUpdateSchema,
    hasBigIntCreatedAt: true,
});

export const relationshipsFlatUpdateRouter = createFlatUpdateRouter({
    modelName: 'dbRelationship',
    updateSchema: dbRelationshipUpdateSchema,
    hasBigIntCreatedAt: true,
});

export const dependenciesFlatUpdateRouter = createFlatUpdateRouter({
    modelName: 'dbDependency',
    updateSchema: dbDependencyUpdateSchema,
    hasBigIntCreatedAt: true,
});

export const areasFlatUpdateRouter = createFlatUpdateRouter({
    modelName: 'area',
    updateSchema: areaUpdateSchema,
});

export const customTypesFlatUpdateRouter = createFlatUpdateRouter({
    modelName: 'dbCustomType',
    updateSchema: dbCustomTypeUpdateSchema,
});

export const notesFlatUpdateRouter = createFlatUpdateRouter({
    modelName: 'note',
    updateSchema: noteUpdateSchema,
});
