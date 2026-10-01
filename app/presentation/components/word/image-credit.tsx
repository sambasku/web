import { Anchor, Text } from '@mantine/core';
import { ExternalLink } from 'lucide-react';
import type { WordImageAttribution } from '@/domain/entities/word.entity';

const UTM = 'utm_source=sambasku&utm_medium=referral';

const PROVIDER_HOME: Record<string, { label: string; url: string }> = {
  unsplash: { label: 'Unsplash', url: `https://unsplash.com/?${UTM}` },
  pixabay: { label: 'Pixabay', url: 'https://pixabay.com/' },
  pexels: { label: 'Pexels', url: 'https://www.pexels.com/' },
  wikimedia: { label: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/' },
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Unsplash API Guidelines: link profil fotografer wajib ber-UTM. */
function withUtm(url: string, provider: string): string {
  if (provider !== 'unsplash' || url.includes('utm_source=')) return url;
  return `${url}${url.includes('?') ? '&' : '?'}${UTM}`;
}

const linkIcon = (
  <ExternalLink size="0.85em" aria-hidden style={{ marginLeft: 2, verticalAlign: '-0.1em' }} />
);

function ExtLink({ href, children }: { href?: string; children: string }) {
  if (!href) return <>{children}</>;
  return (
    <Anchor href={href} target="_blank" rel="noopener noreferrer" inherit>
      {children}
      {linkIcon}
    </Anchor>
  );
}

/**
 * Kredit foto stock sesuai provider: Unsplash "Foto oleh X di Unsplash"
 * (UTM), Openverse "... di {sumber} · {lisensi}", Pixabay "... di Pixabay".
 */
export function ImageCredit({ attribution }: { attribution: WordImageAttribution }) {
  const { provider, name, url, license, license_url, source } = attribution;
  const home = PROVIDER_HOME[provider];
  return (
    <Text size="xs" c="dimmed" lineClamp={2}>
      Foto oleh <ExtLink href={url ? withUtm(url, provider) : undefined}>{name}</ExtLink> di{' '}
      {home ? (
        <ExtLink href={home.url}>{home.label}</ExtLink>
      ) : (
        capitalize(source || provider)
      )}
      {license ? (
        <>
          {' · '}
          <ExtLink href={license_url}>{license}</ExtLink>
        </>
      ) : null}
    </Text>
  );
}
