-- Add is_default column to squad_configurations table
ALTER TABLE squad_configurations
ADD COLUMN is_default boolean NOT NULL DEFAULT false;

-- Add constraint to ensure only one default per club_name
CREATE UNIQUE INDEX unique_default_per_club 
ON squad_configurations (club_name) 
WHERE is_default = true;

-- Add function to ensure only one default per club
CREATE OR REPLACE FUNCTION enforce_single_default_config()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    -- Set all other configs for this club to not default
    UPDATE squad_configurations
    SET is_default = false
    WHERE club_name = NEW.club_name
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce single default
CREATE TRIGGER ensure_single_default_config
BEFORE INSERT OR UPDATE ON squad_configurations
FOR EACH ROW
WHEN (NEW.is_default = true)
EXECUTE FUNCTION enforce_single_default_config();