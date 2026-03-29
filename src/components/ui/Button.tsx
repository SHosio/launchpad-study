import { type ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost'
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const base = 'rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-orange-500 hover:bg-orange-600 text-white',
    ghost: 'text-zinc-400 hover:text-zinc-200',
  }
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />
}
