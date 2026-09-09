import { MorphIcon } from 'morphicons/react'
import type { IconInput } from 'morphicons/react'

export type ProductIconProps = {
  icon: IconInput
  label?: string
  size?: number
  className?: string
}

const normalizeLucideIcon = (icon: IconInput): IconInput => {
  if (Array.isArray(icon) && icon[0] === 'svg' && Array.isArray(icon[2])) {
    return icon[2] as IconInput
  }
  return icon
}

export default function ProductIcon({ icon, label, size = 18, className }: ProductIconProps) {
  return (
    <MorphIcon
      icon={normalizeLucideIcon(icon)}
      label={label}
      aria-hidden={label ? undefined : true}
      className={className}
      size={size}
      strokeWidth={2}
      spring="snappy"
      reducedMotion="user"
    />
  )
}
