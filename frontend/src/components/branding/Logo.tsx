import React from 'react';

type Props = {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
  size?: number;
};

export default function Logo({
  className,
  iconClassName,
  textClassName,
  showText = true,
  size = 34,
}: Props) {
  return (
    <div className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 256 256"
        aria-hidden="true"
        className={iconClassName}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="Shangreela Heights-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#5A0F22" />
            <stop offset="1" stopColor="#D8B6A4" />
          </linearGradient>
        </defs>

        <rect x="16" y="16" width="224" height="224" rx="56" fill="hsl(var(--deep-brown))" />
        <rect x="16" y="16" width="224" height="224" rx="56" fill="url(#Shangreela Heights-g)" opacity="0.12" />

        <path
          d="M78 90l18 20 32-28 32 28 18-20 10 56H68l10-56z"
          fill="none"
          stroke="url(#Shangreela Heights-g)"
          strokeWidth="10"
          strokeLinejoin="round"
        />
        <path d="M78 146h100" stroke="url(#Shangreela Heights-g)" strokeWidth="10" strokeLinecap="round" />

        <path
          d="M84 180c6 10 18 16 34 16 18 0 30-7 30-18 0-10-9-14-24-17l-10-2c-9-2-14-5-14-12 0-8 9-13 22-13 11 0 20 4 26 12"
          fill="none"
          stroke="#D8B6A4"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M152 204v-58c0-12 9-20 22-20 10 0 18 5 22 13"
          fill="none"
          stroke="#D8B6A4"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {showText ? (
        <span className={`font-serif font-bold tracking-wide ${textClassName ?? ''}`}>Shangreela Heights</span>
      ) : null}
    </div>
  );
}

