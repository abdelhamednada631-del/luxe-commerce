/**
 * Admin icon re-exports — the shared icon system (ui/Icons) already covers
 * nearly everything; only genuinely new glyphs are defined here.
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

export function FileTextIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M6 3h9l4 4v14H6V3z" />
      <path d="M15 3v4h4M9 12h7M9 16h7" />
    </svg>
  );
}

export {
  GridIcon,
  BoxIcon,
  LayersIcon,
  SparkleIcon,
  EyeIcon,
  EditIcon,
  TelegramIcon,
  ArrowIcon,
  PlusIcon,
  TrashIcon,
  UploadIcon,
  CheckIcon,
  AlertIcon,
  LockIcon,
  BagIcon
} from '@/components/ui/Icons';
