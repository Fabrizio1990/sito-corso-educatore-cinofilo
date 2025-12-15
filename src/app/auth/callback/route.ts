import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const inviteCode = searchParams.get('invite')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // If there's an invite code, enroll the user in the class
      if (inviteCode) {
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          // Find the class with this invite code
          const { data: classData } = await supabase
            .from('classes')
            .select('id')
            .eq('invite_code', inviteCode)
            .single()

          if (classData) {
            // Enroll the student
            await supabase.from('class_students').insert({
              class_id: classData.id,
              profile_id: user.id,
            })
          }
        }
      }

      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_error`)
}
