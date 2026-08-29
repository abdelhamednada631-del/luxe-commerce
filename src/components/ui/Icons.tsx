/**
 * One coherent icon system — minimal 1.5px stroke, geometric,
 * direction-neutral except where noted (arrows flip in RTL via .rtl-flip).
 */
type IconProps = { className?: string; size?: number };

function base(size = 20, className = ''): React.SVGProps<SVGSVGElement> & { width: number; height: number } {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true
  };
}

export function SearchIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

export function BagIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M6 8h12l-1 12H7L6 8z" />
      <path d="M9 8V6a3 3 0 016 0v2" />
    </svg>
  );
}

export function HeartIcon({ className, size, filled }: IconProps & { filled?: boolean }) {
  return (
    <svg {...base(size, className)} fill={filled ? 'currentColor' : 'none'}>
      <path d="M12 20s-7-4.5-9-9c-1.2-2.8.6-6 3.7-6 2 0 3.3 1 4.3 2.6h2C14 6 15.3 5 17.3 5c3.1 0 4.9 3.2 3.7 6-2 4.5-9 9-9 9z" />
    </svg>
  );
}

export function MenuIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M4 7h16M4 12h16M4 17h10" />
    </svg>
  );
}

export function CloseIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function ArrowIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, `${className ?? ''} rtl-flip`)}>
      <path d="M4 12h16M14 6l6 6-6 6" />
    </svg>
  );
}

export function ChevronDownIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function PlusIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function MinusIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function TrashIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M5 7h14M10 7V5h4v2M8 7l1 13h6l1-13" />
    </svg>
  );
}

export function InstagramIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17" cy="7" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function FacebookIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M14 8h2V5h-2a4 4 0 00-4 4v2H8v3h2v6h3v-6h2.4l.6-3H13V9a1 1 0 011-1z" />
    </svg>
  );
}

export function TikTokIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M14 4v9.5a3.5 3.5 0 11-3.5-3.5" />
      <path d="M14 6.5A4.5 4.5 0 0018.5 9" />
    </svg>
  );
}

export function XIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  );
}

export function YoutubeIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <rect x="3" y="6" width="18" height="12" rx="3" />
      <path d="M10 9.5l5 2.5-5 2.5v-5z" />
    </svg>
  );
}

export function WhatsappIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 4a8 8 0 00-6.9 12L4 20l4.1-1A8 8 0 1012 4z" />
      <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5.6 0 1-.4 1-1l-1.5-1-1 .8c-1-.5-1.8-1.3-2.3-2.3l.8-1-1-1.5c-.6 0-1 .4-1 1-.5 0-.5 0-.5.5z" />
    </svg>
  );
}

export function PhoneIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M6 4h4l1.5 4L9 10a12 12 0 005 5l2-2.5 4 1.5v4a2 2 0 01-2 2A16 16 0 014 6a2 2 0 012-2z" />
    </svg>
  );
}

export function MailIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <rect x="4" y="6" width="16" height="12" rx="1" />
      <path d="M4 7l8 6 8-6" />
    </svg>
  );
}

export function PinIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 21s-6-5.3-6-10a6 6 0 1112 0c0 4.7-6 10-6 10z" />
      <circle cx="12" cy="11" r="2" />
    </svg>
  );
}

export function CheckIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function AlertIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16.5v.5" />
    </svg>
  );
}

export function UploadIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 16V5M8 9l4-4 4 4" />
      <path d="M5 15v3a2 2 0 002 2h10a2 2 0 002-2v-3" />
    </svg>
  );
}

export function EditIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M4 20h4l10-10-4-4L4 16v4z" />
      <path d="M13 7l4 4" />
    </svg>
  );
}

export function EyeIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function EyeOffIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M4 4l16 16" />
      <path d="M10.6 6c.5-.1.9-.1 1.4-.1 6 0 9.5 6.1 9.5 6.1s-1 1.8-2.7 3.4M6.6 7.9C4.2 9.6 2.5 12 2.5 12S6 18.1 12 18.1c1.4 0 2.7-.4 3.8-.9" />
      <path d="M9.9 10.1a3 3 0 004.2 4.2" />
    </svg>
  );
}

export function TelegramIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M21 4L3 11l5 2 2 6 3-4 5 3 3-14z" />
      <path d="M8 13l9-7-6 9" />
    </svg>
  );
}

export function BoxIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M4 8l8-4 8 4v8l-8 4-8-4V8z" />
      <path d="M4 8l8 4 8-4M12 12v8" />
    </svg>
  );
}

export function GridIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <rect x="4" y="4" width="7" height="7" />
      <rect x="13" y="4" width="7" height="7" />
      <rect x="4" y="13" width="7" height="7" />
      <rect x="13" y="13" width="7" height="7" />
    </svg>
  );
}

export function LayersIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 4l8 4-8 4-8-4 8-4z" />
      <path d="M4 12l8 4 8-4M4 16l8 4 8-4" />
    </svg>
  );
}

export function SparkleIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 4l1.8 5.2L19 11l-5.2 1.8L12 18l-1.8-5.2L5 11l5.2-1.8L12 4z" />
    </svg>
  );
}

export function LockIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <rect x="5" y="10" width="14" height="10" rx="1" />
      <path d="M8 10V7a4 4 0 018 0v3" />
    </svg>
  );
}
