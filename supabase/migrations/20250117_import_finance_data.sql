-- Finance CSV Import
-- Total transactions: 215

-- First, ensure user has an account
DO $$
DECLARE
  v_user_id uuid;
  v_account_id uuid;
BEGIN
  -- Get the current user ID
  SELECT auth.uid() INTO v_user_id;

  -- Get or create default account
  SELECT id INTO v_account_id
  FROM accounts
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_account_id IS NULL THEN
    RAISE EXCEPTION 'No account found. Please create an account first.';
  END IF;

  -- Insert transactions

  -- Rent (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Rent',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    3147.28,
    'debit',
    'RENT'
  );

  -- Biryaniz (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Biryaniz',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    7.5,
    'debit',
    'BIRYANIZ'
  );

  -- watch for mom (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'watch for mom',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    139.45,
    'debit',
    'WATCH FOR MOM'
  );

  -- nordstorm (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'nordstorm',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    123.54,
    'debit',
    'NORDSTORM'
  );

  -- Costco (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Costco',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    37.25,
    'debit',
    'COSTCO'
  );

  -- Electricity and Gas (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Electricity and Gas',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    173,
    'debit',
    'ELECTRICITY AND GAS'
  );

  -- chocolate (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'chocolate',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    29.14,
    'debit',
    'CHOCOLATE'
  );

  -- dollar tree ansh (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'dollar tree ansh',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    5.74,
    'debit',
    'DOLLAR TREE ANSH'
  );

  -- Target (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Target',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    105.48,
    'debit',
    'TARGET'
  );

  -- Five Spice (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Five Spice',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    3.27,
    'debit',
    'FIVE SPICE'
  );

  -- Phone (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Phone',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    78.78,
    'debit',
    'PHONE'
  );

  -- masala pizza :( (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'masala pizza :(',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    35.92,
    'debit',
    'MASALA PIZZA :('
  );

  -- walmart ansh (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'walmart ansh',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    40.9,
    'debit',
    'WALMART ANSH'
  );

  -- Amazon (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Amazon',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    223.32,
    'debit',
    'AMAZON'
  );

  -- Five Spice (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Five Spice',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    5.79,
    'debit',
    'FIVE SPICE'
  );

  -- Wifi (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Wifi',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    90,
    'debit',
    'WIFI'
  );

  -- swati tiffin (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'swati tiffin',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    23.47,
    'debit',
    'SWATI TIFFIN'
  );

  -- Movie (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Movie',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    43.36,
    'debit',
    'MOVIE'
  );

  -- Tj Maxx (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Tj Maxx',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    158.19,
    'debit',
    'TJ MAXX'
  );

  -- Sprouts (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Sprouts',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    73.73,
    'debit',
    'SPROUTS'
  );

  -- Utilities (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Utilities',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    124.5,
    'debit',
    'UTILITIES'
  );

  -- swati tiffin (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'swati tiffin',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    2.5,
    'debit',
    'SWATI TIFFIN'
  );

  -- Avis toll (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Avis toll',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    15.17,
    'debit',
    'AVIS TOLL'
  );

  -- Tj Maxx (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Tj Maxx',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    39.29,
    'debit',
    'TJ MAXX'
  );

  -- Apni Mandi (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Apni Mandi',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    97.11,
    'debit',
    'APNI MANDI'
  );

  -- parlor (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'parlor',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    38.4,
    'debit',
    'PARLOR'
  );

  -- tandoori pizza (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'tandoori pizza',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    12.28,
    'debit',
    'TANDOORI PIZZA'
  );

  -- laderach choc (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'laderach choc',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    29.14,
    'debit',
    'LADERACH CHOC'
  );

  -- Amazon (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Amazon',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    34.99,
    'debit',
    'AMAZON'
  );

  -- Costco (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Costco',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    37.25,
    'debit',
    'COSTCO'
  );

  -- Badminton (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Badminton',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    39,
    'debit',
    'BADMINTON'
  );

  -- SJC38 (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'SJC38',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    5.95,
    'debit',
    'SJC38'
  );

  -- Vivek flowers (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Vivek flowers',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    33.06,
    'debit',
    'VIVEK FLOWERS'
  );

  -- Singapore Airlines (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Singapore Airlines',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    14.9,
    'debit',
    'SINGAPORE AIRLINES'
  );

  -- Costco (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Costco',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    6.59,
    'debit',
    'COSTCO'
  );

  -- Tesla insurance (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Tesla insurance',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    180,
    'debit',
    'TESLA INSURANCE'
  );

  -- Panipuri (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Panipuri',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    26.15,
    'debit',
    'PANIPURI'
  );

  -- Top golf (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Top golf',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    190.63,
    'debit',
    'TOP GOLF'
  );

  -- Five Spice (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Five Spice',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    22.71,
    'debit',
    'FIVE SPICE'
  );

  -- renters insurance (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'renters insurance',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    17.75,
    'debit',
    'RENTERS INSURANCE'
  );

  -- SJC38 (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'SJC38',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    10.48,
    'debit',
    'SJC38'
  );

  -- Parking (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Parking',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    6,
    'debit',
    'PARKING'
  );

  -- Coconut Hil (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Coconut Hil',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    6.08,
    'debit',
    'COCONUT HIL'
  );

  -- gpt (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'gpt',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    20,
    'debit',
    'GPT'
  );

  -- Panipuri (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Panipuri',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    13.07,
    'debit',
    'PANIPURI'
  );

  -- Five Spice (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Five Spice',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    3.77,
    'debit',
    'FIVE SPICE'
  );

  -- car loan (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'car loan',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    1000,
    'debit',
    'CAR LOAN'
  );

  -- Saapadu (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Saapadu',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    36.89,
    'debit',
    'SAAPADU'
  );

  -- Five Spice (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Five Spice',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    10.61,
    'debit',
    'FIVE SPICE'
  );

  -- Tessie (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Tessie',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    5,
    'debit',
    'TESSIE'
  );

  -- Panipuri (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Panipuri',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    13.07,
    'debit',
    'PANIPURI'
  );

  -- Costco (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Costco',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    15.47,
    'debit',
    'COSTCO'
  );

  -- Lansum (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Lansum',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    2000,
    'debit',
    'LANSUM'
  );

  -- Panipuri (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Panipuri',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    6.5,
    'debit',
    'PANIPURI'
  );

  -- Five Spice (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Five Spice',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    8.57,
    'debit',
    'FIVE SPICE'
  );

  -- Education loan (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Education loan',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    500,
    'debit',
    'EDUCATION LOAN'
  );

  -- Costco (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Costco',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    123.68,
    'debit',
    'COSTCO'
  );

  -- Five Spice (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Five Spice',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    19.91,
    'debit',
    'FIVE SPICE'
  );

  -- Apni Mandi (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Apni Mandi',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    14.52,
    'debit',
    'APNI MANDI'
  );

  -- India Metro (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'India Metro',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    11.99,
    'debit',
    'INDIA METRO'
  );

  -- Apni Mandi (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Apni Mandi',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    10.9,
    'debit',
    'APNI MANDI'
  );

  -- New India Bazar (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'New India Bazar',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    3.98,
    'debit',
    'NEW INDIA BAZAR'
  );

  -- Five Spice (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Five Spice',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    11.97,
    'debit',
    'FIVE SPICE'
  );

  -- Five Spice (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-07-15'::date,
    'Five Spice',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    2.39,
    'debit',
    'FIVE SPICE'
  );

  -- Rent (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Rent',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    3015,
    'debit',
    'RENT'
  );

  -- Panipuri (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Panipuri',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    13.07,
    'debit',
    'PANIPURI'
  );

  -- Priest (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Priest',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    400,
    'debit',
    'PRIEST'
  );

  -- Souvenir reedwood (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Souvenir reedwood',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    8,
    'debit',
    'SOUVENIR REEDWOOD'
  );

  -- Five Spice (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Five Spice',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    4.98,
    'debit',
    'FIVE SPICE'
  );

  -- Phone (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Phone',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    85,
    'debit',
    'PHONE'
  );

  -- Panipuri (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Panipuri',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    6.54,
    'debit',
    'PANIPURI'
  );

  -- Shelldance orchids (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Shelldance orchids',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    18.56,
    'debit',
    'SHELLDANCE ORCHIDS'
  );

  -- Eternal Tree house (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Eternal Tree house',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    8.65,
    'debit',
    'ETERNAL TREE HOUSE'
  );

  -- Five Spice (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Five Spice',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    10.16,
    'debit',
    'FIVE SPICE'
  );

  -- Wifi (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Wifi',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    90,
    'debit',
    'WIFI'
  );

  -- Pav Bhaji (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Pav Bhaji',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    18.53,
    'debit',
    'PAV BHAJI'
  );

  -- ER (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'ER',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    35.85,
    'debit',
    'ER'
  );

  -- Mojo pizza (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Mojo pizza',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    115.42,
    'debit',
    'MOJO PIZZA'
  );

  -- Apni MAndi (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Apni MAndi',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    35,
    'debit',
    'APNI MANDI'
  );

  -- Utilities (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Utilities',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    147,
    'debit',
    'UTILITIES'
  );

  -- David''s bagels (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'David''s bagels',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    17.48,
    'debit',
    'DAVID''S BAGELS'
  );

  -- Car cleaning (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Car cleaning',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    16,
    'debit',
    'CAR CLEANING'
  );

  -- Drive through tree park (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Drive through tree park',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    18.36,
    'debit',
    'DRIVE THROUGH TREE PARK'
  );

  -- Whole foods (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Whole foods',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    23.57,
    'debit',
    'WHOLE FOODS'
  );

  -- parlor (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'parlor',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    170,
    'debit',
    'PARLOR'
  );

  -- Ghirardelli (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Ghirardelli',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    13.17,
    'debit',
    'GHIRARDELLI'
  );

  -- Vivek flowers (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Vivek flowers',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    16.54,
    'debit',
    'VIVEK FLOWERS'
  );

  -- Drive through tree park (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Drive through tree park',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    15,
    'debit',
    'DRIVE THROUGH TREE PARK'
  );

  -- Whole foods (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Whole foods',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    23.09,
    'debit',
    'WHOLE FOODS'
  );

  -- Badminton (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Badminton',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    55,
    'debit',
    'BADMINTON'
  );

  -- Swathi tiffin (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Swathi tiffin',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    27.84,
    'debit',
    'SWATHI TIFFIN'
  );

  -- Vivek flowers (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Vivek flowers',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    91.19,
    'debit',
    'VIVEK FLOWERS'
  );

  -- Accomodation (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Accomodation',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    405,
    'debit',
    'ACCOMODATION'
  );

  -- Costco (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Costco',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    182,
    'debit',
    'COSTCO'
  );

  -- Tesla insurance (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Tesla insurance',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    190,
    'debit',
    'TESLA INSURANCE'
  );

  -- Basket bagels cafe (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Basket bagels cafe',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    24.42,
    'debit',
    'BASKET BAGELS CAFE'
  );

  -- Kitchen set anaisha (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Kitchen set anaisha',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    48.11,
    'debit',
    'KITCHEN SET ANAISHA'
  );

  -- Costco pharma (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Costco pharma',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    3.59,
    'debit',
    'COSTCO PHARMA'
  );

  -- renters insurance (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'renters insurance',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    17.75,
    'debit',
    'RENTERS INSURANCE'
  );

  -- Pani puri (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Pani puri',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    13.07,
    'debit',
    'PANI PURI'
  );

  -- Michael Kors (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Michael Kors',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    6.13,
    'debit',
    'MICHAEL KORS'
  );

  -- Safeway (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Safeway',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    11.48,
    'debit',
    'SAFEWAY'
  );

  -- gpt (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'gpt',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    20,
    'debit',
    'GPT'
  );

  -- Deccan morsel (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Deccan morsel',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    34.69,
    'debit',
    'DECCAN MORSEL'
  );

  -- Tennis (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Tennis',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    820,
    'debit',
    'TENNIS'
  );

  -- Whole foods (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Whole foods',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    13.27,
    'debit',
    'WHOLE FOODS'
  );

  -- car loan (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'car loan',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    1000,
    'debit',
    'CAR LOAN'
  );

  -- Paris baguette (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Paris baguette',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    56,
    'debit',
    'PARIS BAGUETTE'
  );

  -- UPS Store (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'UPS Store',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    34.38,
    'debit',
    'UPS STORE'
  );

  -- Market at NP (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Market at NP',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    3.49,
    'debit',
    'MARKET AT NP'
  );

  -- Tessie (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Tessie',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    5,
    'debit',
    'TESSIE'
  );

  -- Eylan (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Eylan',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    114,
    'debit',
    'EYLAN'
  );

  -- Target (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Target',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    70.63,
    'debit',
    'TARGET'
  );

  -- Five Spice (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Five Spice',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    16.76,
    'debit',
    'FIVE SPICE'
  );

  -- Lansum (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Lansum',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    2000,
    'debit',
    'LANSUM'
  );

  -- Parikh HEalth (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Parikh HEalth',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    120,
    'debit',
    'PARIKH HEALTH'
  );

  -- Safeway (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Safeway',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    1.77,
    'debit',
    'SAFEWAY'
  );

  -- Education loan (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Education loan',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    500,
    'debit',
    'EDUCATION LOAN'
  );

  -- Dogpatch puzzle (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Dogpatch puzzle',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    40,
    'debit',
    'DOGPATCH PUZZLE'
  );

  -- CVS (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'CVS',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    7.97,
    'debit',
    'CVS'
  );

  -- HairCut (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'HairCut',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    28.75,
    'debit',
    'HAIRCUT'
  );

  -- SFO airport parking (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'SFO airport parking',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    16,
    'debit',
    'SFO AIRPORT PARKING'
  );

  -- Five Spice (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Five Spice',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    9.94,
    'debit',
    'FIVE SPICE'
  );

  -- SF Gardens (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'SF Gardens',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    75,
    'debit',
    'SF GARDENS'
  );

  -- Walmart (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Walmart',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    7.68,
    'debit',
    'WALMART'
  );

  -- Cinemark (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Cinemark',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    17.98,
    'debit',
    'CINEMARK'
  );

  -- Five Spice (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Five Spice',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    53.44,
    'debit',
    'FIVE SPICE'
  );

  -- Stylevana (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Stylevana',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    36,
    'debit',
    'STYLEVANA'
  );

  -- Costco (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Costco',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    672.23,
    'debit',
    'COSTCO'
  );

  -- Fastrak (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Fastrak',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    25,
    'debit',
    'FASTRAK'
  );

  -- Five Spice (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Five Spice',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    1.41,
    'debit',
    'FIVE SPICE'
  );

  -- Tesla internet (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Tesla internet',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    100,
    'debit',
    'TESLA INTERNET'
  );

  -- Grocery outlet (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Grocery outlet',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    10.93,
    'debit',
    'GROCERY OUTLET'
  );

  -- Uber trips to Q diag (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Uber trips to Q diag',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    28,
    'debit',
    'UBER TRIPS TO Q DIAG'
  );

  -- Costco (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Costco',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    61.02,
    'debit',
    'COSTCO'
  );

  -- Tesla tires (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Tesla tires',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    373.59,
    'debit',
    'TESLA TIRES'
  );

  -- Whole foods (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-08-15'::date,
    'Whole foods',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    24.45,
    'debit',
    'WHOLE FOODS'
  );

  -- Rent (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Rent',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    3015,
    'debit',
    'RENT'
  );

  -- Falaknuma (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Falaknuma',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    11.03,
    'debit',
    'FALAKNUMA'
  );

  -- Candlelight music (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Candlelight music',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    108.16,
    'debit',
    'CANDLELIGHT MUSIC'
  );

  -- Alaska airlines aus to sfo (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Alaska airlines aus to sfo',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    196.6,
    'debit',
    'ALASKA AIRLINES AUS TO SFO'
  );

  -- Costco (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Costco',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    61.22,
    'debit',
    'COSTCO'
  );

  -- Phone (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Phone',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    80,
    'debit',
    'PHONE'
  );

  -- In n Out (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'In n Out',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    3.94,
    'debit',
    'IN N OUT'
  );

  -- UPS notaries (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'UPS notaries',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    102.42,
    'debit',
    'UPS NOTARIES'
  );

  -- Saks (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Saks',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    8,
    'debit',
    'SAKS'
  );

  -- Five spice (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Five spice',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    9.18,
    'debit',
    'FIVE SPICE'
  );

  -- Wifi (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Wifi',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    55.32,
    'debit',
    'WIFI'
  );

  -- In n Out (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'In n Out',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    7.87,
    'debit',
    'IN N OUT'
  );

  -- Passport (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Passport',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    79.89,
    'debit',
    'PASSPORT'
  );

  -- Lulu (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Lulu',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    3,
    'debit',
    'LULU'
  );

  -- Five spice (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Five spice',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    4.38,
    'debit',
    'FIVE SPICE'
  );

  -- Utilities (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Utilities',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    147,
    'debit',
    'UTILITIES'
  );

  -- Ramen nagi (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Ramen nagi',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    41.74,
    'debit',
    'RAMEN NAGI'
  );

  -- Virgin experience (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Virgin experience',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    88,
    'debit',
    'VIRGIN EXPERIENCE'
  );

  -- Hawaii flights (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Hawaii flights',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    754.8,
    'debit',
    'HAWAII FLIGHTS'
  );

  -- Apni Mandi (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Apni Mandi',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    54.05,
    'debit',
    'APNI MANDI'
  );

  -- Tesla insurance (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Tesla insurance',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    190,
    'debit',
    'TESLA INSURANCE'
  );

  -- Paris baguette (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Paris baguette',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    45.99,
    'debit',
    'PARIS BAGUETTE'
  );

  -- Tax payment (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Tax payment',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    1423.74,
    'debit',
    'TAX PAYMENT'
  );

  -- Costco (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Costco',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    105.65,
    'debit',
    'COSTCO'
  );

  -- renters insurance (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'renters insurance',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    17.75,
    'debit',
    'RENTERS INSURANCE'
  );

  -- Paris baguette (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Paris baguette',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    5.5,
    'debit',
    'PARIS BAGUETTE'
  );

  -- Service fee (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Service fee',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    24.92,
    'debit',
    'SERVICE FEE'
  );

  -- Five spice (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Five spice',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    3.13,
    'debit',
    'FIVE SPICE'
  );

  -- gpt (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'gpt',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    20,
    'debit',
    'GPT'
  );

  -- Pani puri (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Pani puri',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    13.07,
    'debit',
    'PANI PURI'
  );

  -- Cinemark (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Cinemark',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    37.98,
    'debit',
    'CINEMARK'
  );

  -- Five spice (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Five spice',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    3.13,
    'debit',
    'FIVE SPICE'
  );

  -- car loan (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'car loan',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    1000,
    'debit',
    'CAR LOAN'
  );

  -- Custom cut butcher (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Custom cut butcher',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    16.72,
    'debit',
    'CUSTOM CUT BUTCHER'
  );

  -- Autopia (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Autopia',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    140.85,
    'debit',
    'AUTOPIA'
  );

  -- Five spice (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Five spice',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    28.73,
    'debit',
    'FIVE SPICE'
  );

  -- Tessie (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Tessie',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    5,
    'debit',
    'TESSIE'
  );

  -- milkshake (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'milkshake',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    8.5,
    'debit',
    'MILKSHAKE'
  );

  -- Target (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Target',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    13.77,
    'debit',
    'TARGET'
  );

  -- Apni Mandi (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Apni Mandi',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    46.3,
    'debit',
    'APNI MANDI'
  );

  -- Lansum (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Lansum',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    2000,
    'debit',
    'LANSUM'
  );

  -- Pani puri (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Pani puri',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    13.07,
    'debit',
    'PANI PURI'
  );

  -- ER (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'ER',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    35.85,
    'debit',
    'ER'
  );

  -- Whole foods (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Whole foods',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    42.72,
    'debit',
    'WHOLE FOODS'
  );

  -- Education loan (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Education loan',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    500,
    'debit',
    'EDUCATION LOAN'
  );

  -- Ananda bhavan (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Ananda bhavan',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    18.5,
    'debit',
    'ANANDA BHAVAN'
  );

  -- Chase centre (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Chase centre',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    37.04,
    'debit',
    'CHASE CENTRE'
  );

  -- Whole foods (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Whole foods',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    55.26,
    'debit',
    'WHOLE FOODS'
  );

  -- HairCut (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'HairCut',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    28.75,
    'debit',
    'HAIRCUT'
  );

  -- Bagels (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Bagels',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    24.5,
    'debit',
    'BAGELS'
  );

  -- Towing (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Towing',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    510,
    'debit',
    'TOWING'
  );

  -- Whole foods (Groceries)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Whole foods',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Groceries' LIMIT 1),
    10.9,
    'debit',
    'WHOLE FOODS'
  );

  -- Juut hair cut (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Juut hair cut',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    155,
    'debit',
    'JUUT HAIR CUT'
  );

  -- Curry up now (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Curry up now',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    48.95,
    'debit',
    'CURRY UP NOW'
  );

  -- DMV (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'DMV',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    46,
    'debit',
    'DMV'
  );

  -- Ny times (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Ny times',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    4,
    'debit',
    'NY TIMES'
  );

  -- Chipotle (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Chipotle',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    22.92,
    'debit',
    'CHIPOTLE'
  );

  -- Target (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Target',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    12.46,
    'debit',
    'TARGET'
  );

  -- WSJ (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'WSJ',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    7,
    'debit',
    'WSJ'
  );

  -- Pani puri (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Pani puri',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    13.07,
    'debit',
    'PANI PURI'
  );

  -- Parking (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Parking',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    2,
    'debit',
    'PARKING'
  );

  -- PGE (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'PGE',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    181.28,
    'debit',
    'PGE'
  );

  -- Pani puri (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Pani puri',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    13.07,
    'debit',
    'PANI PURI'
  );

  -- Cab (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Cab',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    12.97,
    'debit',
    'CAB'
  );

  -- Chat GPT (Bills & Utilities)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Chat GPT',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Bills & Utilities' LIMIT 1),
    186.02,
    'debit',
    'CHAT GPT'
  );

  -- Indian pizza (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Indian pizza',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    22.98,
    'debit',
    'INDIAN PIZZA'
  );

  -- Claude (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Claude',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    20,
    'debit',
    'CLAUDE'
  );

  -- Pani puri (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Pani puri',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    13.07,
    'debit',
    'PANI PURI'
  );

  -- Target (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Target',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    10.93,
    'debit',
    'TARGET'
  );

  -- Nagas kitchen (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Nagas kitchen',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    31.95,
    'debit',
    'NAGAS KITCHEN'
  );

  -- Raley''s (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Raley''s',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    1.31,
    'debit',
    'RALEY''S'
  );

  -- Office food (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Office food',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    9,
    'debit',
    'OFFICE FOOD'
  );

  -- VFS service (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'VFS service',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    19.71,
    'debit',
    'VFS SERVICE'
  );

  -- Paradise (Food & Dining)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Paradise',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Food & Dining' LIMIT 1),
    31.75,
    'debit',
    'PARADISE'
  );

  -- Quest (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Quest',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    45.96,
    'debit',
    'QUEST'
  );

  -- DMV (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'DMV',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    46,
    'debit',
    'DMV'
  );

  -- Blueprint Protein (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Blueprint Protein',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    97.66,
    'debit',
    'BLUEPRINT PROTEIN'
  );

  -- Safeway (Shopping)
  INSERT INTO transactions (user_id, account_id, date, description, category_id, amount, type, merchant_name)
  VALUES (
    v_user_id,
    v_account_id,
    '2025-09-15'::date,
    'Safeway',
    (SELECT id FROM categories WHERE user_id = v_user_id AND name = 'Shopping' LIMIT 1),
    17.45,
    'debit',
    'SAFEWAY'
  );

END $$;

SELECT COUNT(*) as imported_count FROM transactions WHERE user_id = auth.uid();
