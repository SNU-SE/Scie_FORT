// ============================================
// AI Survey Platform - Chat Interface Component
// ============================================

import { useState, useRef, RefObject } from 'react'
import { MessageBubble } from './MessageBubble'
import { ProgressBar } from './ProgressBar'
import { ChatInput } from './ChatInput'
import type { AISurvey, AIQuestion, AIOption, ChatMessage } from '@/types/ai'

interface ChatInterfaceProps {
  survey: AISurvey
  messages: ChatMessage[]
  streamingContent: string
  currentQuestion: AIQuestion | null
  currentQuestionIndex: number
  totalQuestions: number
  isStreaming: boolean
  isLastQuestion: boolean
  hintsUsed: number
  maxHints: number
  allowHint: boolean
  onSendMessage: (content: string, messageType: 'answer' | 'hint_request', selectedOptionId?: string) => void
  onOptionSelect: (option: AIOption) => void
  onHintRequest: () => void
  onNextQuestion: () => void
  onComplete: () => void
  messagesEndRef: RefObject<HTMLDivElement>
}

export function ChatInterface({
  survey,
  messages,
  streamingContent,
  currentQuestion,
  currentQuestionIndex,
  totalQuestions,
  isStreaming,
  isLastQuestion,
  hintsUsed,
  maxHints,
  allowHint,
  onSendMessage,
  onOptionSelect,
  onHintRequest,
  onNextQuestion,
  onComplete,
  messagesEndRef,
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('')
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const handleSend = () => {
    if (!inputValue.trim() || isStreaming) return
    onSendMessage(inputValue.trim(), 'answer')
    setInputValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Check if any option has been selected
  const hasSelectedOption = messages.some(m => m.selected_option_id)

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {survey.title}
          </h1>
          <ProgressBar
            current={currentQuestionIndex + 1}
            total={totalQuestions}
          />
        </div>
      </header>

      {/* Chat Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isStreaming={message.isStreaming}
              streamingContent={
                message.isStreaming ? streamingContent : undefined
              }
              onOptionSelect={
                message.content_type === 'options' && !hasSelectedOption
                  ? onOptionSelect
                  : undefined
              }
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="max-w-2xl mx-auto">
          <ChatInput
            value={inputValue}
            onChange={setInputValue}
            onSend={handleSend}
            onKeyDown={handleKeyDown}
            onHintRequest={onHintRequest}
            disabled={isStreaming}
            allowHint={allowHint}
            hintsUsed={hintsUsed}
            maxHints={maxHints}
            placeholder={
              currentQuestion?.question_type === 'text'
                ? '답변을 입력하세요...'
                : '선생님에게 질문하거나 설명해보세요...'
            }
          />

          {/* Navigation Buttons */}
          <div className="flex justify-center gap-3 mt-3">
            {isLastQuestion ? (
              <button
                onClick={onComplete}
                disabled={isStreaming}
                className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                학습 완료하기
              </button>
            ) : (
              <button
                onClick={onNextQuestion}
                disabled={isStreaming}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                다음 문제로
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
