import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { CommandPalette } from '../overlays/CommandPalette'
import { CreateModalHost } from '../overlays/CreateModals'
import { ToastHost } from '../ui/Toast'

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => { setMobileOpen(false) }, [location.pathname])
  useEffect(() => { window.scrollTo({ top: 0 }) }, [location.pathname])

  /* Arena Mode takes the whole viewport — no shell chrome competing with the scoreboard. */
  const arena = location.pathname.startsWith('/live/')

  if (arena) {
    return (
      <>
        <Outlet />
        <CommandPalette />
        <CreateModalHost />
        <ToastHost />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className={cn('transition-[padding] duration-300 ease-premium', collapsed ? 'lg:pl-[68px]' : 'lg:pl-[236px]')}>
        <Topbar onOpenMobileNav={() => setMobileOpen(true)} />
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-[1560px] px-4 pb-16 pt-5 sm:px-6"
        >
          <Outlet />
        </motion.main>
      </div>
      <CommandPalette />
      <CreateModalHost />
      <ToastHost />
    </div>
  )
}

/** Stagger helper — every page composes its cards through this. */
export const stagger = {
  container: { animate: { transition: { staggerChildren: 0.05 } } },
  item: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.36, ease: [0.22, 1, 0.36, 1] as const } },
  },
}
