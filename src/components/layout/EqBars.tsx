export default function EqBars({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-end gap-[3px] h-4 ${className}`} aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="eq-bar w-[3px] rounded-full bg-gradient-to-t from-[#a78bfa] to-[#00d9ff]"
          style={{ height: '100%', animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}
