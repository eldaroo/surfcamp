import axios, { AxiosResponse } from 'axios';
import { LobbyPMSBooking } from '@/types';

// LobbyPMS API Configuration - REAL CREDENTIALS
const LOBBYPMS_BASE_URL = process.env.LOBBYPMS_API_URL || 'https://api.lobbypms.com/api/v1';
const LOBBYPMS_API_TOKEN = process.env.LOBBYPMS_API_KEY || 'JNjeoLeXxTHFQSwUPQCgwBnCZktRVv7pfQ48uz2tyoNu6K9dW6D2US1cN9Mu';

export interface LobbyPMSRoom {
  id: string;
  name: string;
  room_type_id?: string;
  room_type_name?: string;
  available_rooms?: number;
  price_per_night?: number; // Made optional instead of requiring number
  rate?: number; // Made optional instead of requiring number
  capacity?: number;
}

export class LobbyPMSClient {
  private baseURL: string;
  private apiToken: string;

  constructor(baseURL = LOBBYPMS_BASE_URL, apiToken = LOBBYPMS_API_TOKEN) {
    this.baseURL = baseURL;
    this.apiToken = apiToken;
  }

  private buildURL(endpoint: string, additionalParams?: Record<string, string>): string {
    // Remove leading slash from endpoint if present to avoid replacing the entire path
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    
    // Ensure baseURL ends with slash for proper concatenation
    const baseUrl = this.baseURL.endsWith('/') ? this.baseURL : this.baseURL + '/';
    
    const url = new URL(cleanEndpoint, baseUrl);
    url.searchParams.set('api_token', this.apiToken);
    
    if (additionalParams) {
      Object.entries(additionalParams).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }
    
    console.log('🔧 URL BUILD DEBUG:', {
      originalEndpoint: endpoint,
      cleanEndpoint: cleanEndpoint,
      baseUrl: baseUrl,
      finalUrl: url.toString()
    });
    
    return url.toString();
  }

