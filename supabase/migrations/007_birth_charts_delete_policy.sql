-- Allow users to delete their own birth charts (needed for settings page chart update)
DO $$ BEGIN
  CREATE POLICY "Users can delete own charts"
    ON birth_charts FOR DELETE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
