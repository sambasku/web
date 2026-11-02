import { BadgeCheck } from 'lucide-react';

/**
 * Lencana biru peran verifikator (di samping nama).
 *
 * Warna mengikuti mobile `verifierBlue` via CSS `--verifier-blue`
 * (light `#2A66FF`, dark `#5B8CFF`). Bukan hijau: hijau khusus status
 * kata approved (`CheckCircle2` di badge kata).
 */
export function VerifierMark({
  show,
  size = 16,
  label = 'Verifikator',
}: {
  show?: boolean;
  size?: number;
  label?: string;
}) {
  if (!show) return null;
  return (
    <BadgeCheck
      size={size}
      aria-label={label}
      style={{ color: 'var(--verifier-blue)', flexShrink: 0 }}
    />
  );
}
