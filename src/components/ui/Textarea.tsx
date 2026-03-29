import { type TextareaHTMLAttributes } from 'react'

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/30 ${className}`}
      {...props}
    />
  )
}