  /**
   * Get available rooms
   */
  async getRooms(params?: {
    arrival_date?: string;
    departure_date?: string;
    guest_count?: string;
  }): Promise<LobbyPMSRoom[]> {
    try {
      const finalUrl = this.buildURL('/rooms', params);
      
      console.log('🔍 ===== URL CONSTRUCTION ANALYSIS =====');
      console.log('🔍 Base URL:', this.baseURL);
      console.log('🔍 API Token:', this.apiToken);
      console.log('🔍 Endpoint:', '/rooms');
      console.log('🔍 Params:', params);
      console.log('🔍 Final constructed URL:', finalUrl);
      console.log('🔍 ===== COMPARISON =====');
      console.log('🔍 Working Postman URL: https://api.lobbypms.com/api/v1/rooms?api_token=JNjeoLeXxTHFQSwUPQCgwBnCZktRVv7pfQ48uz2tyoNu6K9dW6D2US1cN9Mu');
      console.log('🔍 App constructed URL:', finalUrl);
      console.log('🔍 URLs match:', finalUrl === 'https://api.lobbypms.com/api/v1/rooms?api_token=JNjeoLeXxTHFQSwUPQCgwBnCZktRVv7pfQ48uz2tyoNu6K9dW6D2US1cN9Mu');
      
      // First try with params, then without if no results
      let response: AxiosResponse<{data: any[]}>;
      let responseData;
      
      try {
        console.log('🚀 Making request to:', finalUrl);
        response = await axios.get(finalUrl, { 
                  timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'SurfCampSantaTeresa/1.0'
        }
      });
        
        responseData = response.data;
        console.log('📥 Response received - Status:', response.status);
        console.log('📥 Response Content-Type:', response.headers['content-type']);
        console.log('📥 Response Data Type:', typeof responseData);
        console.log('📥 Response Size:', JSON.stringify(responseData).length, 'characters');
        
        // Check if response is HTML
        if (typeof responseData === 'string' && (responseData as string).includes('<!doctype html>')) {
          console.log('🚨 ===== CRITICAL ERROR: HTML RESPONSE =====');
          console.log('🚨 Expected: JSON data');
          console.log('🚨 Received: HTML page');
          console.log('🚨 This means the API endpoint is not working correctly');
          console.log('🚨 Possible causes:');
          console.log('   1. Wrong API endpoint URL');
          console.log('   2. Invalid API token');
          console.log('   3. API server routing issue');
          console.log('   4. Authentication/authorization problem');
          console.log('🚨 HTML content (first 300 chars):', (responseData as string).substring(0, 300));
          
          // Extract title from HTML for debugging
          const titleMatch = (responseData as string).match(/<title>(.*?)<\/title>/);
          if (titleMatch) {
            console.log('🚨 HTML Page Title:', titleMatch[1]);
          }
          
          throw new Error('LobbyPMS API returned HTML instead of JSON. This indicates an API endpoint or authentication issue.');
        }
        
        console.log('✅ Valid JSON response received');
        
      } catch (requestError: any) {
        console.error('❌ Request failed:', {
          message: requestError.message,
          status: requestError.response?.status,
          statusText: requestError.response?.statusText,
          url: finalUrl,
          responseType: typeof requestError.response?.data,
          responseLength: requestError.response?.data?.length || 0
        });
        
        // If we had parameters, try without them as fallback
        if (params && Object.keys(params).length > 0) {
          console.log('🔄 Trying without parameters as fallback...');
          const fallbackUrl = this.buildURL('/rooms');
          console.log('🔄 Fallback URL:', fallbackUrl);
          
          response = await axios.get(fallbackUrl, { 
                      timeout: 10000,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'SurfCampSantaTeresa/1.0'
          }
        });
          
          responseData = response.data;
          console.log('📥 Fallback response - Status:', response.status);
          console.log('📥 Fallback response - Content-Type:', response.headers['content-type']);
          console.log('📥 Fallback response - Data Type:', typeof responseData);
          
                     if (typeof responseData === 'string' && (responseData as string).includes('<!doctype html>')) {
             console.log('🚨 Fallback also returned HTML - API endpoint is definitely broken');
             throw new Error('LobbyPMS API consistently returns HTML instead of JSON. API endpoint is not working.');
           }
        } else {
          throw requestError;
        }
      }
      
      console.log('📥 LobbyPMS ROOMS API SUMMARY:');
      console.log('   Status Code:', response.status);
      console.log('   Content-Type:', response.headers['content-type']);
      console.log('   Response Type:', typeof responseData);
      console.log('   Response Size:', JSON.stringify(responseData).length, 'characters');
      console.log('   Has .data property:', !!(responseData && 'data' in responseData));
      console.log('   Categories count:', responseData?.data?.length || 0);
      console.log('   🔍 REQUEST URL:', this.buildURL('/rooms', params));
      console.log('   🔍 REQUEST PARAMS:', params);
      console.log('   🔍 API TOKEN (last 8 chars):', this.apiToken.slice(-8));
      
      // Check if we got HTML instead of JSON
      if (typeof responseData === 'string' && (responseData as string).includes('<!doctype html>')) {
        console.log('❌ CRITICAL: API returned HTML page instead of JSON data');
        console.log('❌ This usually means:');
        console.log('   1. Wrong API endpoint URL');
        console.log('   2. Invalid API token');
        console.log('   3. API server is down');
        console.log('   4. Rate limiting or IP blocking');
        console.log('❌ HTML Title:', (responseData as string).match(/<title>(.*?)<\/title>/)?.[1] || 'No title found');
      }
      
      // Handle the actual API structure: {data: [categories]}
      const categories = responseData?.data || [];
      console.log('📊 Extracted categories:', categories.length);
      
