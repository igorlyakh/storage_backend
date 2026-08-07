DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Product' AND column_name = 'orderRecipient'
  ) THEN
    UPDATE "Product" SET "orderRecipient" = 'WAREHOUSE' WHERE "orderRecipient" = 'ADMIN';
  END IF;
END $$;
