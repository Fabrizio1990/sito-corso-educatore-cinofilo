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

    // Fetch class info for the filename
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('edition_name')
      .eq('id', id)
      .single()

    if (classError || !classData) {
      return NextResponse.json({ error: 'Classe non trovata' }, { status: 404 })
    }

    // Fetch all lessons for this class with course info
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*, classes(edition_name, courses(name))')
      .eq('class_id', id)
      .order('lesson_date', { ascending: true })

    if (lessonsError) {
      console.error('Error fetching lessons:', lessonsError)
      return NextResponse.json({ error: 'Errore nel recupero delle lezioni' }, { status: 500 })
    }

    if (!lessons || lessons.length === 0) {
      return NextResponse.json({ error: 'Nessuna lezione trovata per questa classe' }, { status: 404 })
    }

    // Generate .ics with all lessons
    const ics = generateICS(lessons)

    // Sanitize edition_name for filename
    const sanitizedName = classData.edition_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    return new NextResponse(ics, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="calendario-${sanitizedName}.ics"`,
      },
    })
  } catch (error) {
    console.error('Error generating class calendar:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
