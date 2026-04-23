begin;

delete from public.provider_webhook_events
where venue_id = '11111111-1111-1111-1111-111111111111'
   or venue_id in (
     select id
     from public.venues
     where slug = 'demo-taproom'
   );

delete from public.venues
where id = '11111111-1111-1111-1111-111111111111'
   or slug = 'demo-taproom';

insert into public.venues (id, name, slug, venue_type, menu_label, membership_label, accent_color, tagline)
values (
  '11111111-1111-1111-1111-111111111111',
  'Demo Taproom',
  'demo-taproom',
  'brewery',
  'Tap List',
  'Mug Club',
  '#C96B2C',
  'Rotating pours, events, and memberships from one control room.'
);

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
    '22222222-2222-2222-2222-222222222201',
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
    '22222222-2222-2222-2222-222222222202',
    '11111111-1111-1111-1111-111111111111',
    'pour',
    'Sunshift Pils',
    'German-Style Pilsner',
    5.1,
    'Snappy floral bitterness with a crisp finish that keeps the first round moving.',
    true,
    20,
    'unpriced'
  ),
  (
    '22222222-2222-2222-2222-222222222203',
    '11111111-1111-1111-1111-111111111111',
    'pour',
    'Copper Current Amber',
    'Amber Ale',
    5.8,
    'Toasty malt, orange peel, and just enough bite to bridge lagers and hops.',
    true,
    30,
    'unpriced'
  ),
  (
    '22222222-2222-2222-2222-222222222204',
    '11111111-1111-1111-1111-111111111111',
    'pour',
    'Static Pale Ale',
    'American Pale Ale',
    5.5,
    'Soft grapefruit aroma with a lean body that drinks easy all service long.',
    true,
    40,
    'unpriced'
  ),
  (
    '22222222-2222-2222-2222-222222222205',
    '11111111-1111-1111-1111-111111111111',
    'pour',
    'South Loop Hazy IPA',
    'Hazy IPA',
    6.4,
    'Juicy mango and peach notes with a pillowy finish and low perceived bitterness.',
    true,
    50,
    'unpriced'
  ),
  (
    '22222222-2222-2222-2222-222222222206',
    '11111111-1111-1111-1111-111111111111',
    'pour',
    'Dry Dock Lager',
    'American Lager',
    4.8,
    'Clean, bright, and quietly malty for guests who want an easy pint.',
    true,
    60,
    'unpriced'
  ),
  (
    '22222222-2222-2222-2222-222222222207',
    '11111111-1111-1111-1111-111111111111',
    'pour',
    'Riverbank Hefeweizen',
    'Hefeweizen',
    5.3,
    'Banana and clove aromatics with a soft wheat body and lively carbonation.',
    true,
    70,
    'unpriced'
  ),
  (
    '22222222-2222-2222-2222-222222222208',
    '11111111-1111-1111-1111-111111111111',
    'pour',
    'Daybreak Blonde Ale',
    'Blonde Ale',
    4.9,
    'Light honey sweetness, gentle cracker malt, and a crowd-friendly finish.',
    true,
    80,
    'unpriced'
  ),
  (
    '22222222-2222-2222-2222-222222222209',
    '11111111-1111-1111-1111-111111111111',
    'pour',
    'Midnight Transit Porter',
    'Robust Porter',
    6.1,
    'Roasted cocoa and espresso notes with a silky texture and dry close.',
    true,
    90,
    'unpriced'
  ),
  (
    '22222222-2222-2222-2222-222222222210',
    '11111111-1111-1111-1111-111111111111',
    'pour',
    'Signal Stout',
    'Dry Stout',
    5.2,
    'Classic roast character, dark chocolate bitterness, and a sessionable body.',
    true,
    100,
    'unpriced'
  ),
  (
    '22222222-2222-2222-2222-222222222211',
    '11111111-1111-1111-1111-111111111111',
    'pour',
    'Orchard Guest Cider',
    'Dry Cider',
    6.0,
    'A crisp guest tap with bright apple aroma and a bone-dry finish.',
    true,
    110,
    'unpriced'
  ),
  (
    '22222222-2222-2222-2222-222222222212',
    '11111111-1111-1111-1111-111111111111',
    'pour',
    'Trailhead Hop Water',
    'Hop Water',
    0.0,
    'Sparkling hop water with lime zest and pine for a no-ABV option.',
    true,
    120,
    'unpriced'
  ),
  (
    '22222222-2222-2222-2222-222222222213',
    '11111111-1111-1111-1111-111111111111',
    'food',
    'Pretzel Flight',
    'Shareables',
    null,
    'A soft pretzel trio with beer cheese, grain mustard, and hot honey.',
    true,
    210,
    'unpriced'
  ),
  (
    '22222222-2222-2222-2222-222222222214',
    '11111111-1111-1111-1111-111111111111',
    'food',
    'Beer Cheese Nachos',
    'Shareables',
    null,
    'Kettle chips stacked with lager cheese, pickled jalapenos, and scallions.',
    true,
    220,
    'unpriced'
  ),
  (
    '22222222-2222-2222-2222-222222222215',
    '11111111-1111-1111-1111-111111111111',
    'food',
    'Cheese Curds',
    'Snacks',
    null,
    'Wisconsin-style curds fried crisp and served with dill ranch.',
    true,
    230,
    'unpriced'
  ),
  (
    '22222222-2222-2222-2222-222222222216',
    '11111111-1111-1111-1111-111111111111',
    'food',
    'Fried Pickles',
    'Snacks',
    null,
    'Thick-cut pickle chips with cornmeal crunch and comeback sauce.',
    true,
    240,
    'unpriced'
  ),
  (
    '22222222-2222-2222-2222-222222222217',
    '11111111-1111-1111-1111-111111111111',
    'food',
    'Loaded Fries',
    'Shareables',
    null,
    'Crispy fries topped with bacon, queso, pickled onions, and herbs.',
    true,
    250,
    'unpriced'
  ),
  (
    '22222222-2222-2222-2222-222222222218',
    '11111111-1111-1111-1111-111111111111',
    'food',
    'Smashburger',
    'Mains',
    null,
    'Double-patty burger with house sauce, onions, pickles, and American cheese.',
    true,
    260,
    'unpriced'
  ),
  (
    '22222222-2222-2222-2222-222222222219',
    '11111111-1111-1111-1111-111111111111',
    'food',
    'Bratwurst Plate',
    'Mains',
    null,
    'Beer-braised brat with kraut, mustard, and a warm potato salad.',
    true,
    270,
    'unpriced'
  ),
  (
    '22222222-2222-2222-2222-222222222220',
    '11111111-1111-1111-1111-111111111111',
    'food',
    'Hot Chicken Sandwich',
    'Mains',
    null,
    'Crispy thigh, spicy glaze, pickles, and cooling slaw on a brioche bun.',
    true,
    280,
    'unpriced'
  ),
  (
    '22222222-2222-2222-2222-222222222221',
    '11111111-1111-1111-1111-111111111111',
    'food',
    'Street Tacos',
    'Mains',
    null,
    'Three tacos with charred chicken, onion, cilantro, and salsa verde.',
    true,
    290,
    'unpriced'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'food',
    'Veggie Flatbread',
    'Mains',
    null,
    'Flatbread with roasted peppers, mushrooms, mozzarella, and basil oil.',
    true,
    300,
    'unpriced'
  ),
  (
    '22222222-2222-2222-2222-222222222223',
    '11111111-1111-1111-1111-111111111111',
    'food',
    'Caesar Salad',
    'Salads',
    null,
    'Romaine, parmesan, crunchy crumbs, and a punchy garlic dressing.',
    true,
    310,
    'unpriced'
  ),
  (
    '22222222-2222-2222-2222-222222222224',
    '11111111-1111-1111-1111-111111111111',
    'food',
    'Chocolate Stout Cake',
    'Sweets',
    null,
    'Dark chocolate cake with stout ganache and whipped cream.',
    true,
    320,
    'unpriced'
  );

