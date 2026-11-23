import { ShadowMark } from '@/components/brand/Logo'

export function PageLoader({ label = 'INITIALIZING MODULE' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <ShadowMark size={44} animated />
      <div className="w-52">
        <div className="h-[2px] w-full overflow-hidden bg-[#16212b]">
          <div className="h-full w-1/2 animate-[loaderSlide_1.1s_ease-in-out_infinite] bg-[var(--accent)]" />
        </div>
        <p className="mt-2 text-center font-mono text-[9px] uppercase tracking-[0.28em] text-ink-3">{label}</p>
      </div>
      <style>{`@keyframes loaderSlide{0%{transform:translateX(-110%)}100%{transform:translateX(220%)}}`}</style>
    </div>
  )
}
