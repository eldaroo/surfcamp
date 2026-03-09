// Configuration file for API keys and environment variables
export const config = {
  wetravel: {
    apiKey: process.env.WETRAVEL_API_KEY || '',
    authUrl: process.env.WETRAVEL_AUTH_URL || 'https://api.wetravel.com/v2/auth/tokens/access',
    apiUrl: process.env.WETRAVEL_API_URL || 'https://api.wetravel.com/v2/payment_links',
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
  return Boolean(config.wetravel.apiKey);
};

// Function to get WeTravel access token
export const getWeTravelAccessToken = async (): Promise<string> => {
  try {
    if (!config.wetravel.apiKey) {
      throw new Error('WETRAVEL_API_KEY is not configured');
    }

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
