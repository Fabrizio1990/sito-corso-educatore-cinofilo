import { redirect } from 'next/navigation'

export default function CaseStudiesRedirect() {
  redirect('/dashboard/student/exercises?tab=case-studies')
}
