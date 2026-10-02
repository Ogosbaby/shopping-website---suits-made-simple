-- ===========================================================================
-- Suits Made Simple (SMS) — catalog seed
-- Run after schema.sql. Safe to re-run (upserts by slug).
-- ===========================================================================

insert into public.products (slug, name, category, description, details, price_cents, image, images, colour, occasions, featured)
values
  (
    'the-executive-charcoal',
    'The Executive Charcoal',
    'corporate',
    'A two-piece in deep charcoal wool. Structured shoulders, a clean drape, and a silhouette built for the boardroom.',
    '["Super 120s wool","Half-canvassed construction","Notch lapel, two-button front","Double vented back"]'::jsonb,
    28900000, -- ₦289,000
    '/products/executive-charcoal.jpg',
    array[
      '/products/executive-charcoal.jpg',
      '/products/executive-charcoal-alt.jpg',
      '/products/executive-charcoal-life.jpg',
      '/products/executive-charcoal-detail.jpg'
    ],
    'Charcoal',
    array['The Boardroom', 'Sunday Service'],
    true
  ),
  (
    'the-boardroom-navy',
    'The Boardroom Navy',
    'corporate',
    'A three-piece in midnight navy. Composed, authoritative, and correct in every room it enters.',
    '["Super 130s wool","Three-piece with waistcoat","Peak lapel option","Full satin lining"]'::jsonb,
    38500000, -- ₦385,000
    '/products/boardroom-navy.jpg',
    array[
      '/products/boardroom-navy.jpg',
      '/products/boardroom-navy-alt.jpg',
      '/products/boardroom-navy-life.jpg',
      '/products/boardroom-navy-detail.jpg'
    ],
    'Navy',
    array['The Boardroom', 'Conferences & Retreats'],
    true
  ),
  (
    'the-ambassador-midnight',
    'The Ambassador Midnight',
    'corporate',
    'An evening tuxedo in midnight black. Satin lapels, a quiet sheen, and presence without effort.',
    '["Midnight black wool","Satin shawl lapel","Covered buttons","Tailored trouser with braid"]'::jsonb,
    46500000, -- ₦465,000
    '/products/ambassador-midnight.jpg',
    array[
      '/products/ambassador-midnight.jpg',
      '/products/ambassador-midnight-alt.jpg',
      '/products/ambassador-midnight-life.jpg',
      '/products/ambassador-midnight-detail.jpg'
    ],
    'Black',
    array['Black Tie', 'Officiating a Wedding'],
    false
  ),
  (
    'the-chancellor-pinstripe',
    'The Chancellor Pinstripe',
    'corporate',
    'A pinstripe two-piece for men who prefer to be remembered. Crisp lines, deliberate presence.',
    '["Chalk pinstripe wool","Roped shoulder","Ticket pocket","Pick-stitched edges"]'::jsonb,
    33500000, -- ₦335,000
    '/products/chancellor-pinstripe.jpg',
    array[
      '/products/chancellor-pinstripe.jpg',
      '/products/chancellor-pinstripe-alt.jpg',
      '/products/chancellor-pinstripe-life.jpg',
      '/products/chancellor-pinstripe-detail.jpg'
    ],
    'Grey',
    array['The Boardroom', 'Sunday Service'],
    true
  ),
  (
    'the-shepherds-grey',
    'The Shepherd''s Grey',
    'premium_casual',
    'A soft-shouldered grey blazer. Tailored enough for the pulpit, relaxed enough for the week.',
    '["Wool-linen blend","Unstructured shoulder","Patch pockets","Half lined"]'::jsonb,
    19800000, -- ₦198,000
    '/products/shepherds-grey.jpg',
    array[
      '/products/shepherds-grey.jpg',
      '/products/shepherds-grey-alt.jpg',
      '/products/shepherds-grey-life.jpg',
      '/products/shepherds-grey-detail.jpg'
    ],
    'Grey',
    array['Sunday Service', 'Conferences & Retreats'],
    false
  ),
  (
    'the-vineyard-linen',
    'The Vineyard Linen',
    'premium_casual',
    'A breathable linen suit in warm sand. Made for long services, late afternoons, and open air.',
    '["Pure Irish linen","Unlined jacket","Natural shoulder","Soft-roll lapel"]'::jsonb,
    24500000, -- ₦245,000
    '/products/vineyard-linen.jpg',
    array[
      '/products/vineyard-linen.jpg',
      '/products/vineyard-linen-alt.jpg',
      '/products/vineyard-linen-life.jpg',
      '/products/vineyard-linen-detail.jpg'
    ],
    'Sand',
    array['Sunday Service', 'Officiating a Wedding'],
    true
  ),
  (
    'the-retreat-knit',
    'The Retreat Knit',
    'premium_casual',
    'A knitted blazer in muted sage. Effortless structure, quiet comfort, considered detail.',
    '["Italian knit jersey","Two-button front","Four-way stretch","Machine washable"]'::jsonb,
    21500000, -- ₦215,000
    '/products/retreat-knit.jpg',
    array[
      '/products/retreat-knit.jpg',
      '/products/retreat-knit-alt.jpg',
      '/products/retreat-knit-life.jpg',
      '/products/retreat-knit-detail.jpg'
    ],
    'Sage',
    array['Conferences & Retreats', 'Sunday Service'],
    false
  ),
  (
    'the-sabbath-ivory',
    'The Sabbath Ivory',
    'premium_casual',
    'An ivory dinner jacket for evening occasions. Understated, ceremonial, and impeccably cut.',
    '["Ivory wool-silk blend","Shawl collar","Covered buttons","Contrast satin trim"]'::jsonb,
    29500000, -- ₦295,000
    '/products/sabbath-ivory.jpg',
    array[
      '/products/sabbath-ivory.jpg',
      '/products/sabbath-ivory-alt.jpg',
      '/products/sabbath-ivory-life.jpg',
      '/products/sabbath-ivory-detail.jpg'
    ],
    'Ivory',
    array['Officiating a Wedding', 'Black Tie'],
    false
  )
on conflict (slug) do update set
  name        = excluded.name,
  category    = excluded.category,
  description = excluded.description,
  details     = excluded.details,
  price_cents = excluded.price_cents,
  image       = excluded.image,
  images      = excluded.images,
  colour      = excluded.colour,
  occasions   = excluded.occasions,
  featured    = excluded.featured;

-- Standard off-the-rack sizing (Option A) for every product.
insert into public.product_variants (product_id, size, stock)
select p.id, s.size, 12
from public.products p
cross join (values ('38R'), ('40R'), ('42R'), ('44R'), ('46L'), ('48L'), ('50L')) as s (size)
on conflict (product_id, size) do nothing;
