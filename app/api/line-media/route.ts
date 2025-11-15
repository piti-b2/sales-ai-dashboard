import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get('url')

  console.log('📡 LINE Media Proxy Request:', { url })

  if (!url) {
    console.error('❌ No URL provided')
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) {
    console.error('❌ LINE_CHANNEL_ACCESS_TOKEN not found in environment')
    return NextResponse.json({ error: 'LINE token not configured' }, { status: 500 })
  }

  try {
    console.log('🔑 Using LINE token:', token.substring(0, 10) + '...')
    
    // Fetch media from LINE with Authorization
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    console.log('📊 LINE API Response:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ LINE API Error:', errorText)
      throw new Error(`Failed to fetch media: ${response.statusText} - ${errorText}`)
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const buffer = await response.arrayBuffer()

    console.log('✅ Successfully proxied LINE media:', buffer.byteLength, 'bytes')

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch (error) {
    console.error('❌ Error proxying LINE media:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch media',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
