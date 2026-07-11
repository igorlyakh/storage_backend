CREATE TABLE IF NOT EXISTS "Warehouse" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Warehouse_name_key" ON "Warehouse"("name");

INSERT INTO "Warehouse" ("id", "name", "isDefault", "updatedAt")
SELECT gen_random_uuid()::text, 'Main', true, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Warehouse" WHERE "isDefault" = true);

ALTER TABLE "WarehouseStock" ADD COLUMN IF NOT EXISTS "warehouseId" TEXT;

UPDATE "WarehouseStock"
SET "warehouseId" = (SELECT "id" FROM "Warehouse" WHERE "isDefault" = true LIMIT 1)
WHERE "warehouseId" IS NULL;

ALTER TABLE "WarehouseStock" ALTER COLUMN "warehouseId" SET NOT NULL;

DROP INDEX IF EXISTS "WarehouseStock_productId_key";

CREATE UNIQUE INDEX IF NOT EXISTS "WarehouseStock_productId_warehouseId_key"
    ON "WarehouseStock"("productId", "warehouseId");

DO $$ BEGIN
    ALTER TABLE "WarehouseStock"
        ADD CONSTRAINT "WarehouseStock_warehouseId_fkey"
        FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

ALTER TABLE "WarehouseRequest" ADD COLUMN IF NOT EXISTS "sourceWarehouseId" TEXT;

DO $$ BEGIN
    ALTER TABLE "WarehouseRequest"
        ADD CONSTRAINT "WarehouseRequest_sourceWarehouseId_fkey"
        FOREIGN KEY ("sourceWarehouseId") REFERENCES "Warehouse"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
