import { redirect } from 'next/navigation'

export default function QuizzesRedirect() {
  redirect('/dashboard/student/exercises')
}
