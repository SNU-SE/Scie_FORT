// ============================================
// AI Chat Edge Function
// Handles AI chatbot conversations with streaming
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatRequest {
  sessionId: string
  questionId: string
  userMessage: string
  messageType: 'answer' | 'hint_request'
  selectedOptionId?: string
}

interface Question {
  id: string
  question_text: string
  question_type: string
  correct_answer: string | null
  evaluation_prompt: string | null
  hint_prompt: string | null
  options: Array<{
    id: string
    option_text: string
    is_correct: boolean
  }>
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured')
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    const body: ChatRequest = await req.json()
    const { sessionId, questionId, userMessage, messageType, selectedOptionId } = body

    // 1. Fetch session with survey info
    const { data: session, error: sessionError } = await supabase
      .from('ai_chat_sessions')
      .select(`
        *,
        ai_surveys (
          id,
          system_prompt,
          allow_hint,
          max_hints_per_question
        )
      `)
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      throw new Error('Session not found')
    }

    const survey = session.ai_surveys

    // 2. Fetch current question with options
    const { data: question, error: questionError } = await supabase
      .from('ai_questions')
      .select(`
        *,
        ai_options (*)
      `)
      .eq('id', questionId)
      .single()

    if (questionError || !question) {
      throw new Error('Question not found')
    }

    // Sort options
    question.ai_options.sort((a: any, b: any) => a.order_index - b.order_index)

    // 3. Fetch conversation history for this question
    const { data: history, error: historyError } = await supabase
      .from('ai_chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .eq('question_id', questionId)
      .order('message_index', { ascending: true })

    if (historyError) {
      throw new Error('Failed to fetch conversation history')
    }

    // 4. Get next message index
    const { data: allMessages } = await supabase
      .from('ai_chat_messages')
      .select('message_index')
      .eq('session_id', sessionId)
      .order('message_index', { ascending: false })
      .limit(1)

    const nextIndex = allMessages && allMessages.length > 0
      ? allMessages[0].message_index + 1
      : 0

    // 5. Save user message
    const userMsgType = messageType === 'hint_request' ? 'hint_request' : 'answer'
    await supabase.from('ai_chat_messages').insert({
      session_id: sessionId,
      question_id: questionId,
      message_index: nextIndex,
      role: 'user',
      content: userMessage,
      content_type: 'text',
      message_type: userMsgType,
      selected_option_id: selectedOptionId || null,
    })

    // 6. Build system prompt
    let systemPrompt = survey.system_prompt || '너는 친절한 AI 선생님이야.'

    // Add question context
    systemPrompt += `\n\n## 현재 문제\n${question.question_text}`

    if (question.question_type !== 'text' && question.ai_options.length > 0) {
      systemPrompt += '\n\n## 선택지\n'
      question.ai_options.forEach((opt: any, idx: number) => {
        const letter = String.fromCharCode(65 + idx)
        const correctMark = opt.is_correct ? ' (정답)' : ''
        systemPrompt += `${letter}. ${opt.option_text}${correctMark}\n`
      })
    }

    if (question.correct_answer) {
      systemPrompt += `\n\n## 모범답안\n${question.correct_answer}`
    }

    // Add specific prompt based on message type
    if (messageType === 'hint_request') {
      // Check hint limit
      const hintsUsed = session.hints_used?.[questionId] || 0
      const maxHints = survey.max_hints_per_question || 3

      if (!survey.allow_hint) {
        // Return early with no-hint response
        const noHintResponse = '힌트 기능이 비활성화되어 있어요.'
        await supabase.from('ai_chat_messages').insert({
          session_id: sessionId,
          question_id: questionId,
          message_index: nextIndex + 1,
          role: 'assistant',
          content: noHintResponse,
          content_type: 'text',
          message_type: 'system',
        })

        return new Response(
          JSON.stringify({ message: noHintResponse, messageType: 'system' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (hintsUsed >= maxHints) {
        const maxHintResponse = `이 문제에서는 힌트를 ${maxHints}번까지만 사용할 수 있어요. 이미 다 사용했어요!`
        await supabase.from('ai_chat_messages').insert({
          session_id: sessionId,
          question_id: questionId,
          message_index: nextIndex + 1,
          role: 'assistant',
          content: maxHintResponse,
          content_type: 'text',
          message_type: 'system',
        })

        return new Response(
          JSON.stringify({ message: maxHintResponse, messageType: 'system' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      systemPrompt += `\n\n## 힌트 지시사항\n${question.hint_prompt || '학생에게 힌트를 줘. 답을 직접 알려주지 말고, 생각할 수 있는 방향을 제시해줘.'}`
      systemPrompt += `\n\n현재 힌트 사용: ${hintsUsed + 1}/${maxHints}`

      // Update hints used
      const newHintsUsed = { ...session.hints_used, [questionId]: hintsUsed + 1 }
      await supabase
        .from('ai_chat_sessions')
        .update({ hints_used: newHintsUsed })
        .eq('id', sessionId)
    } else {
      systemPrompt += `\n\n## 평가 지시사항\n${question.evaluation_prompt || '학생의 답변을 평가해줘. 맞으면 칭찬하고, 틀리면 왜 틀렸는지 친절하게 설명해줘.'}`
    }

    // 7. Build conversation messages
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
    ]

    // Add history (filter out system messages like images and options)
    history?.forEach((msg: any) => {
      if (msg.content_type === 'text' && msg.role !== 'system') {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })
      }
    })

    // Add current user message
    messages.push({ role: 'user', content: userMessage })

    // 8. Call OpenAI API with streaming
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text()
      throw new Error(`OpenAI API error: ${error}`)
    }

    // 9. Set up streaming response
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    let fullContent = ''
    const aiMsgType = messageType === 'hint_request' ? 'hint' : 'evaluation'

    const stream = new TransformStream({
      async transform(chunk, controller) {
        const text = decoder.decode(chunk)
        const lines = text.split('\n').filter(line => line.trim() !== '')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              // Save the complete assistant message
              await supabase.from('ai_chat_messages').insert({
                session_id: sessionId,
                question_id: questionId,
                message_index: nextIndex + 1,
                role: 'assistant',
                content: fullContent,
                content_type: 'text',
                message_type: aiMsgType,
              })

              // Send done signal
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', messageType: aiMsgType })}\n\n`))
            } else {
              try {
                const json = JSON.parse(data)
                const content = json.choices?.[0]?.delta?.content || ''
                if (content) {
                  fullContent += content
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', content })}\n\n`))
                }
              } catch (e) {
                // Ignore JSON parse errors for incomplete chunks
              }
            }
          }
        }
      },
    })

    openaiResponse.body?.pipeTo(stream.writable)

    return new Response(stream.readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
