'use server';

import { createClient } from '@/lib/supabase/server';

type UnclaimedBusiness = {
  name: string;
  category: string;
  address: string;
  is_verified: boolean;
};

// LA/Pasadena area businesses
const UNCLAIMED_BUSINESSES: UnclaimedBusiness[] = [
  // Gas Stations
  { name: 'Shell Gas Station - Colorado Blvd', category: 'gas_station', address: '1234 E Colorado Blvd, Pasadena, CA 91106', is_verified: false },
  { name: 'Chevron - Lake Ave', category: 'gas_station', address: '890 N Lake Ave, Pasadena, CA 91104', is_verified: false },
  { name: '76 Gas Station - Foothill Blvd', category: 'gas_station', address: '2456 E Foothill Blvd, Pasadena, CA 91107', is_verified: false },
  { name: 'ARCO - Fair Oaks Ave', category: 'gas_station', address: '567 N Fair Oaks Ave, Pasadena, CA 91103', is_verified: false },
  
  // Car Washes
  { name: 'Rose Bowl Car Wash', category: 'detailing', address: '1001 Rose Bowl Dr, Pasadena, CA 91103', is_verified: false },
  { name: 'Sparkle Auto Spa', category: 'detailing', address: '3456 E Foothill Blvd, Pasadena, CA 91107', is_verified: false },
  { name: 'Premium Shine Car Wash', category: 'detailing', address: '789 S Lake Ave, Pasadena, CA 91101', is_verified: false },
  { name: 'Sierra Madre Car Wash', category: 'detailing', address: '456 W Sierra Madre Blvd, Sierra Madre, CA 91024', is_verified: false },
  
  // Oil Change Shops
  { name: 'Jiffy Lube - Pasadena', category: 'oil_change', address: '2100 E Foothill Blvd, Pasadena, CA 91107', is_verified: false },
  { name: 'Valvoline Instant Oil Change', category: 'oil_change', address: '1234 N Allen Ave, Pasadena, CA 91104', is_verified: false },
  { name: 'Take 5 Oil Change', category: 'oil_change', address: '890 E Colorado Blvd, Pasadena, CA 91101', is_verified: false },
  
  // Tire Shops
  { name: 'Discount Tire - Pasadena', category: 'tire_shop', address: '3456 E Colorado Blvd, Pasadena, CA 91107', is_verified: false },
  { name: 'Big O Tires', category: 'tire_shop', address: '567 S Arroyo Pkwy, Pasadena, CA 91105', is_verified: false },
  { name: 'America\'s Tire', category: 'tire_shop', address: '1234 N Lake Ave, Pasadena, CA 91104', is_verified: false },
  { name: 'Pep Boys Tire & Service', category: 'tire_shop', address: '789 E Walnut St, Pasadena, CA 91101', is_verified: false },
  
  // Mechanics
  { name: 'Pasadena Auto Repair', category: 'mechanic', address: '2345 E Washington Blvd, Pasadena, CA 91104', is_verified: false },
  { name: 'Foothill Auto Service', category: 'mechanic', address: '4567 N Rosemead Blvd, Pasadena, CA 91107', is_verified: false },
  { name: 'Colorado Street Garage', category: 'mechanic', address: '890 E Colorado Blvd, Pasadena, CA 91101', is_verified: false },
  { name: 'Highland Park Auto Shop', category: 'mechanic', address: '5678 York Blvd, Los Angeles, CA 90042', is_verified: false },
  { name: 'Eagle Rock Complete Car Care', category: 'mechanic', address: '1234 Colorado Blvd, Eagle Rock, CA 90041', is_verified: false },
];

export async function seedMarketplace() {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth error:', authError);
      return { error: `Authentication failed: ${authError.message}` };
    }

    if (!user) {
      console.error('No user found in session');
      return { error: 'You must be logged in to seed the marketplace' };
    }

    console.log('Seeding marketplace for user:', user.id);

    // Check if businesses already exist to avoid duplicates
    const { data: existingBusinesses, error: checkError } = await supabase
      .from('businesses')
      .select('name')
      .in('name', UNCLAIMED_BUSINESSES.map(b => b.name));

    if (checkError) {
      console.error('Error checking existing businesses:', checkError);
      return { error: `Failed to check existing businesses: ${checkError.message}` };
    }

    if (existingBusinesses && existingBusinesses.length > 0) {
      console.warn(`Found ${existingBusinesses.length} existing businesses`);
      return { 
        error: `Some businesses already exist (${existingBusinesses.length}). Clear them first or modify seed data.`,
        existing: existingBusinesses.length 
      };
    }

    console.log(`Attempting to insert ${UNCLAIMED_BUSINESSES.length} unclaimed businesses...`);

    // Insert unclaimed businesses with owner_id as NULL
    const { data, error: insertError } = await supabase
      .from('businesses')
      .insert(UNCLAIMED_BUSINESSES.map(business => ({
        name: business.name,
        category: business.category,
        address: business.address,
        is_verified: business.is_verified,
        owner_id: null, // Unclaimed businesses have no owner
      })))
      .select();

    if (insertError) {
      console.error('Database insert error:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
      });
      
      // Provide more specific error messages
      if (insertError.code === '42501') {
        return { error: 'Permission denied. RLS policy may be blocking inserts. Check Supabase RLS policies for businesses table.' };
      }
      
      if (insertError.code === '23505') {
        return { error: 'Duplicate entry detected. Some businesses may already exist.' };
      }
      
      return { error: `Database error: ${insertError.message} (Code: ${insertError.code})` };
    }

    const insertedCount = data?.length || 0;
    console.log(`✅ Successfully inserted ${insertedCount} unclaimed businesses`);

    return { 
      success: true, 
      count: insertedCount,
      message: `Successfully seeded ${insertedCount} unclaimed businesses!` 
    };

  } catch (error) {
    console.error('Unexpected error in seedMarketplace:', error);
    return { 
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}
