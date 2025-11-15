import { useState, useRef, useCallback } from 'react'
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  Video,
  Mic,
  Smile,
  X,
  Loader2,
} from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'
import { useDropzone } from 'react-dropzone'

interface MessageInputProps {
  onSendMessage: (content: string, type?: 'text' | 'image' | 'video' | 'audio' | 'file') => Promise<void>
  onTyping?: (isTyping: boolean) => void
  disabled?: boolean
  placeholder?: string
}

export function MessageInput({
  onSendMessage,
  onTyping,
  disabled = false,
  placeholder = 'พิมพ์ข้อความ...',
}: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }
  }

  // Handle typing indicator
  const handleTyping = () => {
    onTyping?.(true)
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      onTyping?.(false)
    }, 1000)
  }

  // Handle message change
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    adjustTextareaHeight()
    handleTyping()
  }

  // Handle send message
  const handleSend = async () => {
    if ((!message.trim() && !selectedFile) || disabled || isSending) return

    setIsSending(true)
    try {
      if (selectedFile) {
        // TODO: Upload file และส่งข้อความพร้อม URL
        await onSendMessage(message || selectedFile.name, getFileType(selectedFile))
        clearFileSelection()
      } else {
        await onSendMessage(message, 'text')
      }
      
      setMessage('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
      onTyping?.(false)
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSending(false)
    }
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Handle emoji select
  const handleEmojiClick = (emojiData: any) => {
    setMessage((prev) => prev + emojiData.emoji)
    setShowEmojiPicker(false)
    textareaRef.current?.focus()
  }

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setSelectedFile(file)
      
      // Create preview for images/videos
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
      }
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  })

  // Clear file selection
  const clearFileSelection = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        // TODO: Upload audio และส่งข้อความ
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('ไม่สามารถเข้าถึงไมโครโฟนได้')
    }
  }

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  // Get file type
  const getFileType = (file: File): 'image' | 'video' | 'audio' | 'file' => {
    if (file.type.startsWith('image/')) return 'image'
    if (file.type.startsWith('video/')) return 'video'
    if (file.type.startsWith('audio/')) return 'audio'
    return 'file'
  }

  return (
    <div className="relative" {...getRootProps()}>
      <input {...getInputProps()} />
      
      {/* Drag overlay */}
      {isDragActive && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-20 border-2 border-blue-500 border-dashed rounded-xl flex items-center justify-center z-10">
          <div className="text-center">
            <Paperclip className="w-12 h-12 text-blue-600 mx-auto mb-2" />
            <p className="text-blue-600 font-medium">วางไฟล์ที่นี่</p>
          </div>
        </div>
      )}

      {/* File preview */}
      {selectedFile && (
        <div className="mb-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {previewUrl && selectedFile.type.startsWith('image/') && (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              {previewUrl && selectedFile.type.startsWith('video/') && (
                <video
                  src={previewUrl}
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={clearFileSelection}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      )}

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-full mb-2 right-0 z-20">
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end space-x-2 bg-white border border-gray-200 rounded-xl p-2">
        {/* Attachment button */}
        <label className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
          <Paperclip className="w-5 h-5 text-gray-600" />
          <input
            type="file"
            className="hidden"
            onChange={(e) => {
              const files = e.target.files
              if (files && files.length > 0) {
                onDrop([files[0]])
              }
            }}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
          />
        </label>

        {/* Image button */}
        <label className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
          <ImageIcon className="w-5 h-5 text-gray-600" />
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const files = e.target.files
              if (files && files.length > 0) {
                onDrop([files[0]])
              }
            }}
          />
        </label>

        {/* Video button */}
        <label className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
          <Video className="w-5 h-5 text-gray-600" />
          <input
            type="file"
            className="hidden"
            accept="video/*"
            onChange={(e) => {
              const files = e.target.files
              if (files && files.length > 0) {
                onDrop([files[0]])
              }
            }}
          />
        </label>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleMessageChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled || isSending}
          rows={1}
          className="flex-1 px-3 py-2 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[40px] max-h-[120px] text-gray-900 placeholder:text-gray-400"
        />

        {/* Emoji button */}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Smile className="w-5 h-5 text-gray-600" />
        </button>

        {/* Voice recording button */}
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onMouseLeave={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          className={`p-2 rounded-lg transition-colors ${
            isRecording
              ? 'bg-red-500 text-white animate-pulse'
              : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <Mic className="w-5 h-5" />
        </button>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={(!message.trim() && !selectedFile) || disabled || isSending}
          className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute -top-12 left-0 right-0 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center justify-center space-x-2">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">กำลังอัดเสียง...</span>
        </div>
      )}
    </div>
  )
}
