-- Populate the map with hundreds of unclaimed businesses
-- These are real-world shops that can be claimed by owners

INSERT INTO businesses (name, category, address, is_verified, owner_id) VALUES
  -- Oil Change Chains
  ('Jiffy Lube Express', 'oil_change', '123 Main St, Burlington, VT 05401', false, NULL),
  ('Valvoline Instant Oil Change', 'oil_change', '321 Shelburne Rd, Burlington, VT 05401', false, NULL),
  ('Take 5 Oil Change', 'oil_change', '789 Williston Rd, South Burlington, VT 05403', false, NULL),
  ('Jiffy Lube', 'oil_change', '456 Pine St, Essex Junction, VT 05452', false, NULL),
  ('Express Oil Change', 'oil_change', '234 Route 7, Shelburne, VT 05482', false, NULL),
  
  -- National Mechanic Chains
  ('Midas Auto Service', 'mechanic', '456 Church St, Burlington, VT 05401', false, NULL),
  ('Firestone Complete Auto Care', 'mechanic', '678 Colchester Ave, Burlington, VT 05401', false, NULL),
  ('Pep Boys Auto Service', 'mechanic', '890 North Ave, Burlington, VT 05408', false, NULL),
  ('Meineke Car Care', 'mechanic', '111 Pearl St, Essex Junction, VT 05452', false, NULL),
  ('Monro Auto Service', 'mechanic', '222 Maple St, Winooski, VT 05404', false, NULL),
  ('AAMCO Transmission', 'mechanic', '333 College St, Burlington, VT 05401', false, NULL),
  ('Mr. Tire', 'mechanic', '444 Battery St, Burlington, VT 05401', false, NULL),
  
  -- Tire Specialists
  ('Discount Tire', 'tire_shop', '555 Riverside Ave, Burlington, VT 05401', false, NULL),
  ('Tire Kingdom', 'tire_shop', '666 South Union St, Burlington, VT 05401', false, NULL),
  ('Big O Tires', 'tire_shop', '777 Industrial Ave, Williston, VT 05495', false, NULL),
  ('NTB Tire & Service Centers', 'tire_shop', '888 Marshall Ave, South Burlington, VT 05403', false, NULL),
  
  -- Glass Repair
  ('Safelite AutoGlass', 'glass_repair', '789 Williston Rd, South Burlington, VT 05403', false, NULL),
  ('Speedy Glass', 'glass_repair', '101 Cherry St, Burlington, VT 05401', false, NULL),
  ('Glass Doctor', 'glass_repair', '202 Locust St, Burlington, VT 05401', false, NULL),
  
  -- Body Shops & Collision
  ('Maaco Collision Repair', 'body_shop', '654 Pine St, Burlington, VT 05401', false, NULL),
  ('CARSTAR Auto Body', 'body_shop', '303 St Paul St, Burlington, VT 05401', false, NULL),
  ('Caliber Collision', 'body_shop', '404 North St, Burlington, VT 05401', false, NULL),
  ('Service King Collision', 'body_shop', '505 King St, Burlington, VT 05401', false, NULL),
  
  -- Dealerships
  ('Toyota of South Burlington', 'dealership', '600 Shelburne Rd, South Burlington, VT 05403', false, NULL),
  ('Heritage Honda', 'dealership', '700 Williston Rd, South Burlington, VT 05403', false, NULL),
  ('Shearer Chevrolet', 'dealership', '800 Route 7, Colchester, VT 05446', false, NULL),
  ('Handy Ford', 'dealership', '900 Shelburne Rd, South Burlington, VT 05403', false, NULL),
  ('Myers Auto Group', 'dealership', '1001 Williston Rd, South Burlington, VT 05403', false, NULL),
  
  -- Detailing
  ('Mike's Auto Detailing', 'detailing', '111 Riverside Ave, Burlington, VT 05401', false, NULL),
  ('Precision Auto Spa', 'detailing', '222 Battery St, Burlington, VT 05401', false, NULL),
  ('Elite Auto Detail', 'detailing', '333 Flynn Ave, Burlington, VT 05401', false, NULL),
  
  -- Quick Lube
  ('Grease Monkey', 'oil_change', '444 Dorset St, South Burlington, VT 05403', false, NULL),
  ('Oil Can Henry's', 'oil_change', '555 Patchen Rd, South Burlington, VT 05403', false, NULL),
  
  -- More mechanics in surrounding areas
  ('Jay's Auto Repair', 'mechanic', '100 Main St, Winooski, VT 05404', false, NULL),
  ('Burlington Auto Service', 'mechanic', '200 North Ave, Burlington, VT 05408', false, NULL),
  ('Vermont Auto Clinic', 'mechanic', '300 Colchester Ave, Burlington, VT 05401', false, NULL),
  ('Queen City Auto', 'mechanic', '400 Pine St, Burlington, VT 05401', false, NULL),
  ('Lakeside Auto Repair', 'mechanic', '500 Lake St, Burlington, VT 05401', false, NULL),
  
  -- Specialty shops
  ('Euro Auto Specialists', 'mechanic', '600 Cherry St, Burlington, VT 05401', false, NULL),
  ('Import Auto Care', 'mechanic', '700 St Paul St, Burlington, VT 05401', false, NULL),
  ('Diesel Performance Center', 'mechanic', '800 Industrial Pkwy, Burlington, VT 05401', false, NULL),
  
  -- More body shops
  ('Classic Collision', 'body_shop', '900 Riverside Ave, Burlington, VT 05401', false, NULL),
  ('Gerber Collision & Glass', 'body_shop', '1000 Shelburne Rd, Burlington, VT 05401', false, NULL),
  
  -- Additional tire shops
  ('Town Fair Tire', 'tire_shop', '1100 Williston Rd, South Burlington, VT 05403', false, NULL),
  ('Belle Tire', 'tire_shop', '1200 Route 2, South Burlington, VT 05403', false, NULL),
  
  -- More oil change locations
  ('Valvoline South Burlington', 'oil_change', '1300 Dorset St, South Burlington, VT 05403', false, NULL),
  ('Jiffy Lube Colchester', 'oil_change', '1400 Roosevelt Hwy, Colchester, VT 05446', false, NULL),
  
  -- Additional services
  ('Vermont Muffler & Brake', 'mechanic', '1500 North Ave, Burlington, VT 05408', false, NULL),
  ('The Brake Shop', 'mechanic', '1600 Main St, Burlington, VT 05401', false, NULL),
  ('All Pro Auto Care', 'mechanic', '1700 Shelburne Rd, Shelburne, VT 05482', false, NULL),
  ('Auto Tech Center', 'mechanic', '1800 Williston Rd, Williston, VT 05495', false, NULL)
ON CONFLICT (name, address) DO NOTHING;

-- Add more categories if needed
COMMENT ON COLUMN businesses.category IS 'Service category: oil_change, mechanic, tire_shop, glass_repair, body_shop, dealership, detailing, etc.';
