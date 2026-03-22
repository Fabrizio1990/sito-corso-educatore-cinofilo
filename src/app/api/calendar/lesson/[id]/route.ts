import { createClient } from '@/lib/supabase/server'
import { generateICS } from '@/lib/ics'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // Fetch lesson with class and course info
    const { data: lesson, error } = await supabase
      .from('lessons')
      .select('*, classes(edition_name, courses(name))')
      .eq('id', id)
      .single()

    if (error || !lesson) {
      return NextResponse.json({ error: 'Lezione non trovata' }, { status: 404 })
    }

    // Generate .ics
    const ics = generateICS([lesson])

    return new NextResponse(ics, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="lezione-${id}.ics"`,
      },
    })
  } catch (error) {
    console.error('Error generating lesson calendar:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
