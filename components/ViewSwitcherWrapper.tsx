'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import ViewSwitcher from './ViewSwitcher';

export default function ViewSwitcherWrapper() {
  const [hasVehicles, setHasVehicles] = useState(false);
  const [hasBusiness, setHasBusiness] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkUserData = async () => {
      try {
  // Hardcoded credentials for immediate connection
  const supabase = createBrowserClient(
    'https://cbtcfobuigwrmtnailsl.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNidGNmb2J1aWd3cm10bmFpbHNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5OTMxOTAsImV4cCI6MjA4NjU2OTE5MH0.2485jYTORG42yNm0FKkA_P7UsWc66Y5FsxGSbUGLric'
  );
  console.log('Supabase Connected Manually');
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setIsLoading(false);
          return;
        }

        // Check for vehicles
        const { data: vehicles } = await supabase
          .from('vehicles')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);
        
        // Check for business
        const { data: business } = await supabase
          .from('businesses')
          .select('id')
          .eq('owner_id', user.id)
          .limit(1);
        
        setHasVehicles((vehicles && vehicles.length > 0) || false);
        setHasBusiness((business && business.length > 0) || false);
      } catch (error) {
        console.error('Error checking user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserData();
  }, []);

  if (isLoading || (!hasVehicles && !hasBusiness)) {
    return null;
  }

  return <ViewSwitcher hasVehicles={hasVehicles} hasBusiness={hasBusiness} />;
}
