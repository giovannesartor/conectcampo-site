import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  variant?: 'horizontal' | 'vertical' | 'icon';
  href?: string;
  className?: string;
}

const sizes = {
  sm: { iconW: 32, fullW: 120, vertW: 100 },
  md: { iconW: 48, fullW: 180, vertW: 140 },
  lg: { iconW: 64, fullW: 260, vertW: 200 },
};

export function Logo({ size = 'md', showText = true, variant, href = '/', className = '' }: LogoProps) {
  const s = sizes[size];

  // Determina qual logo usar: variant tem prioridade, depois showText
  const resolvedVariant = variant ?? (showText ? 'horizontal' : 'icon');

  const content = resolvedVariant === 'vertical' ? (
    <Image
      src="/logo-vertical.png"
      alt="ConectCampo"
      width={s.vertW}
      height={s.vertW}
      style={{ width: s.vertW, height: 'auto' }}
      priority
    />
  ) : resolvedVariant === 'icon' ? (
    <Image
      src="/logo-icon.png"
      alt="ConectCampo"
      width={s.iconW}
      height={s.iconW}
      style={{ width: s.iconW, height: 'auto' }}
      priority
    />
  ) : (
    <Image
      src="/logo.png"
      alt="ConectCampo"
      width={s.fullW}
      height={60}
      style={{ width: s.fullW, height: 'auto' }}
      priority
    />
  );

  if (href) {
    return (
      <Link href={href} className={`inline-flex items-center ${className}`}>
        {content}
      </Link>
    );
  }

  return <div className={`inline-flex items-center ${className}`}>{content}</div>;
}
