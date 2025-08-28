// Configuration file for API keys and environment variables
export const config = {
  wetravel: {
    apiKey: process.env.WETRAVEL_API_KEY || 'eyJraWQiOiJkNjFiYzMxMiIsImFsZyI6IkVTMjU2In0.eyJpZCI6ODMzODkxLCJ2ZXIiOjUsInB1YiI6dHJ1ZSwic2NvcGVzIjpbInJ3OmFsbCJdLCJleHAiOjIwNzE4NzIwMDAsImp0aSI6IjZlYmUxNzNmLTVkYmUtNDYxYS05NWNlLWYwZmRkMjBhYmQxYyIsImtpbmQiOiJyZWZyZXNoIiwic2JkIjpudWxsfQ.mWX68Hh4rkM-vDpB1JevInkiJnFIr1YFS0ax9mNMQWQLLYlyy84vp0CuURP0OD7aA5OONJnqZyM5pq-NE5bB5Q',
    authUrl: 'https://api.wetravel.com/v2/auth/tokens/access',
    apiUrl: 'https://api.wetravel.com/v2/payment_links',
  },
  // Add other API configurations here if needed
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
  },
  nowpayments: {
    apiKey: process.env.NOWPAYMENTS_API_KEY || '',
  },
};

// Helper function to check if required config is present
export const isConfigValid = () => {
  const requiredKeys = [
    config.wetravel.apiKey,
  ];
  
  return requiredKeys.every(key => key && key.length > 0);
};

// Function to get WeTravel access token
export const getWeTravelAccessToken = async (): Promise<string> => {
  try {
    console.log('🔑 Getting WeTravel access token...');
    
    const response = await fetch(config.wetravel.authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.wetravel.apiKey}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error getting WeTravel access token:', errorData);
      throw new Error(`Failed to get access token: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ WeTravel access token obtained successfully');
    
    // Return the access token from the response
    return data.access_token || data.token || data.accessToken;
  } catch (error) {
    console.error('❌ Error in getWeTravelAccessToken:', error);
    throw error;
  }
};
