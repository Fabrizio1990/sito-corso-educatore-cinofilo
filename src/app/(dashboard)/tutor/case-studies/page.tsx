import { redirect } from 'next/navigation'

export default function CaseStudiesRedirect() {
  redirect('/tutor/exercises?tab=case-studies')
}
