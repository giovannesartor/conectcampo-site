import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  href?: string;
  className?: string;
}

const sizes = {
  sm: { iconW: 32, fullW: 120 },
  md: { iconW: 40, fullW: 155 },
  lg: { iconW: 56, fullW: 210 },
};

export function Logo({ size = 'md', showText = true, href = '/', className = '' }: LogoProps) {
  const s = sizes[size];

  const content = showText ? (
    <Image
      src="/logo.svg"
      alt="ConectCampo"
      width={s.fullW}
      height={40}
      style={{ width: s.fullW, height: 'auto' }}
      priority
    />
  ) : (
    <Image
      src="/logo-icon.svg"
      alt="ConectCampo"
      width={s.iconW}
      height={s.iconW}
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
