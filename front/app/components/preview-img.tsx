"use client"

import { useState } from "react"
import Image from "next/image"
import { Maximize, X } from "lucide-react"

interface PreviewImgProps {
  imageUrl: string
  alt?: string
  placeholder?: string
}

export function PreviewImg({ imageUrl, alt = "图片预览", placeholder = "/placeholder.svg" }: PreviewImgProps) {
  const [showPreview, setShowPreview] = useState(false)

  if (!imageUrl) {
    return (
      <Image 
        src={`${placeholder}?height=400&width=600`} 
        alt={alt} 
        fill 
        className="object-contain" 
      />
    )
  }

  return (
    <div className="relative w-full h-full group">
      <Image 
        src={imageUrl} 
        alt={alt} 
        fill 
        className="object-contain cursor-pointer" 
        onClick={() => setShowPreview(true)}
      />
      <button 
        className="absolute top-2 left-2 bg-primary/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => setShowPreview(true)}
      >
        <Maximize className="h-5 w-5" />
      </button>
      {showPreview && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" onClick={() => setShowPreview(false)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full" onClick={(e) => e.stopPropagation()}>
            <Image 
              src={imageUrl} 
              alt={alt} 
              fill 
              className="object-contain" 
            />
            <button 
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-colors"
              onClick={() => setShowPreview(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
