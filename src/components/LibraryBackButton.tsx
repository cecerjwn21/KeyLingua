import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronLeft } from 'lucide'
import ProductIcon from './ProductIcon'
import { useState } from 'react'

type LibraryBackButtonProps = {
  label: string
  onClick?: () => void
  to?: string
}

export default function LibraryBackButton({ label, onClick, to }: LibraryBackButtonProps) {
  const [isPointerHovering, setIsPointerHovering] = useState(false)
  const className =
    'app-button app-button-ghost max-w-full justify-start px-3 text-indigo-700 dark:text-indigo-200'
  const icon = (
    <span aria-hidden="true" className="flex h-5 w-5 shrink-0 items-center justify-center">
      <ProductIcon icon={isPointerHovering ? ChevronLeft : ArrowLeft} size={19} />
    </span>
  )
  const interactionProps = {
    onPointerEnter: () => setIsPointerHovering(true),
    onPointerLeave: () => setIsPointerHovering(false),
  }

  if (to) {
    return (
      <Link data-testid="library-back-button" to={to} className={className} {...interactionProps}>
        {icon}
        <span className="truncate">{label}</span>
      </Link>
    )
  }

  return (
    <button data-testid="library-back-button" type="button" className={className} onClick={onClick} {...interactionProps}>
      {icon}
      <span className="truncate">{label}</span>
    </button>
  )
}