insert into public.events (
  id,
  venue_id,
  slug,
  title,
  description,
  starts_at,
  ends_at,
  capacity,
  price_cents,
  currency,
  published,
  status
)
values
  (
    '33333333-3333-3333-3333-333333333301',
    '11111111-1111-1111-1111-111111111111',
    'run-club-pint',
    'Run Club + Pint',
    'Meet at the taproom for an easy community run, then come back for recovery pours, hop water, and post-run hangs.',
    ((date_trunc('day', now() at time zone 'utc') + interval '2 days 18 hours') at time zone 'utc'),
    ((date_trunc('day', now() at time zone 'utc') + interval '2 days 20 hours') at time zone 'utc'),
    60,
    null,
    'USD',
    true,
    'published'
  ),
  (
    '33333333-3333-3333-3333-333333333302',
    '11111111-1111-1111-1111-111111111111',
    'trivia-tuesday',
    'Trivia Tuesday',
    'Six themed rounds, rotating prizes, and plenty of room for regular teams and first-timers alike.',
    ((date_trunc('day', now() at time zone 'utc') + interval '5 days 19 hours') at time zone 'utc'),
    ((date_trunc('day', now() at time zone 'utc') + interval '5 days 21 hours 30 minutes') at time zone 'utc'),
    80,
    null,
    'USD',
    true,
    'published'
  ),
  (
    '33333333-3333-3333-3333-333333333303',
    '11111111-1111-1111-1111-111111111111',
    'friday-patio-music',
    'Friday Patio Music',
    'A free patio set with local musicians, sunset seating, and the full dinner menu running late.',
    ((date_trunc('day', now() at time zone 'utc') + interval '8 days 20 hours') at time zone 'utc'),
    ((date_trunc('day', now() at time zone 'utc') + interval '8 days 23 hours') at time zone 'utc'),
    120,
    null,
    'USD',
    true,
    'published'
  );

