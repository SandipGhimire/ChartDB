-- CreateEnum
CREATE TYPE "DiagramRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');

-- CreateTable
CREATE TABLE "diagrams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "databaseType" TEXT NOT NULL,
    "databaseEdition" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diagrams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagram_members" (
    "id" TEXT NOT NULL,
    "diagramId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "DiagramRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagram_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "db_tables" (
    "id" TEXT NOT NULL,
    "diagramId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "schema" TEXT,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "fields" JSONB NOT NULL,
    "indexes" JSONB NOT NULL,
    "checkConstraints" JSONB,
    "color" TEXT NOT NULL,
    "isView" BOOLEAN NOT NULL DEFAULT false,
    "isMaterializedView" BOOLEAN,
    "createdAt" BIGINT NOT NULL,
    "width" DOUBLE PRECISION,
    "comments" TEXT,
    "order" DOUBLE PRECISION,
    "expanded" BOOLEAN,
    "parentAreaId" TEXT,

    CONSTRAINT "db_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "db_relationships" (
    "id" TEXT NOT NULL,
    "diagramId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceSchema" TEXT,
    "sourceTableId" TEXT NOT NULL,
    "targetSchema" TEXT,
    "targetTableId" TEXT NOT NULL,
    "sourceFieldId" TEXT NOT NULL,
    "targetFieldId" TEXT NOT NULL,
    "sourceCardinality" TEXT NOT NULL,
    "targetCardinality" TEXT NOT NULL,
    "createdAt" BIGINT NOT NULL,

    CONSTRAINT "db_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "db_dependencies" (
    "id" TEXT NOT NULL,
    "diagramId" TEXT NOT NULL,
    "schema" TEXT,
    "tableId" TEXT NOT NULL,
    "dependentSchema" TEXT,
    "dependentTableId" TEXT NOT NULL,
    "createdAt" BIGINT NOT NULL,

    CONSTRAINT "db_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "areas" (
    "id" TEXT NOT NULL,
    "diagramId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "color" TEXT NOT NULL,
    "order" DOUBLE PRECISION,

    CONSTRAINT "areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "db_custom_types" (
    "id" TEXT NOT NULL,
    "diagramId" TEXT NOT NULL,
    "schema" TEXT,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "values" JSONB,
    "fields" JSONB,
    "order" DOUBLE PRECISION,

    CONSTRAINT "db_custom_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "diagramId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "color" TEXT NOT NULL,
    "order" DOUBLE PRECISION,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagram_filters" (
    "diagramId" TEXT NOT NULL,
    "schemaIds" JSONB,
    "tableIds" JSONB,

    CONSTRAINT "diagram_filters_pkey" PRIMARY KEY ("diagramId")
);

-- CreateIndex
CREATE INDEX "diagram_members_userId_idx" ON "diagram_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "diagram_members_diagramId_userId_key" ON "diagram_members"("diagramId", "userId");

-- CreateIndex
CREATE INDEX "db_tables_diagramId_idx" ON "db_tables"("diagramId");

-- CreateIndex
CREATE INDEX "db_relationships_diagramId_idx" ON "db_relationships"("diagramId");

-- CreateIndex
CREATE INDEX "db_dependencies_diagramId_idx" ON "db_dependencies"("diagramId");

-- CreateIndex
CREATE INDEX "areas_diagramId_idx" ON "areas"("diagramId");

-- CreateIndex
CREATE INDEX "db_custom_types_diagramId_idx" ON "db_custom_types"("diagramId");

-- CreateIndex
CREATE INDEX "notes_diagramId_idx" ON "notes"("diagramId");

-- AddForeignKey
ALTER TABLE "diagram_members" ADD CONSTRAINT "diagram_members_diagramId_fkey" FOREIGN KEY ("diagramId") REFERENCES "diagrams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagram_members" ADD CONSTRAINT "diagram_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "db_tables" ADD CONSTRAINT "db_tables_diagramId_fkey" FOREIGN KEY ("diagramId") REFERENCES "diagrams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "db_relationships" ADD CONSTRAINT "db_relationships_diagramId_fkey" FOREIGN KEY ("diagramId") REFERENCES "diagrams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "db_dependencies" ADD CONSTRAINT "db_dependencies_diagramId_fkey" FOREIGN KEY ("diagramId") REFERENCES "diagrams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "areas" ADD CONSTRAINT "areas_diagramId_fkey" FOREIGN KEY ("diagramId") REFERENCES "diagrams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "db_custom_types" ADD CONSTRAINT "db_custom_types_diagramId_fkey" FOREIGN KEY ("diagramId") REFERENCES "diagrams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_diagramId_fkey" FOREIGN KEY ("diagramId") REFERENCES "diagrams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagram_filters" ADD CONSTRAINT "diagram_filters_diagramId_fkey" FOREIGN KEY ("diagramId") REFERENCES "diagrams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
