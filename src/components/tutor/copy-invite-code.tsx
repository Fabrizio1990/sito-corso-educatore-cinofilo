'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface CopyInviteCodeProps {
  inviteCode: string
}

export function CopyInviteCode({ inviteCode }: CopyInviteCodeProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const inviteUrl = `${window.location.origin}/join/${inviteCode}`
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 px-2 py-1 bg-gray-100 rounded text-xs font-mono">
        {inviteCode}
      </code>
      <Button variant="outline" size="sm" onClick={handleCopy}>
        {copied ? 'Copiato!' : 'Copia Link'}
      </Button>
    </div>
  )
}
