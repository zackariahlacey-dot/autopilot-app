'use server';

type NHTSARecall = {
  NHTSACampaignNumber: string;
  Manufacturer: string;
  Subject: string;
  Component: string;
  Summary: string;
  Consequence: string;
  Remedy: string;
  ReportReceivedDate: string;
};

export async function fetchSafetyRecalls(make: string, model: string, year: number) {
  try {
    // Clean and validate parameters
    const cleanMake = make?.trim() || '';
    const cleanModel = model?.trim() || '';
    const cleanYear = year || 0;

    // Validate inputs
    if (!cleanMake || !cleanModel || cleanYear < 1900 || cleanYear > new Date().getFullYear() + 1) {
      console.warn('Invalid vehicle parameters for recall fetch:', { make: cleanMake, model: cleanModel, year: cleanYear });
      return { 
        success: true, 
        recalls: [] 
      };
    }

    // Build URL with properly encoded parameters and format=json
    const url = `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodeURIComponent(cleanMake)}&model=${encodeURIComponent(cleanModel)}&modelYear=${encodeURIComponent(cleanYear.toString())}&format=json`;
    
    console.log('Fetching recalls from NHTSA:', url);

    const response = await fetch(url, {
      next: { revalidate: 86400 }, // Cache for 24 hours
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    // Graceful failure - log but don't throw
    if (!response.ok) {
      console.warn(`NHTSA API returned status ${response.status} for ${cleanMake} ${cleanModel} ${cleanYear}`);
      return { 
        success: true, 
        recalls: [] 
      };
    }

    const data = await response.json();
    
    // Validate response structure
    if (data.results && Array.isArray(data.results)) {
      console.log(`Found ${data.results.length} recalls for ${cleanMake} ${cleanModel} ${cleanYear}`);
      return {
        success: true,
        recalls: data.results as NHTSARecall[],
      };
    }

    // Valid response but no results
    console.log(`No recalls found for ${cleanMake} ${cleanModel} ${cleanYear}`);
    return { success: true, recalls: [] };

  } catch (error) {
    // Catch all errors including network timeouts, CORS issues, etc.
    console.warn('Error fetching NHTSA recalls:', error);
    
    // Return empty array instead of crashing the page
    return { 
      success: true, 
      recalls: []
    };
  }
}
