
-- 1. Prevent privilege escalation: block self-edits to role / club_id
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
BEGIN
  -- Allow privileged staff to change anything
  caller_role := public.get_current_user_role();
  IF caller_role = ANY (ARRAY['recruitment','director']) THEN
    RETURN NEW;
  END IF;

  -- For self-updates, never let a non-manager change role or club_id
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    NEW.role := OLD.role;
  END IF;
  IF NEW.club_id IS DISTINCT FROM OLD.club_id THEN
    NEW.club_id := OLD.club_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER prevent_profile_privilege_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- 2. Lock down match_report_config: managers only for INSERT / UPDATE
DROP POLICY IF EXISTS "Authenticated users can update match report config" ON public.match_report_config;
DROP POLICY IF EXISTS "Authenticated users can insert match report config" ON public.match_report_config;

CREATE POLICY "Managers can update match report config"
ON public.match_report_config
FOR UPDATE
TO authenticated
USING (public.get_current_user_role() = ANY (ARRAY['recruitment','director']))
WITH CHECK (public.get_current_user_role() = ANY (ARRAY['recruitment','director']));

CREATE POLICY "Managers can insert match report config"
ON public.match_report_config
FOR INSERT
TO authenticated
WITH CHECK (public.get_current_user_role() = ANY (ARRAY['recruitment','director']));

-- 3. Pin search_path on remaining functions
ALTER FUNCTION public.enforce_single_default_config() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.get_fixtures_data() SET search_path = public;

-- 4. Revoke EXECUTE on SECURITY DEFINER functions that should only run as triggers
--    or that shouldn't be reachable from the API surface.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_default_notification_settings() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.setup_demo_director_profile() FROM PUBLIC, anon, authenticated;

-- get_current_user_role is used inside RLS expressions, so authenticated users
-- must still be able to execute it. Anon does not need it.
REVOKE EXECUTE ON FUNCTION public.get_current_user_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;

-- get_fixtures_data is not exposed via the app; keep it internal-only.
REVOKE EXECUTE ON FUNCTION public.get_fixtures_data() FROM PUBLIC, anon, authenticated;
