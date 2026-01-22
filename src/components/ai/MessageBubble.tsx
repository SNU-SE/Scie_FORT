// ============================================
// AI Survey Platform - Message Bubble Component
// ============================================

import { OptionCards } from './OptionCards'
import { TypingIndicator } from './TypingIndicator'
import type { ChatMessage, AIOption } from '@/types/ai'

interface MessageBubbleProps {
  message: ChatMessage
  isStreaming?: boolean
  streamingContent?: string
  onOptionSelect?: (option: AIOption) => void
}

export function MessageBubble({
  message,
  isStreaming,
  streamingContent,
  onOptionSelect,
}: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  // Render based on content type
  const renderContent = () => {
    // Handle streaming
    if (isStreaming) {
      if (streamingContent) {
        return (
          <p className="whitespace-pre-wrap">{streamingContent}</p>
        )
      }
      return <TypingIndicator />
    }

    switch (message.content_type) {
      case 'image':
        return (
          <div className="rounded-lg overflow-hidden">
            <img
              src={message.image_url || message.content}
              alt="문제 이미지"
              className="max-w-full h-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=이미지+로딩+실패'
              }}
            />
          </div>
        )

      case 'options':
        return (
          <div>
            {message.content && (
              <p className="mb-3">{message.content}</p>
            )}
            {message.options && message.options.length > 0 && (
              <OptionCards
                options={message.options}
                selectedOptionId={message.selected_option_id}
                onSelect={onOptionSelect}
                disabled={!onOptionSelect}
              />
            )}
          </div>
        )

      default:
        return (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )
    }
  }

  // Get message type badge
  const getMessageTypeBadge = () => {
    if (!message.message_type || message.message_type === 'system') return null

    const badges: Record<string, { text: string; color: string }> = {
      answer: { text: '답변', color: 'bg-blue-100 text-blue-800' },
      hint_request: { text: '힌트 요청', color: 'bg-purple-100 text-purple-800' },
      hint: { text: '힌트', color: 'bg-purple-100 text-purple-800' },
      evaluation: { text: '평가', color: 'bg-green-100 text-green-800' },
      final_answer: { text: '최종 답변', color: 'bg-orange-100 text-orange-800' },
    }

    const badge = badges[message.message_type]
    if (!badge) return null

    return (
      <span className={`text-xs px-2 py-0.5 rounded ${badge.color}`}>
        {badge.text}
      </span>
    )
  }

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[85%] ${
          isUser
            ? 'bg-blue-600 text-white rounded-2xl rounded-tr-md'
            : 'bg-white text-gray-800 rounded-2xl rounded-tl-md shadow-sm border border-gray-100'
        } px-4 py-3`}
      >
        {/* Avatar and header for assistant */}
        {isAssistant && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🤖</span>
            {getMessageTypeBadge()}
          </div>
        )}

        {/* Content */}
        <div className={isUser ? '' : ''}>
          {renderContent()}
        </div>

        {/* Selected option indicator */}
        {isUser && message.selected_option_id && (
          <div className="mt-1 text-xs text-blue-200">
            선택지 클릭
          </div>
        )}
      </div>
    </div>
  )
}