      if (categories.length > 0) {
        console.log('📊 First category structure:', JSON.stringify(categories[0], null, 2));
      }
      
      const rooms: LobbyPMSRoom[] = [];
      
      // Extract rooms from each category
      categories.forEach((category: any, index: number) => {
        console.log(`🏠 Processing category ${index + 1}:`, {
          id: category.category_id,
          name: category.name,
          capacity: category.capacity,
          quantity: category.quantity,
          roomsCount: category.rooms?.length || 0
        });
        
        if (category.rooms && Array.isArray(category.rooms)) {
          // Add the category as a room type - NO FALLBACK PRICES
          const room = {
            id: category.category_id?.toString() || '',
            name: category.name || 'Unknown Room',
            room_type_id: category.category_id?.toString() || '',
            room_type_name: category.name || 'Unknown Room',
            available_rooms: category.quantity || 1,
            capacity: category.capacity || 2,
            price_per_night: undefined, // NO fallback - use real data only
            rate: undefined // NO fallback - use real data only
          };
          
          console.log(`✅ Added room:`, room);
          rooms.push(room);
        } else {
          console.log(`❌ Category ${category.name} has no valid rooms array`);
        }
      });
      
      console.log('🎯 Final rooms array:', rooms.length, 'rooms');
      return rooms;
    } catch (error: any) {
      console.error('❌ LobbyPMS getRooms DETAILED ERROR:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        headers: error.response?.headers,
        data: typeof error.response?.data === 'string' 
          ? (error.response.data as string).substring(0, 200) 
          : error.response?.data,
        stack: error.stack,
        url: this.buildURL('/rooms', params),
        config: {
          baseURL: this.baseURL,
          tokenLastChars: this.apiToken.slice(-8),
          paramsUsed: params
        }
      });

      // Create specific error message based on the error type
      let specificError = `LobbyPMS API Error: ${error.message}`;
      
      if (error.response?.status === 401) {
        specificError = 'Error de autenticación: Token API inválido o expirado';
      } else if (error.response?.status === 403) {
        specificError = 'Error de permisos: No tienes acceso a este recurso';
      } else if (error.response?.status === 404) {
        specificError = 'Error de endpoint: La URL del API no es correcta';
      } else if (error.response?.status === 429) {
        specificError = 'Error de límite: Demasiadas solicitudes, intenta más tarde';
      } else if (error.response?.status >= 500) {
        specificError = 'Error del servidor: El servidor de LobbyPMS está experimentando problemas';
      } else if (error.code === 'ECONNREFUSED') {
        specificError = 'Error de conexión: No se puede conectar al servidor de LobbyPMS';
      } else if (error.code === 'ENOTFOUND') {
        specificError = 'Error de DNS: No se puede resolver la URL del API';
      } else if (error.code === 'ETIMEDOUT') {
        specificError = 'Error de timeout: La solicitud tardó demasiado tiempo';
      }

      // Enhanced error object
      const enhancedError = new Error(specificError);
      (enhancedError as any).originalError = error;
      (enhancedError as any).statusCode = error.response?.status;
      (enhancedError as any).apiUrl = this.buildURL('/rooms', params);
      
      throw enhancedError;
    }
  }

  /**
   * Get booking information
   */
  async getBookings(params?: {
    arrival_date?: string;
    departure_date?: string;
    status?: string;
  }): Promise<LobbyPMSBooking[]> {
    try {
      const response: AxiosResponse<LobbyPMSBooking[]> = await axios.get(
        this.buildURL('/bookings', params),
        { timeout: 10000 }
      );
      return response.data || [];
    } catch (error) {
      console.error('LobbyPMS getBookings error:', error);
      throw error;
    }
  }

  /**
   * Create or ensure a customer exists in LobbyPMS
   */
  async createCustomer(customer: {
    customer_document: string;
    customer_nationality: string;
    name: string;
    surname?: string;
    second_surname?: string;
    phone?: string;
    email?: string;
    note?: string;
    gender?: 'male' | 'female';
    birthdate?: string;
    document_id?: string;
    address?: string;
    activities?: string;
  }): Promise<any> {
    const endpoint = '/customer/1'; // 1 => Persona

    try {
      console.log('🚀 ===== LOBBY PMS CREATE CUSTOMER =====');
      console.log('🚀 Endpoint:', endpoint);
      console.log('🚀 Customer payload:', JSON.stringify(customer, null, 2));

      const finalUrl = this.buildURL(endpoint);
      console.log('🚀 Customer URL:', finalUrl);

      const response = await axios.post(finalUrl, customer, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': 'SurfCampSantaTeresa/1.0'
        },
        timeout: 15000
      });

      console.log('✅ LobbyPMS createCustomer successful:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: any) {
      const responseData = error.response?.data;
      console.error('❌ LobbyPMS createCustomer error:', {
        message: error.message,
        status: error.response?.status,
        data: responseData,
        url: this.buildURL(endpoint)
      });

      if (responseData?.error_code === 'INPUT_PARAMETERS') {
        console.log('ℹ️ LobbyPMS customer may already exist (duplicate document). Continuing.');
        return responseData;
      }

      throw error;
    }
  }

  /**
   * Create a new booking
   */
  async createBooking(booking: LobbyPMSBooking): Promise<LobbyPMSBooking> {
    try {
      console.log('🚀 ===== LOBBY PMS CREATE BOOKING =====');
      console.log('🚀 Endpoint: /bookings');
      console.log('🚀 Booking data:', JSON.stringify(booking, null, 2));
      
      const finalUrl = this.buildURL('/bookings');
      console.log('🚀 Final URL:', finalUrl);
      
      const response: AxiosResponse<LobbyPMSBooking> = await axios.post(
        finalUrl,
        booking,
        {
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'SurfCampSantaTeresa/1.0'
          },
          timeout: 15000
        }
      );
      
      console.log('✅ LobbyPMS createBooking successful:');
      console.log('   Status:', response.status);
      console.log('   Response:', JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error: any) {
      console.error('❌ LobbyPMS createBooking error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseType: typeof error.response?.data,
        responseData: error.response?.data,
        requestData: booking,
        url: this.buildURL('/bookings')
      });
      
      // Check if response is HTML (error page)
      const responseData = error.response?.data;
      if (typeof responseData === 'string' && 
          (responseData.includes('<!doctype html>') || 
           responseData.includes('<html') || 
           responseData.includes('<!DOCTYPE'))) {
        
        const titleMatch = responseData.match(/<title>(.*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : 'Unknown HTML page';
        
        console.error('🚨 LobbyPMS createBooking returned HTML page instead of JSON:');
        console.error('🚨 Page title:', title);
        console.error('🚨 HTML preview:', responseData.substring(0, 300));
        
        throw new Error(`LobbyPMS createBooking API returned HTML page "${title}" instead of JSON - possible IP authorization or API token issue`);
      }
      
      throw error;
    }
  }

  /**
   * Add products/services to a booking
   */
  async addProductsToBooking(bookingId: number | string, items: Array<{ product_id: string; cant: number; inventory_center_id?: string }>): Promise<void> {
    if (!items || items.length === 0) {
      console.log('?,1?,? No items to add to booking. Skipping add-product-service call.');
      return;
    }

    const endpoint = '/booking/add-product-service';
    const finalUrl = this.buildURL(endpoint);
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'SurfCampSantaTeresa/1.0'
    };

    const normalizedItems = items.map((item) => ({
      product_id: item.product_id,
      cant: item.cant,
      ...(item.inventory_center_id ? { inventory_center_id: item.inventory_center_id } : {})
    }));

    for (const item of normalizedItems) {
      const payload = {
        booking_id: bookingId,
        items: [item]
      };

      try {
        console.log('dYs? ===== LOBBY PMS ADD PRODUCT/SERVICE =====');
        console.log('dYs? Endpoint:', endpoint);
        console.log('dYs? Booking ID:', bookingId);
        console.log('dYs? Item payload:', JSON.stringify(payload, null, 2));
        console.log('dYs? Add product/service URL:', finalUrl);

        const response = await axios.post(finalUrl, payload, {
          headers,
          timeout: 15000
        });

        console.log('?o. LobbyPMS addProductsToBooking successful:', JSON.stringify(response.data, null, 2));
      } catch (error: any) {
        console.error('??O LobbyPMS addProductsToBooking error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          url: finalUrl,
          payload
        });

        throw error;
      }
    }
  }


  /**
   * Get rates information
   */
  async getRates(params?: {
    room_type_id?: string;
    arrival_date?: string;
    departure_date?: string;
  }): Promise<any[]> {
    try {
      const response = await axios.get(
        this.buildURL('/rates', params),
        { timeout: 10000 }
      );
      return response.data || [];
    } catch (error) {
      console.error('LobbyPMS getRates error:', error);
      throw error;
    }
  }

  /**
   * Get products/services
   */
  async getProducts(): Promise<any[]> {
    try {
      const response = await axios.get(
        this.buildURL('/products'),
        { timeout: 10000 }
      );
      return response.data || [];
    } catch (error) {
      console.error('LobbyPMS getProducts error:', error);
      throw error;
    }
  }

  /**
   * Get clients information
   */
  async getClients(params?: {
    email?: string;
    phone?: string;
  }): Promise<any[]> {
    try {
      const response = await axios.get(
        this.buildURL('/clients', params),
        { timeout: 10000 }
      );
      return response.data || [];
    } catch (error) {
      console.error('LobbyPMS getClients error:', error);
      throw error;
    }
  }

  /**
   * Get room availability, rates and restrictions for specific dates
   * According to LobbyPMS API documentation: GET /api/v1/available-rooms
   */
  async getAvailableRooms(params: {
    start_date: string;
    end_date: string;
    category_id?: string;
  }): Promise<any[]> {
    try {
      // Convert ISO dates to YYYY-mm-dd format (required by API)
      const startDate = params.start_date.includes('T') ? params.start_date.split('T')[0] : params.start_date;
      const endDate = params.end_date.includes('T') ? params.end_date.split('T')[0] : params.end_date;
      
      // Build parameters according to API documentation
      const apiParams: Record<string, string> = {
        start_date: startDate,
        end_date: endDate
      };
      
      // Only add category_id if provided
      if (params.category_id) {
        apiParams.category_id = params.category_id;
      }
      
      const finalUrl = this.buildURL('/available-rooms', apiParams);
      
      console.log('🔍 ===== LOBBY PMS AVAILABLE ROOMS API =====');
      console.log('🔍 Endpoint: /available-rooms (CORRECT per documentation)');
      console.log('🔍 Start date:', startDate);
      console.log('🔍 End date:', endDate);
      console.log('🔍 Category ID:', params.category_id || 'All categories');
      console.log('🔍 Final URL:', finalUrl);
      
      const response = await axios.get(finalUrl, { 
              timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'SurfCampSantaTeresa/1.0'
      }
    });
      
      const responseData = response.data;
      
      console.log('📥 ===== API RESPONSE ANALYSIS =====');
      console.log('📥 Status:', response.status);
      console.log('📥 Content-Type:', response.headers['content-type']);
      console.log('📥 Response Type:', typeof responseData);
      console.log('📥 Has data property:', !!(responseData && 'data' in responseData));
      console.log('📥 Data length:', responseData?.data?.length || 0);
      
      // Validate response structure
      if (!responseData || typeof responseData !== 'object') {
        throw new Error('Invalid response format from LobbyPMS API');
      }
      
      // Check if response is HTML (error page)
      if (typeof responseData === 'string' && 
          (responseData.includes('<!doctype html>') || 
           responseData.includes('<html') || 
           responseData.includes('<!DOCTYPE'))) {
        
        // Extract title from HTML for more specific error
        const titleMatch = responseData.match(/<title>(.*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : 'Unknown HTML page';
        
        console.error('🚨 LobbyPMS returned HTML page instead of JSON:');
        console.error('🚨 Page title:', title);
        console.error('🚨 HTML preview:', responseData.substring(0, 300));
        
        throw new Error(`LobbyPMS API returned HTML page "${title}" instead of JSON - possible IP authorization or API token issue`);
      }
      
      console.log('✅ Valid JSON response received from LobbyPMS');
      
      // Log response structure for debugging
      const dataArray = responseData.data || [];
      console.log('📊 Response summary:');
      console.log('   📅 Days returned:', dataArray.length);
      
      if (dataArray.length > 0) {
        console.log('   📅 First day:', dataArray[0].date);
        console.log('   🏠 Categories in first day:', dataArray[0].categories?.length || 0);
        
        if (dataArray[0].categories && dataArray[0].categories.length > 0) {
          const firstCategory = dataArray[0].categories[0];
          console.log('   🏠 First category example:', {
            id: firstCategory.category_id,
            name: firstCategory.name,
            available_rooms: firstCategory.available_rooms,
            prices: firstCategory.prices
          });
        }
      }
      
      return dataArray;
      
    } catch (error: any) {
      const responseData = error.response?.data;
      const isHtmlResponse = typeof responseData === 'string' && 
                             (responseData.includes('<!doctype html>') || 
                              responseData.includes('<html') || 
                              responseData.includes('<!DOCTYPE'));
      
      console.error('❌ LOBBY PMS AVAILABLE ROOMS ERROR:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseType: typeof responseData,
        isHtmlResponse: isHtmlResponse,
        responsePreview: typeof responseData === 'string' 
          ? responseData.substring(0, 300) 
          : responseData,
        requestUrl: this.buildURL('/available-rooms', {
          start_date: params.start_date.includes('T') ? params.start_date.split('T')[0] : params.start_date,
          end_date: params.end_date.includes('T') ? params.end_date.split('T')[0] : params.end_date,
          ...(params.category_id && { category_id: params.category_id })
        }),
        apiToken: this.apiToken.slice(-8)
      });
      
      // Enhanced error message based on response type
      let errorMessage = `LobbyPMS available rooms API failed: ${error.message}`;
      
      if (isHtmlResponse) {
        const titleMatch = responseData.match(/<title>(.*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : 'Unknown page';
        errorMessage = `LobbyPMS API returned HTML page "${title}" instead of JSON - check IP authorization and API token`;
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Check if API is configured and working
   */
  isConfigured(): boolean {
    // Check if we have a valid API token that's not a placeholder
    const hasValidToken = !!(this.apiToken && 
                          this.apiToken !== 'your_api_token_here' &&
                          this.apiToken.length > 20 &&
                          !this.apiToken.includes('placeholder'));
    
    // Check if we have a valid base URL
    const hasValidURL = !!(this.baseURL && 
                       this.baseURL !== 'https://your-api-url.com' &&
                       !this.baseURL.includes('placeholder') &&
                       this.baseURL.includes('lobbypms.com'));
    
    console.log('🔧 LobbyPMS Configuration Check:', {
      hasValidToken,
      hasValidURL,
      tokenLength: this.apiToken?.length || 0,
      baseURL: this.baseURL,
      isConfigured: hasValidToken && hasValidURL
    });
    
    return hasValidToken && hasValidURL;
  }

  /**
   * Test API connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      // Use the correct endpoint for testing
      await this.getAvailableRooms({
        start_date: '2025-01-01',
        end_date: '2025-01-02'
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export a default instance
export const lobbyPMSClient = new LobbyPMSClient(); 
