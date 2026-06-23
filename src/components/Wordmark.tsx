export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`wordmark ${className}`}>
      <span className="ri">ri</span>
      <span className="sky">sky</span>
    </span>
  );
}
