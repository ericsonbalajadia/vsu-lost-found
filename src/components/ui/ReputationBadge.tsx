// src/components/ui/ReputationBadge.tsx
interface ReputationBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

function getStyle(score: number) {
  if (score >= 150) {
    return { color: 'var(--color-success)', background: 'var(--color-success-container)', label: 'Trusted' };
  }
  if (score >= 100) {
    return { color: 'var(--color-primary)', background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', label: 'Good' };
  }
  if (score >= 50) {
    return { color: 'var(--color-warning)', background: 'var(--color-warning-container)', label: 'Fair' };
  }
  return { color: 'var(--color-error)', background: 'color-mix(in srgb, var(--color-error) 10%, transparent)', label: 'New' };
}

const sizeMap = {
  sm: 'text-[10px] px-1.5 py-0.5 gap-1',
  md: 'text-xs px-2.5 py-1 gap-1.5',
  lg: 'text-sm px-3 py-1.5 gap-2',
};

export default function ReputationBadge({ score, size = 'md', showLabel = false }: ReputationBadgeProps) {
  const style = getStyle(score);
  const starSize = size === 'sm' ? '11px' : size === 'md' ? '14px' : '16px';

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full border ${sizeMap[size]}`}
      style={{ color: style.color, backgroundColor: style.background, borderColor: `color-mix(in srgb, ${style.color} 25%, transparent)` }}
      title={`Reputation: ${score} — ${style.label}`}
    >
      <span
        className="material-symbols-outlined leading-none"
        style={{ fontSize: starSize, fontVariationSettings: "'FILL' 1" }}
        aria-hidden="true"
      >
        star
      </span>
      {score}
      {showLabel && <span className="font-medium opacity-70 ml-0.5">{style.label}</span>}
    </span>
  );
}