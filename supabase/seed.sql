insert into public.venues (id, name, slug, venue_type, menu_label, membership_label, accent_color, tagline)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'Demo Taproom',
    'demo-taproom',
    'brewery',
    'Tap List',
    'Mug Club',
    '#C96B2C',
    'Rotating pours, events, and memberships from one control room.'
  )
on conflict (slug) do nothing;

insert into public.items (
  id,
  venue_id,
  type,
  name,
  style_or_category,
  abv,
  description,
  active,
  display_order,
  price_source
)
values
  (
    '22222222-2222-2222-2222-222222222221',
    '11111111-1111-1111-1111-111111111111',
    'pour',
    'Foamline IPA',
    'West Coast IPA',
    6.7,
    'Bright citrus, resinous finish, built for the after-work crowd.',
    true,
    10,
    'unpriced'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'food',
    'Pretzel Flight',
    'Kitchen',
    null,
    'A soft pretzel trio with beer cheese, grain mustard, and hot honey.',
    true,
    20,
    'unpriced'
  )
on conflict (id) do nothing;

