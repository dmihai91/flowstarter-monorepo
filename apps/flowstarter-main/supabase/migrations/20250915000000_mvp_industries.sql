-- Ensure industries table exists and is constrained to MVP list
-- Ensure moddatetime extension is available (for updated_at trigger)
create extension if not exists moddatetime schema extensions;
create table if not exists industries (
  id text primary key,
  name text not null unique,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Keep updated_at fresh
do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'set_updated_at_industries'
  ) then
    create trigger set_updated_at_industries
      before update on industries
      for each row
      execute function extensions.moddatetime (updated_at);
  end if;
end $$;

-- Upsert MVP industries
insert into industries (id, name, description) values
  ('consultants-coaches', 'Consultants & Coaches', 'Business, life, career, financial, marketing, etc. Need clear services pages + contact funnels.'),
  ('therapists-psychologists', 'Therapists & Psychologists', 'Individual practitioners or small practices. Need trust-building design + appointment booking.'),
  ('photographers-videographers', 'Photographers & Videographers', 'Solo creatives needing fast portfolio sites. Very visual → good to showcase Flowstarter’s design power.'),
  ('designers-creative-studios', 'Designers & Creative Studios', 'Graphic/web/interior/fashion designers, small agencies. High standards for design, strong referral potential.'),
  ('personal-trainers-wellness', 'Personal Trainers & Wellness Experts', 'Trainers, yoga teachers, nutritionists. Simple service packages + booking.'),
  ('salons-barbers-spas', 'Salons, Barbers & Spas', 'Local businesses needing quick professional sites. Often pay for design/branding to attract walk-ins.'),
  ('restaurants-cafes', 'Restaurants & Cafés', 'Menus, photos, contact info — simple but impactful. Big word-of-mouth marketing potential once a few sign up.'),
  ('content-creation', 'Content Creation', 'Content creators, bloggers, vloggers, podcasters, etc. Need clear services pages + contact funnels.'),
  ('fashion-beauty', 'Fashion & Beauty', 'Fashion designers, stylists, beauty salons, etc. Need clear services pages + contact funnels.'),
  ('health-wellness', 'Health & Wellness', 'Health coaches, nutritionists, yoga teachers, etc. Need clear services pages + contact funnels.'),
  ('other', 'Other', 'Other industries, etc. Need clear services pages + contact funnels.')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  updated_at = timezone('utc'::text, now());

-- Prune any non-MVP rows
delete from industries where id not in (
  'consultants-coaches',
  'therapists-psychologists',
  'photographers-videographers',
  'designers-creative-studios',
  'personal-trainers-wellness',
  'salons-barbers-spas',
  'restaurants-cafes',
  'content-creation',
  'fashion-beauty',
  'health-wellness',
  'other'
);



