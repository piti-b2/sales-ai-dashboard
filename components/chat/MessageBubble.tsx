import { formatDistanceToNow } from 'date-fns'
import { th } from 'date-fns/locale'
import {
  Check,
  CheckCheck,
  Clock,
  Image as ImageIcon,
  Video,
  Mic,
  FileText,
  Download,
  Play,
  X,
  Loader2,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { ChatMessage } from '@/lib/useRealtimeChat'
import { FlexMessage } from './FlexMessage'

interface MessageBubbleProps {
  message: ChatMessage
  isOwn: boolean
  showAvatar?: boolean
  customerAvatar?: string
  onImageClick?: (url: string) => void
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar = true,
  customerAvatar,
  onImageClick,
}: MessageBubbleProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [videoError, setVideoError] = useState(false)

  // Reset states เมื่อ message เปลี่ยน
  useEffect(() => {
    setImageError(false)
    setImageLoading(false)
    setVideoError(false)
  }, [message.id])

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sent':
        return <Check className="w-3 h-3" />
      case 'delivered':
        return <CheckCheck className="w-3 h-3" />
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />
      case 'failed':
        return <X className="w-3 h-3 text-red-500" />
      default:
        return <Clock className="w-3 h-3" />
    }
  }

  const renderContent = () => {
    switch (message.message_type) {
      case 'text':
        // ตรวจสอบว่า content เป็น JSON หรือไม่
        let parsedContent = null
        try {
          if (message.content?.startsWith('{') || message.content?.startsWith('[')) {
            parsedContent = JSON.parse(message.content)
          }
        } catch (e) {
          // ไม่ใช่ JSON ให้แสดงเป็นข้อความธรรมดา
        }

        // ถ้าเป็น image gallery ให้แสดงเป็น grid
        if (parsedContent?.action === 'show_image_gallery' && parsedContent?.images) {
          return (
            <div className="space-y-3">
              {/* ข้อความหลัก */}
              {parsedContent.message && (
                <div className="text-sm mb-3">
                  {parsedContent.message}
                </div>
              )}
              
              {/* Image Gallery Grid */}
              <div className="grid grid-cols-3 gap-2 max-w-md">
                {parsedContent.images.map((imageUrl: string, index: number) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border border-gray-200"
                    onClick={() => onImageClick?.(imageUrl)}
                  >
                    <img
                      src={imageUrl}
                      alt={`Image ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-image.png'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )
        }

        // ถ้าเป็น product carousel ให้แสดงเป็น card
        if (parsedContent?.action === 'show_product_carousel' && parsedContent?.products) {
          return (
            <div className="space-y-3">
              {/* ข้อความหลัก */}
              {parsedContent.message && (
                <div className="text-sm mb-3">
                  {parsedContent.message}
                </div>
              )}
              
              {/* Product Cards */}
              <div className="space-y-2">
                {parsedContent.products.map((product: any, index: number) => (
                  <div
                    key={index}
                    className="flex flex-col rounded-2xl overflow-hidden shadow-md bg-white max-w-sm"
                  >
                    {/* Product Image */}
                    {product.image_url && (
                      <div className="relative w-full aspect-video">
                        <img
                          src={product.image_url}
                          alt={product.name || 'Product'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    )}

                    {/* Product Info */}
                    <div className="p-4 space-y-2">
                      {/* Product Name */}
                      {product.name && (
                        <div className="font-bold text-lg text-gray-900">
                          {product.name}
                        </div>
                      )}

                      {/* Product Description */}
                      {product.description && (
                        <div className="text-sm text-gray-600">
                          {product.description}
                        </div>
                      )}

                      {/* Product Price */}
                      {product.price && (
                        <div className="text-xl font-bold text-green-600">
                          {product.price}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="p-3 space-y-2 bg-gray-50">
                      <button
                        className="w-full py-2.5 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                        onClick={() => {
                          // TODO: Handle view details
                          console.log('View details:', product)
                        }}
                      >
                        ดูรายละเอียด
                      </button>
                      <button
                        className="w-full py-2.5 px-4 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium transition-colors"
                        onClick={() => {
                          // TODO: Handle order
                          console.log('Order:', product)
                        }}
                      >
                        สั่งซื้อเลย
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        }

        // แสดงข้อความธรรมดา
        return (
          <div className="whitespace-pre-wrap break-words">
            {parsedContent?.message || message.content}
          </div>
        )

      case 'image':
        const imageUrl = message.media_url || (message.metadata as any)?.line_media_url
        console.log('🖼️ Image message:', { 
          media_url: message.media_url, 
          line_media_url: (message.metadata as any)?.line_media_url,
          imageUrl,
          metadata: message.metadata 
        })
        
        return (
          <div className="space-y-2">
            {imageUrl && !imageError ? (
              <div
                className="relative rounded-lg overflow-hidden cursor-pointer max-w-xs border border-gray-200"
                onClick={() => {
                  const finalUrl = message.media_url 
                    ? message.media_url 
                    : imageUrl
                    ? `/api/line-media?url=${encodeURIComponent(imageUrl)}`
                    : ''
                  console.log('🖼️ Opening image:', finalUrl)
                  onImageClick?.(finalUrl)
                }}
              >
                <img
                  src={
                    message.media_url 
                      ? message.media_url 
                      : imageUrl
                      ? `/api/line-media?url=${encodeURIComponent(imageUrl)}`
                      : ''
                  }
                  alt="Image message"
                  className="block w-full h-auto object-contain bg-gray-50"
                  onLoad={(e) => {
                    console.log('✅ Image loaded successfully:', e.currentTarget.src)
                    setImageLoading(false)
                  }}
                  onError={(e) => {
                    console.warn('⚠️ Image load failed (likely expired LINE URL):', {
                      src: e.currentTarget.src,
                      naturalWidth: e.currentTarget.naturalWidth,
                      naturalHeight: e.currentTarget.naturalHeight,
                    })
                    setImageError(true)
                    setImageLoading(false)
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <ImageIcon className="w-5 h-5" />
                <span>รูปภาพ</span>
              </div>
            )}
            {imageError && (
              <div className="text-xs text-gray-400 mt-1">
                ⚠️ รูปภาพหมดอายุ (LINE media URL หมดอายุหลัง 7 วัน)
              </div>
            )}
            {message.content && (
              <div className="text-sm">{message.content}</div>
            )}
          </div>
        )

      case 'video':
        // ดึง video URL จาก media_url หรือ metadata
        const videoUrl = message.media_url 
          || (message.metadata as any)?.line_media_url 
          || (message.metadata as any)?.media_url
        
        // ดึง duration จาก media_duration หรือ metadata
        const videoDuration = message.media_duration 
          || (message.metadata as any)?.media_duration
        
        // ตรวจสอบว่า URL เป็น LINE URL หรือไม่
        const isLineUrl = videoUrl?.includes('api-data.line.me')
        
        // ถ้าเป็น LINE URL ต้องใช้ proxy, ถ้าไม่ใช่ (เช่น Supabase Storage) ใช้ตรงๆ
        const finalVideoUrl = videoUrl
          ? isLineUrl
            ? `/api/line-media?url=${encodeURIComponent(videoUrl)}`
            : videoUrl
          : null
        
        console.log('🎬 Video message:', { 
          media_url: message.media_url,
          line_media_url: (message.metadata as any)?.line_media_url,
          metadata_media_url: (message.metadata as any)?.media_url,
          videoUrl,
          finalVideoUrl,
          videoDuration,
          metadata: message.metadata 
        })
        
        return (
          <div className="space-y-2">
            {finalVideoUrl ? (
              <div className="relative rounded-lg overflow-hidden max-w-xs border border-gray-200 bg-gray-900">
                <video
                  src={finalVideoUrl}
                  controls
                  className="w-full h-auto"
                  poster={message.thumbnail_url}
                  preload="metadata"
                  onLoadStart={() => {
                    console.log('🎬 Video loading started:', finalVideoUrl)
                  }}
                  onLoadedMetadata={(e) => {
                    console.log('✅ Video metadata loaded:', {
                      duration: e.currentTarget.duration,
                      videoWidth: e.currentTarget.videoWidth,
                      videoHeight: e.currentTarget.videoHeight
                    })
                  }}
                  onError={(e) => {
                    console.warn('⚠️ Video load failed (likely expired LINE URL):', {
                      src: e.currentTarget.src,
                      error: e.currentTarget.error,
                      networkState: e.currentTarget.networkState,
                      readyState: e.currentTarget.readyState
                    })
                    setVideoError(true)
                  }}
                  onCanPlay={() => {
                    console.log('✅ Video can play')
                  }}
                >
                  Your browser does not support the video tag.
                </video>
                {videoDuration && (
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(videoDuration)}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Video className="w-5 h-5" />
                <span>วิดีโอ</span>
                {videoDuration && (
                  <span className="text-xs">({formatDuration(videoDuration)})</span>
                )}
              </div>
            )}
            {videoError && (
              <div className="text-xs text-gray-400 mt-1">
                ⚠️ วิดีโอหมดอายุ (LINE media URL หมดอายุหลัง 7 วัน)
              </div>
            )}
            {message.content && message.content !== '[วีดีโอ]' && (
              <div className="text-sm">{message.content}</div>
            )}
          </div>
        )

      case 'audio':
        return (
          <div className="space-y-2">
            {message.media_url ? (
              <div className="flex items-center space-x-3">
                <Mic className="w-5 h-5 flex-shrink-0" />
                <audio
                  src={message.media_url}
                  controls
                  className="flex-1 h-8"
                  style={{ maxWidth: '250px' }}
                >
                  Your browser does not support the audio tag.
                </audio>
                {message.media_duration && (
                  <span className="text-xs opacity-75">
                    {formatDuration(message.media_duration)}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-sm">
                <Mic className="w-5 h-5" />
                <span>ข้อความเสียง</span>
              </div>
            )}
          </div>
        )

      case 'file':
        // ดึงชื่อไฟล์จาก metadata
        const fileName = (message.metadata as any)?.file_name || 
                        (message.metadata as any)?.fileName || 
                        message.content?.replace('[ไฟล์: ', '').replace(']', '') ||
                        'ไฟล์แนบ'
        const fileSize = (message.metadata as any)?.file_size || 
                        (message.metadata as any)?.fileSize || 
                        message.media_size
        const fileUrl = message.media_url || (message.metadata as any)?.line_media_url
        
        return (
          <div className="flex items-center space-x-3 p-3 bg-white bg-opacity-10 rounded-lg">
            <FileText className="w-8 h-8 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {fileName}
              </div>
              {fileSize && (
                <div className="text-xs opacity-75">
                  {formatFileSize(fileSize)}
                </div>
              )}
            </div>
            {fileUrl && (
              <a
                href={fileUrl}
                download={fileName}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="w-4 h-4" />
              </a>
            )}
          </div>
        )

      case 'sticker':
        const stickerId = (message.metadata as any)?.sticker_id || message.sticker_id
        const packageId = (message.metadata as any)?.package_id || message.sticker_package_id
        const stickerResourceType = (message.metadata as any)?.sticker_resource_type || message.sticker_resource_type
        const keywords = (message.metadata as any)?.keywords || []
        
        // LINE Sticker URL format
        // สำหรับ ANIMATION stickers ใช้ iPhone version เพราะรองรับ APNG
        const stickerUrl = stickerId 
          ? stickerResourceType === 'ANIMATION'
            ? `https://stickershop.line-scdn.net/stickershop/v1/sticker/${stickerId}/iPhone/sticker_animation@2x.png`
            : `https://stickershop.line-scdn.net/stickershop/v1/sticker/${stickerId}/android/sticker.png`
          : null
        
        return (
          <div className="flex flex-col items-center gap-1">
            {stickerUrl ? (
              <img
                src={stickerUrl}
                alt={keywords.length > 0 ? keywords[0] : 'Sticker'}
                className="w-32 h-32 object-contain cursor-pointer transition-transform hover:scale-110 active:scale-95"
                onDoubleClick={(e) => {
                  // รีเพลย์แอนิเมชันเมื่อดับเบิลคลิก
                  const target = e.currentTarget
                  const originalSrc = target.src
                  
                  // เพิ่ม timestamp เพื่อบังคับให้โหลดใหม่
                  target.src = ''
                  setTimeout(() => {
                    target.src = originalSrc + '?t=' + Date.now()
                  }, 10)
                }}
                onError={(e) => {
                  // Fallback chain
                  const target = e.currentTarget
                  const currentSrc = target.src
                  
                  // Try different URLs based on resource type
                  if (stickerResourceType === 'ANIMATION') {
                    // Animation: try regular iPhone version
                    const fallback1 = `https://stickershop.line-scdn.net/stickershop/v1/sticker/${stickerId}/iPhone/sticker@2x.png`
                    const fallback2 = `https://stickershop.line-scdn.net/stickershop/v1/sticker/${stickerId}/android/sticker.png`
                    
                    if (!currentSrc.includes('sticker@2x.png')) {
                      target.src = fallback1
                    } else if (!currentSrc.includes('android')) {
                      target.src = fallback2
                    } else {
                      // All failed, show emoji
                      target.style.display = 'none'
                      const parent = target.parentElement
                      if (parent) {
                        parent.innerHTML = `<div class="text-4xl">😊</div>`
                      }
                    }
                  } else {
                    // Static: try iPhone version
                    const fallbackUrl = `https://stickershop.line-scdn.net/stickershop/v1/sticker/${stickerId}/iPhone/sticker@2x.png`
                    if (target.src !== fallbackUrl) {
                      target.src = fallbackUrl
                    } else {
                      target.style.display = 'none'
                      const parent = target.parentElement
                      if (parent) {
                        parent.innerHTML = `<div class="text-4xl">😊</div>`
                      }
                    }
                  }
                }}
              />
            ) : (
              <div className="text-4xl">{message.content || '😊'}</div>
            )}
            {keywords.length > 0 && (
              <div className="text-xs text-gray-500">{keywords[0]}</div>
            )}
          </div>
        )

      default:
        // ตรวจสอบว่าเป็น Flex Message หรือไม่
        const flexContent = (message.metadata as any)?.flex_content || (message.metadata as any)?.line_flex_message
        if (flexContent && flexContent.type === 'flex') {
          return <FlexMessage flexContent={flexContent} isOwn={isOwn} />
        }
        return <div>{message.content}</div>
    }
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-end space-x-2 max-w-[70%]`}>
        {!isOwn && showAvatar && (
          <>
            {customerAvatar ? (
              <img
                src={customerAvatar}
                alt="Customer"
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                }}
              />
            ) : null}
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 ${customerAvatar ? 'hidden' : ''}`}>
              <span className="text-white text-xs font-semibold">
                {message.sender_type === 'ai' ? 'AI' : 'U'}
              </span>
            </div>
          </>
        )}

        <div
          className={`rounded-2xl px-4 py-3 ${
            isOwn
              ? 'bg-blue-600 text-white rounded-br-none'
              : message.sender_type === 'ai'
              ? 'bg-purple-100 text-purple-900 rounded-bl-none'
              : 'bg-gray-100 text-gray-900 rounded-bl-none'
          }`}
        >
          {/* AI Badge */}
          {message.sender_type === 'ai' && !isOwn && (
            <div className="flex items-center space-x-1 mb-2 text-xs font-medium text-purple-600">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
              <span>AI Assistant</span>
            </div>
          )}

          {/* Content */}
          <div className="text-sm">{renderContent()}</div>

          {/* Metadata */}
          {message.metadata?.transcription && (
            <div className="mt-2 pt-2 border-t border-white border-opacity-20 text-xs opacity-75">
              <div className="font-medium mb-1">เสียง:</div>
              <div className="italic">{message.metadata.transcription}</div>
            </div>
          )}

          {/* Timestamp & Status */}
          <div
            className={`flex items-center space-x-1 mt-1 text-xs ${
              isOwn ? 'opacity-75' : 'opacity-60'
            }`}
          >
            <span>
              {formatDistanceToNow(new Date(message.created_at), {
                addSuffix: true,
                locale: th,
              })}
            </span>
            {isOwn && <span className="ml-1">{getStatusIcon()}</span>}
          </div>
        </div>

        {isOwn && showAvatar && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold">A</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper functions
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
