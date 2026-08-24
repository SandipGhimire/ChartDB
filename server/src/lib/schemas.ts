import { z } from 'zod';

// Nested blob content (fields/indexes/checkConstraints/custom-type values) is
// stored as opaque JSONB, matching the Dexie shape 1:1 — the outer envelope
// (ownership/positioning/scoping fields) is validated strictly, the nested
// content is passed through as-is rather than duplicating the frontend's
// full DataType/DBField/DBIndex zod chain here.

export const dbTableCreateSchema = z.object({
    id: z.string().min(1),
    name: z.string(),
    schema: z.string().nullable().optional(),
    x: z.number(),
    y: z.number(),
    fields: z.array(z.unknown()),
    indexes: z.array(z.unknown()),
    checkConstraints: z.array(z.unknown()).nullable().optional(),
    color: z.string(),
    isView: z.boolean(),
    isMaterializedView: z.boolean().nullable().optional(),
    createdAt: z.number(),
    width: z.number().nullable().optional(),
    comments: z.string().nullable().optional(),
    order: z.number().nullable().optional(),
    expanded: z.boolean().nullable().optional(),
    parentAreaId: z.string().nullable().optional(),
});
export const dbTableUpdateSchema = dbTableCreateSchema.partial().omit({
    id: true,
});

export const dbRelationshipCreateSchema = z.object({
    id: z.string().min(1),
    name: z.string(),
    sourceSchema: z.string().nullable().optional(),
    sourceTableId: z.string(),
    targetSchema: z.string().nullable().optional(),
    targetTableId: z.string(),
    sourceFieldId: z.string(),
    targetFieldId: z.string(),
    sourceCardinality: z.union([z.literal('one'), z.literal('many')]),
    targetCardinality: z.union([z.literal('one'), z.literal('many')]),
    createdAt: z.number(),
});
export const dbRelationshipUpdateSchema = dbRelationshipCreateSchema
    .partial()
    .omit({ id: true });

export const dbDependencyCreateSchema = z.object({
    id: z.string().min(1),
    schema: z.string().nullable().optional(),
    tableId: z.string(),
    dependentSchema: z.string().nullable().optional(),
    dependentTableId: z.string(),
    createdAt: z.number(),
});
export const dbDependencyUpdateSchema = dbDependencyCreateSchema
    .partial()
    .omit({ id: true });

export const areaCreateSchema = z.object({
    id: z.string().min(1),
    name: z.string(),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    color: z.string(),
    order: z.number().optional(),
});
export const areaUpdateSchema = areaCreateSchema.partial().omit({ id: true });

export const dbCustomTypeCreateSchema = z.object({
    id: z.string().min(1),
    schema: z.string().nullable().optional(),
    name: z.string(),
    kind: z.union([z.literal('enum'), z.literal('composite')]),
    values: z.array(z.string()).nullable().optional(),
    fields: z.array(z.unknown()).nullable().optional(),
    order: z.number().nullable().optional(),
});
export const dbCustomTypeUpdateSchema = dbCustomTypeCreateSchema
    .partial()
    .omit({ id: true });

export const noteCreateSchema = z.object({
    id: z.string().min(1),
    content: z.string(),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    color: z.string(),
    order: z.number().optional(),
});
export const noteUpdateSchema = noteCreateSchema.partial().omit({ id: true });

export const diagramFilterSchema = z.object({
    schemaIds: z.array(z.string()).optional(),
    tableIds: z.array(z.string()).optional(),
});

export const diagramCreateSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    databaseType: z.string().min(1),
    databaseEdition: z.string().nullable().optional(),
});
export const diagramUpdateSchema = z.object({
    name: z.string().min(1).optional(),
    databaseType: z.string().min(1).optional(),
    databaseEdition: z.string().nullable().optional(),
});