insert into public.event_bookings (
  id,
  event_id,
  venue_id,
  purchaser_name,
  purchaser_email,
  purchaser_phone,
  party_size,
  checked_in_count,
  payment_status,
  booking_status,
  unit_price_cents,
  total_price_cents,
  currency,
  confirmed_at,
  created_at
)
values
  (
    '44444444-4444-4444-4444-444444444401',
    '33333333-3333-3333-3333-333333333301',
    '11111111-1111-1111-1111-111111111111',
    'Maya Chen',
    'maya@example.com',
    '+1 312 555 0101',
    2,
    2,
    'unpaid',
    'confirmed',
    0,
    0,
    'USD',
    ((date_trunc('day', now() at time zone 'utc') - interval '1 day 6 hours') at time zone 'utc'),
    ((date_trunc('day', now() at time zone 'utc') - interval '1 day 6 hours') at time zone 'utc')
  ),
  (
    '44444444-4444-4444-4444-444444444402',
    '33333333-3333-3333-3333-333333333301',
    '11111111-1111-1111-1111-111111111111',
    'Jordan Ellis',
    'jordan@example.com',
    '+1 312 555 0102',
    1,
    1,
    'unpaid',
    'confirmed',
    0,
    0,
    'USD',
    ((date_trunc('day', now() at time zone 'utc') - interval '1 day 4 hours') at time zone 'utc'),
    ((date_trunc('day', now() at time zone 'utc') - interval '1 day 4 hours') at time zone 'utc')
  ),
  (
    '44444444-4444-4444-4444-444444444403',
    '33333333-3333-3333-3333-333333333301',
    '11111111-1111-1111-1111-111111111111',
    'Priya Patel',
    'priya@example.com',
    '+1 312 555 0103',
    4,
    0,
    'unpaid',
    'confirmed',
    0,
    0,
    'USD',
    ((date_trunc('day', now() at time zone 'utc') - interval '20 hours') at time zone 'utc'),
    ((date_trunc('day', now() at time zone 'utc') - interval '20 hours') at time zone 'utc')
  ),
  (
    '44444444-4444-4444-4444-444444444404',
    '33333333-3333-3333-3333-333333333302',
    '11111111-1111-1111-1111-111111111111',
    'Alex Rivera',
    'alex@example.com',
    '+1 312 555 0104',
    3,
    0,
    'unpaid',
    'confirmed',
    0,
    0,
    'USD',
    ((date_trunc('day', now() at time zone 'utc') - interval '18 hours') at time zone 'utc'),
    ((date_trunc('day', now() at time zone 'utc') - interval '18 hours') at time zone 'utc')
  ),
  (
    '44444444-4444-4444-4444-444444444405',
    '33333333-3333-3333-3333-333333333302',
    '11111111-1111-1111-1111-111111111111',
    'Morgan Lee',
    'morgan@example.com',
    '+1 312 555 0105',
    5,
    0,
    'unpaid',
    'confirmed',
    0,
    0,
    'USD',
    ((date_trunc('day', now() at time zone 'utc') - interval '12 hours') at time zone 'utc'),
    ((date_trunc('day', now() at time zone 'utc') - interval '12 hours') at time zone 'utc')
  );

