import { cn } from '../../lib/utils'

/**
 * The Cavs mark. Shared across the sidebar, top bar, sign-in screen and anywhere
 * else the brand appears, so there is exactly one logo in the product.
 *
 * Uses the padding-trimmed copy of the supplied asset: the original carries ~40px
 * of transparent space top and bottom, so a third of any box it sits in renders
 * empty and the mark reads far smaller than its height suggests.
 *
 * Height comes from the caller's className and width follows via `w-auto` — set
 * one axis in CSS and the other as an attribute and the image gets letterboxed.
 * Intrinsic dimensions are declared to avoid layout shift while it loads.
 */
export function CavsLogo({ className, alt = 'Cavs Youth Basketball' }: { className?: string; alt?: string }) {
  return (
    <img
      src="/cavs-logo-mark.avif"
      alt={alt}
      width={192}
      height={123}
      className={cn('block w-auto select-none', className)}
      draggable={false}
    />
  )
}
