import Logo from './Logo';

type Variant = 'sidebar' | 'header' | 'landing';

const styles: Record<
  Variant,
  { logo: number; title: string; bbq: string; sub: string; gap: string; stack: string }
> = {
  sidebar: {
    logo: 32,
    title: 'font-serif font-bold text-[13px] leading-tight tracking-tight text-sidebar-foreground',
    bbq: 'text-[9px] font-bold tracking-wide uppercase text-sidebar-foreground/80',
    sub: 'text-[11px] font-medium text-sidebar-foreground/70 leading-tight',
    gap: 'gap-2.5',
    stack: 'gap-0',
  },
  header: {
    logo: 22,
    title: 'font-serif font-bold text-[12px] leading-tight tracking-tight text-primary',
    bbq: 'text-[7px] font-semibold tracking-[0.28em] uppercase text-primary',
    sub: 'text-[9px] font-medium text-muted-foreground leading-tight',
    gap: 'gap-2',
    stack: 'gap-0',
  },
  landing: {
    logo: 40,
    title: 'font-serif font-bold text-xl lg:text-2xl leading-tight tracking-tight text-primary',
    bbq: 'text-[9px] font-semibold tracking-[0.28em] uppercase text-primary',
    sub: 'text-sm lg:text-[15px] font-medium text-muted-foreground leading-snug',
    gap: 'gap-3',
    stack: 'gap-1',
  },
};

/**
 * Restaurant lockup: Shangreela Heights (serif) · BBQ (small, centered) · Shinwari Restaurant (sans).
 */
export function BrandHeader({ variant }: { variant: Variant }) {
  const s = styles[variant];
  const logoTone = variant === 'sidebar' ? 'text-sidebar-foreground' : 'text-primary';
  return (
    <div className={`flex items-center ${s.gap} min-w-0`}>
      <Logo size={s.logo} showText={false} className={`shrink-0 ${logoTone}`} iconClassName="shrink-0" />
      <div className={`flex min-w-0 flex-1 flex-col ${s.stack} text-left`}>
        <span className={s.title}>Shangreela Heights</span>
        <span className={`${s.bbq} w-full text-center`}>BBQ</span>
        <span className={s.sub}>Shinwari Restaurant</span>
      </div>
    </div>
  );
}
