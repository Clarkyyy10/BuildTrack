import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

/* Lightweight stroke icon set (consistent 24-grid, currentColor). */
function Base({ children, size = 20, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconHome = (p: IconProps) => (
  <Base {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M9.5 21v-6h5v6" /></Base>
);
export const IconFolder = (p: IconProps) => (
  <Base {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /></Base>
);
export const IconBell = (p: IconProps) => (
  <Base {...p}><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M10 20a2 2 0 0 0 4 0" /></Base>
);
export const IconMail = (p: IconProps) => (
  <Base {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></Base>
);
export const IconClock = (p: IconProps) => (
  <Base {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Base>
);
export const IconUser = (p: IconProps) => (
  <Base {...p}><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" /></Base>
);
export const IconSettings = (p: IconProps) => (
  <Base {...p}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" /></Base>
);
export const IconLogout = (p: IconProps) => (
  <Base {...p}><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 12H3" /><path d="m6 8-4 4 4 4" /></Base>
);
export const IconPrinter = (p: IconProps) => (
  <Base {...p}><path d="M6 9V3h12v6" /><path d="M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="7" rx="1" /></Base>
);
export const IconPlus = (p: IconProps) => (
  <Base {...p}><path d="M12 5v14M5 12h14" /></Base>
);
export const IconMenu = (p: IconProps) => (
  <Base {...p}><path d="M4 6h16M4 12h16M4 18h16" /></Base>
);
export const IconSearch = (p: IconProps) => (
  <Base {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Base>
);
export const IconCamera = (p: IconProps) => (
  <Base {...p}><path d="M4 8a2 2 0 0 1 2-2h1.5l1-1.5h5l1 1.5H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" /><circle cx="12" cy="12.5" r="3.2" /></Base>
);
