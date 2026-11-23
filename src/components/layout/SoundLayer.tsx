// ============================================================================
// Global interaction sound layer.
// One delegated listener instead of touching ~200 buttons: anything that is a
// button, a link, a switch or carries .btn/.icon-btn gets a click cue; hovering
// rows and buttons gets a very quiet tick (throttled, so dragging across a
// table does not machine-gun the audio graph).
//
// Everything is off unless the operator enabled sound, and every cue can be
// muted individually in Settings → Sound.
// ============================================================================
import { useEffect } from 'react'
import { audio } from '@/services/audio'
import { usePrefs } from '@/services/prefs'

const CLICKABLE = 'button, a[href], [role="switch"], [role="tab"], [role="button"], .btn, .icon-btn, .tile, .row'
const HOVERABLE = 'button, a[href], [role="switch"], .btn, .icon-btn, tbody tr, li[data-hover]'

export function SoundLayer() {
  const soundEnabled = usePrefs((s) => s.soundEnabled)

  useEffect(() => {
    if (!soundEnabled) return

    let lastHover = 0
    let lastHoverEl: Element | null = null

    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest(CLICKABLE)
      if (!el) return
      if (el.getAttribute('aria-disabled') === 'true' || (el as HTMLButtonElement).disabled) return

      // Elements that already fire their own richer cue opt out of the generic
      // click so a modal open does not play two sounds.
      if (el.closest('[data-sound="custom"]')) return

      const isToggle = el.getAttribute('role') === 'switch'
      const isLink = el.tagName === 'A'
      audio.play(isToggle ? 'toggle' : isLink ? 'navigate' : 'panelOpen')
    }

    const onPointerOver = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest(HOVERABLE)
      if (!el || el === lastHoverEl) return
      lastHoverEl = el
      const now = Date.now()
      if (now - lastHover < 90) return
      lastHover = now
      audio.play('hoverTick')
    }

    document.addEventListener('click', onClick, true)
    document.addEventListener('pointerover', onPointerOver, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('pointerover', onPointerOver, true)
    }
  }, [soundEnabled])

  return null
}
