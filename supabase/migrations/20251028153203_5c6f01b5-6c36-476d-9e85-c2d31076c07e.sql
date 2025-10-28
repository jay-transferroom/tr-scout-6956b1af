-- Clear existing clubs data and repopulate with badge URLs
DELETE FROM public.clubs;

-- Insert all clubs with their badge URLs
INSERT INTO public.clubs (name, slug, badge_url) VALUES
  ('Arsenal', 'arsenal', '/badges/arsenal.svg'),
  ('Aston Villa', 'aston-villa', '/badges/aston-villa.svg'),
  ('AFC Bournemouth', 'bournemouth', '/badges/bournemouth.svg'),
  ('Brentford', 'brentford', '/badges/brentford.svg'),
  ('Brighton & Hove Albion', 'brighton', '/badges/brighton.svg'),
  ('Burnley', 'burnley', '/badges/burnley.svg'),
  ('Chelsea F.C.', 'chelsea', '/badges/chelsea.svg'),
  ('Crystal Palace', 'crystal-palace', '/badges/crystal-palace.svg'),
  ('Everton', 'everton', '/badges/everton.svg'),
  ('Fulham', 'fulham', '/badges/fulham.svg'),
  ('Leeds United', 'leeds-united', '/badges/leeds-united.svg'),
  ('Liverpool', 'liverpool', '/badges/liverpool.svg'),
  ('Manchester City', 'manchester-city', '/badges/manchester-city.svg'),
  ('Manchester United', 'manchester-united', '/badges/manchester-united.svg'),
  ('Newcastle United', 'newcastle-united', '/badges/newcastle-united.svg'),
  ('Nottingham Forest', 'nottingham-forest', '/badges/nottingham-forest.svg'),
  ('Sunderland', 'sunderland', '/badges/sunderland.svg'),
  ('Tottenham Hotspur', 'tottenham-hotspur', '/badges/tottenham-hotspur.svg'),
  ('West Ham United', 'west-ham-united', '/badges/west-ham-united.svg'),
  ('Wolverhampton Wanderers', 'wolverhampton-wanderers', '/badges/wolverhampton-wanderers.svg');