'use client'

import { X, Download, ZoomIn, ZoomOut } from 'lucide-react'
import { useState } from 'react'

interface ImageModalProps {
  imageUrl: string
  onClose: () => void
}

export function ImageModal({ imageUrl, onClose }: ImageModalProps) {
  const [zoom, setZoom] = useState(1)

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5))
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `image-${Date.now()}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading image:', error)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95 p-4"
      onClick={onClose}
    >
      {/* Controls */}
      <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleZoomOut()
          }}
          className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors shadow-lg flex items-center gap-2"
          title="ซูมออก"
        >
          <ZoomOut className="w-5 h-5" />
          <span className="text-sm">ซูมออก</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleZoomIn()
          }}
          className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors shadow-lg flex items-center gap-2"
          title="ซูมเข้า"
        >
          <ZoomIn className="w-5 h-5" />
          <span className="text-sm">ซูมเข้า</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleDownload()
          }}
          className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors shadow-lg flex items-center gap-2"
          title="ดาวน์โหลด"
        >
          <Download className="w-5 h-5" />
          <span className="text-sm">ดาวน์โหลด</span>
        </button>
        <button
          onClick={onClose}
          className="p-3 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors shadow-lg flex items-center gap-2"
          title="ปิด"
        >
          <X className="w-5 h-5" />
          <span className="text-sm">ปิด</span>
        </button>
      </div>

      {/* Image Container */}
      <div
        className="relative max-w-[90vw] max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt="Full size"
          className="max-w-full max-h-[90vh] object-contain transition-transform duration-200"
          style={{ transform: `scale(${zoom})` }}
          onError={(e) => {
            console.error('❌ Image failed to load:', imageUrl)
          }}
        />
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full text-sm shadow-lg">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  )
}
