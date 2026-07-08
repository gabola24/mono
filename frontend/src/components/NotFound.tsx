export default function NotFound() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-muse-bg gap-6">
      <pre className="font-mono text-[11px] leading-tight text-center" style={{ color: 'var(--color-pixel-pink)' }}>{
`╔═══════════╗
║  4  0  4  ║
╚═══════════╝`
      }</pre>
      <p className="pixel-text text-[9px] text-muse-text-dim">page not found</p>
      <a href="/" className="pixel-btn text-[9px]">← go home</a>
    </div>
  )
}
