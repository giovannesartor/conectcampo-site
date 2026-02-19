import Link from 'next/link';

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
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.svg"
      alt="ConectCampo"
      width={s.fullW}
      style={{ width: s.fullW, height: 'auto' }}
      loading="eager"
    />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-icon.svg"
      alt="ConectCampo"
      width={s.iconW}
      height={s.iconW}
      loading="eager"
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
