/**
 * Shared background gradient blobs for dashboard pages.
 * Renders a set of large, blurred, pulsing circles behind the page content.
 * Placed once in the dashboard layout rather than duplicated per page.
 */
export function PageBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden -z-10"
      aria-hidden
    >
      <div className="absolute -top-32 -left-32 h-[500px] w-[500px] animate-[pulse_8s_ease-in-out_infinite] rounded-full bg-primary/6 blur-3xl" />
      <div className="absolute top-1/3 -right-24 h-80 w-80 animate-[pulse_10s_ease-in-out_2s_infinite] rounded-full bg-violet-500/5 blur-3xl" />
      <div className="absolute bottom-0 left-1/4 h-72 w-72 animate-[pulse_7s_ease-in-out_1s_infinite] rounded-full bg-cyan-500/4 blur-3xl" />
    </div>
  )
}
