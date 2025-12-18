'use client'

import { ChangePasswordForm } from '@/components/profile/change-password-form'

export function ForcedPasswordChange() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-2xl p-6">
         <ChangePasswordForm required={true} />
      </div>
    </div>
  )
}
