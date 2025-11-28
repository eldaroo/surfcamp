import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Test API endpoint called');
    
    return NextResponse.json({
      success: true,
      message: 'API endpoint working correctly',
      timestamp: new Date().toISOString(),
      server: 'Next.js API Routes'
    });
  } catch (error: any) {
    console.error('❌ Test API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Test API POST endpoint called');
    
    const body = await request.json();
    console.log('📥 Received body:', body);
    
    return NextResponse.json({
      success: true,
      message: 'POST endpoint working correctly',
      receivedData: body,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Test API POST error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 