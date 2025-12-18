import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { caseStudyId, studentAnswer } = await request.json()

    if (!caseStudyId || !studentAnswer) {
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 })
    }

    // Get the case study
    const { data: caseStudy, error: caseStudyError } = await supabase
      .from('case_studies')
      .select('*')
      .eq('id', caseStudyId)
      .single()

    if (caseStudyError || !caseStudy) {
      return NextResponse.json({ error: 'Caso di studio non trovato' }, { status: 404 })
    }

    // Get previous attempts count
    const { count: attemptsCount } = await supabase
      .from('case_study_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('case_study_id', caseStudyId)
      .eq('profile_id', user.id)

    const attemptNumber = (attemptsCount || 0) + 1

    // Call Gemini API
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key non configurata' }, { status: 500 })
    }

    const prompt = `Sei un esperto educatore cinofilo che sta valutando la risposta di uno studente a un caso di studio.

SCENARIO DEL CASO DI STUDIO:
${caseStudy.scenario}

RISPOSTA MODELLO (la risposta corretta che il tutor si aspetta):
${caseStudy.model_answer}

${caseStudy.hints ? `SUGGERIMENTI DEL TUTOR:\n${caseStudy.hints}\n` : ''}

RISPOSTA DELLO STUDENTE:
${studentAnswer}

NUMERO TENTATIVO: ${attemptNumber}

ISTRUZIONI:
1. Valuta se la risposta dello studente coglie i concetti chiave della risposta modello
2. Non è necessario che sia identica, ma deve dimostrare comprensione dei principi fondamentali
3. Se la risposta è CORRETTA o sufficientemente vicina alla risposta modello:
   - Rispondi con "CORRETTO" come prima parola
   - Fornisci un breve feedback positivo
   - Puoi aggiungere eventuali approfondimenti

4. Se la risposta è INCORRETTA o incompleta:
   - Rispondi con "RIPROVA" come prima parola
   - NON rivelare la risposta corretta
   - Fornisci spunti di riflessione per guidare lo studente
   - Fai domande che lo aiutino a ragionare
   - Se è il tentativo ${attemptNumber > 3 ? '(oltre il terzo)' : ''}, puoi essere leggermente più esplicito negli hint

Rispondi in italiano in modo professionale ma incoraggiante.`

    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        }
      })
    })

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error('Gemini API error:', errorText)
      return NextResponse.json({ error: 'Errore nella valutazione AI' }, { status: 500 })
    }

    const geminiData = await geminiResponse.json()
    const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Determine if correct based on AI response
    const isCorrect = aiResponse.toUpperCase().startsWith('CORRETTO')

    // Save the attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('case_study_attempts')
      .insert({
        case_study_id: caseStudyId,
        profile_id: user.id,
        student_answer: studentAnswer,
        is_correct: isCorrect,
        ai_feedback: aiResponse,
        attempt_number: attemptNumber
      })
      .select()
      .single()

    if (attemptError) {
      console.error('Error saving attempt:', attemptError)
      return NextResponse.json({ error: 'Errore nel salvataggio' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      isCorrect,
      feedback: aiResponse,
      attemptNumber,
      attemptId: attempt.id
    })

  } catch (error) {
    console.error('Error in case study evaluation:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