insert into public.event_check_in_sessions (
  id,
  venue_id,
  event_id,
  session_name,
  pin,
  token,
  expires_at
)
values (
  '55555555-5555-5555-5555-555555555501',
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333301',
  'Front Door Check-In',
  '4242',
  'demo-run-club-check-in-token',
  ((date_trunc('day', now() at time zone 'utc') + interval '3 days 2 hours') at time zone 'utc')
);

insert into public.check_in_events (
  id,
  booking_id,
  venue_id,
  delta,
  actor_type,
  actor_reference
)
values
  (
    '66666666-6666-6666-6666-666666666601',
    '44444444-4444-4444-4444-444444444401',
    '11111111-1111-1111-1111-111111111111',
    2,
    'shared_session',
    'demo-run-club-check-in-token'
  ),
  (
    '66666666-6666-6666-6666-666666666602',
    '44444444-4444-4444-4444-444444444402',
    '11111111-1111-1111-1111-111111111111',
    1,
    'shared_session',
    'demo-run-club-check-in-token'
  );

insert into public.membership_plans (
  id,
  venue_id,
  slug,
  name,
  description,
  billing_interval,
  price_cents,
  currency,
  active
)
values
  (
    '77777777-7777-7777-7777-777777777701',
    '11111111-1111-1111-1111-111111111111',
    'mug-club-monthly',
    'Mug Club Monthly',
    'Monthly members get one featured pint, early event access, and first shot at small-batch releases.',
    'month',
    2500,
    'USD',
    true
  ),
  (
    '77777777-7777-7777-7777-777777777702',
    '11111111-1111-1111-1111-111111111111',
    'founders-club-annual',
    'Founders Club Annual',
    'Annual members get a custom mug, member-only happy hours, and recurring merch discounts all year.',
    'year',
    22500,
    'USD',
    true
  );

insert into public.memberships (
  id,
  venue_id,
  membership_plan_id,
  member_name,
  member_email,
  member_phone,
  status,
  plan_name_snapshot,
  billing_interval,
  price_cents,
  currency,
  cancel_at_period_end,
  created_at
)
values
  (
    '88888888-8888-8888-8888-888888888801',
    '11111111-1111-1111-1111-111111111111',
    '77777777-7777-7777-7777-777777777701',
    'Taylor Brooks',
    'taylor@example.com',
    '+1 312 555 0201',
    'pending',
    'Mug Club Monthly',
    'month',
    2500,
    'USD',
    false,
    ((date_trunc('day', now() at time zone 'utc') - interval '6 days') at time zone 'utc')
  ),
  (
    '88888888-8888-8888-8888-888888888802',
    '11111111-1111-1111-1111-111111111111',
    '77777777-7777-7777-7777-777777777701',
    'Cameron Diaz',
    'cameron@example.com',
    '+1 312 555 0202',
    'pending',
    'Mug Club Monthly',
    'month',
    2500,
    'USD',
    false,
    ((date_trunc('day', now() at time zone 'utc') - interval '4 days') at time zone 'utc')
  ),
  (
    '88888888-8888-8888-8888-888888888803',
    '11111111-1111-1111-1111-111111111111',
    '77777777-7777-7777-7777-777777777702',
    'Riley Thompson',
    'riley@example.com',
    '+1 312 555 0203',
    'pending',
    'Founders Club Annual',
    'year',
    22500,
    'USD',
    false,
    ((date_trunc('day', now() at time zone 'utc') - interval '2 days') at time zone 'utc')
  );

commit;
