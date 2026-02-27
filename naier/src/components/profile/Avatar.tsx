interface AvatarProps {
  src?: string
  name?: string
  size: 'xs' | 'sm' | 'md' | 'lg'
}

const sizeClassMap: Record<AvatarProps['size'], string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
}

const fallbackColors = [
  'bg-red-500',
  'bg-orange-500',
  'bg-emerald-500',
  'bg-sky-500',
  'bg-indigo-500',
  'bg-pink-500',
]

function getColorClass(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
  }

  return fallbackColors[Math.abs(hash) % fallbackColors.length]
}

export default function Avatar({ src, name, size }: AvatarProps) {
  const initial = (name?.trim().charAt(0) || '?').toUpperCase()
  const colorClass = getColorClass(name || 'naier')
  const sizing = sizeClassMap[size]

  if (src) {
    return <img src={src} alt={name || 'Avatar'} className={`${sizing} rounded-full object-cover`} />
  }

  return (
    <div
      aria-hidden="true"
      className={`${sizing} ${colorClass} flex items-center justify-center rounded-full font-semibold text-white`}
    >
      {initial}
    </div>
  )
}
