export interface Shortcut {
  keys: string
  label: string
  group: string
}

export const SHORTCUTS: Shortcut[] = [
  { keys: 'Ctrl / ⌘ + K', label: 'Open command palette', group: 'Global' },
  { keys: '/', label: 'Focus global search', group: 'Global' },
  { keys: 'Ctrl / ⌘ + B', label: 'Toggle sidebar', group: 'Global' },
  { keys: 'Ctrl / ⌘ + N', label: 'Open notification center', group: 'Global' },
  { keys: 'Ctrl / ⌘ + M', label: 'Mute / unmute sound', group: 'Global' },
  { keys: 'Ctrl / ⌘ + Shift + F', label: 'Toggle fullscreen', group: 'Global' },
  { keys: 'Ctrl / ⌘ + Shift + C', label: 'Toggle cinematic mode', group: 'Global' },
  { keys: 'Ctrl / ⌘ + Shift + E', label: 'Toggle emergency mode', group: 'Global' },
  { keys: 'Ctrl / ⌘ + Shift + R', label: 'Reset demonstration', group: 'Global' },
  { keys: 'Esc', label: 'Close overlay / modal', group: 'Global' },
  { keys: 'G then C', label: 'Go to command center', group: 'Navigation' },
  { keys: 'G then F', label: 'Go to financial systems', group: 'Navigation' },
  { keys: 'G then T', label: 'Go to terminal', group: 'Navigation' },
  { keys: 'G then M', label: 'Go to mission control', group: 'Navigation' },
  { keys: 'G then G', label: 'Go to global intelligence map', group: 'Navigation' },
  { keys: 'G then S', label: 'Go to surveillance', group: 'Navigation' },
  { keys: '↑ / ↓', label: 'Move through results', group: 'Search' },
  { keys: 'Enter', label: 'Open selected result', group: 'Search' },
  { keys: 'Ctrl + L', label: 'Clear terminal (terminal page)', group: 'Terminal' },
  { keys: 'Tab', label: 'Autocomplete command (terminal)', group: 'Terminal' },
]
