import { ExternalLink } from 'lucide-react'

interface FlexMessageProps {
  flexContent: any
  isOwn: boolean
}

export function FlexMessage({ flexContent, isOwn }: FlexMessageProps) {
  // ตรวจสอบว่าเป็น Flex Message หรือไม่
  if (!flexContent || flexContent.type !== 'flex') {
    return null
  }

  const bubble = flexContent.contents

  // ดึงข้อมูลจาก Bubble
  const hero = bubble?.hero
  const body = bubble?.body
  const footer = bubble?.footer

  return (
    <div className={`flex flex-col rounded-2xl overflow-hidden shadow-lg max-w-sm ${
      isOwn ? 'bg-blue-50' : 'bg-white'
    }`}>
      {/* Hero Image */}
      {hero?.type === 'image' && (
        <div className="relative w-full aspect-video">
          <img
            src={hero.url}
            alt={hero.altText || 'Product image'}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Body */}
      {body && (
        <div className="p-4 space-y-2">
          {body.contents?.map((content: any, index: number) => {
            if (content.type === 'text') {
              return (
                <div
                  key={index}
                  className={`${
                    content.weight === 'bold' ? 'font-bold' : ''
                  } ${
                    content.size === 'xl' || content.size === 'xxl'
                      ? 'text-lg'
                      : content.size === 'sm' || content.size === 'xs'
                      ? 'text-xs'
                      : 'text-sm'
                  } ${
                    content.color ? `text-[${content.color}]` : 'text-gray-900'
                  }`}
                  style={{ color: content.color }}
                >
                  {content.text}
                </div>
              )
            }

            if (content.type === 'box') {
              return (
                <div key={index} className="flex flex-wrap gap-2">
                  {content.contents?.map((item: any, itemIndex: number) => {
                    if (item.type === 'text') {
                      return (
                        <div
                          key={itemIndex}
                          className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                            item.color === '#06c755' || item.color?.includes('green')
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {item.text}
                        </div>
                      )
                    }
                    return null
                  })}
                </div>
              )
            }

            return null
          })}
        </div>
      )}

      {/* Footer - Buttons */}
      {footer && (
        <div className="p-3 space-y-2 bg-gray-50">
          {footer.contents?.map((content: any, index: number) => {
            if (content.type === 'button') {
              const isUri = content.action?.type === 'uri'
              const isPrimary = content.style === 'primary'
              const isSecondary = content.style === 'secondary'

              return (
                <a
                  key={index}
                  href={isUri ? content.action.uri : '#'}
                  target={isUri ? '_blank' : undefined}
                  rel={isUri ? 'noopener noreferrer' : undefined}
                  className={`flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                    isPrimary
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : isSecondary
                      ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'
                  }`}
                >
                  {content.action?.label || 'Button'}
                  {isUri && <ExternalLink className="w-4 h-4" />}
                </a>
              )
            }

            if (content.type === 'box' && content.layout === 'horizontal') {
              return (
                <div key={index} className="flex gap-2">
                  {content.contents?.map((btn: any, btnIndex: number) => {
                    if (btn.type === 'button') {
                      const isUri = btn.action?.type === 'uri'
                      const isPrimary = btn.style === 'primary'

                      return (
                        <a
                          key={btnIndex}
                          href={isUri ? btn.action.uri : '#'}
                          target={isUri ? '_blank' : undefined}
                          rel={isUri ? 'noopener noreferrer' : undefined}
                          className={`flex-1 flex items-center justify-center gap-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                            isPrimary
                              ? 'bg-green-500 hover:bg-green-600 text-white'
                              : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'
                          }`}
                        >
                          {btn.action?.label || 'Button'}
                          {isUri && <ExternalLink className="w-3 h-3" />}
                        </a>
                      )
                    }
                    return null
                  })}
                </div>
              )
            }

            return null
          })}
        </div>
      )}
    </div>
  )
}
