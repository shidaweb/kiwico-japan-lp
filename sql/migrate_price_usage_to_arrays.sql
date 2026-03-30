-- 既存の pre_registrations を、配列カラム＋NOT NULL にそろえるとき用。
--
-- 次のどちらでも安全に実行できます。
-- A) 旧スキーマ: price_range / usage_image が TEXT のとき → データを price_ranges / usage_images に移して旧カラムを削除
-- B) 新スキーマ: pre_registrations.sql で作ったテーブル → 旧カラムが無いので移行 UPDATE はスキップされ、NULL 埋め・NOT NULL のみ実行
--
-- テーブル自体が無い場合は pre_registrations.sql を先に実行してください。

ALTER TABLE pre_registrations
  ADD COLUMN IF NOT EXISTS price_ranges TEXT[],
  ADD COLUMN IF NOT EXISTS usage_images TEXT[];

-- 旧カラムがあるときだけ移行（静的 SQL だと price_range が無いテーブルで構文エラーになるため動的 SQL）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pre_registrations'
      AND column_name = 'price_range'
  ) THEN
    EXECUTE $sql$
      UPDATE pre_registrations
      SET price_ranges = ARRAY[price_range]
      WHERE price_range IS NOT NULL AND price_ranges IS NULL
    $sql$;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pre_registrations'
      AND column_name = 'usage_image'
  ) THEN
    EXECUTE $sql$
      UPDATE pre_registrations
      SET usage_images = ARRAY[usage_image]
      WHERE usage_image IS NOT NULL AND usage_images IS NULL
    $sql$;
  END IF;
END $$;

UPDATE pre_registrations
SET price_ranges = ARRAY[]::text[]
WHERE price_ranges IS NULL;

UPDATE pre_registrations
SET usage_images = ARRAY[]::text[]
WHERE usage_images IS NULL;

UPDATE pre_registrations
SET notifications = ARRAY[]::text[]
WHERE notifications IS NULL;

ALTER TABLE pre_registrations
  ALTER COLUMN price_ranges SET NOT NULL,
  ALTER COLUMN usage_images SET NOT NULL,
  ALTER COLUMN notifications SET NOT NULL;

ALTER TABLE pre_registrations DROP COLUMN IF EXISTS price_range;
ALTER TABLE pre_registrations DROP COLUMN IF EXISTS usage_image;
