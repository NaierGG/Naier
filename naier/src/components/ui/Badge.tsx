interface BadgeProps {
  count: number
}

export default function Badge({ count }: BadgeProps) {
  if (count <= 0) {
    return null
  }

  const text = count > 99 ? '99+' : String(count)

  return (
    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-naier-blue px-1.5 py-0.5 text-[10px] font-semibold text-white">
      {text}
    </span>
  )
}
