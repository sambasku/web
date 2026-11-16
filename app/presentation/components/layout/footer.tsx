import { Link } from 'react-router';
import { Anchor, Container, Divider, Group, Stack, Text } from '@mantine/core';
import { Heart, ExternalLink, Rss } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Logo } from './logo';
import { useLocalePath } from '@/application/i18n/use-locale';
import { withSambaskuUtm } from '@/presentation/utils/external-link';
import { HOME_NAV_HUBS } from '@/application/utils/seo';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useTranslation();
  const lp = useLocalePath();

  // Hub sitelinks dulu (sama HOME_NAV_HUBS), lalu utilitas.
  const links = [
    ...HOME_NAV_HUBS.map((hub) => ({
      to: lp(hub.bare),
      label: t(hub.labelKey),
    })),
    { to: lp('/kontribusi'), label: t('nav_contribute') },
    { to: lp('/ruang-diskusi'), label: t('nav_ask') },
    { to: lp('/privacy-policy'), label: t('nav_privacy') },
  ];

  return (
    <Container size="md" py="md" component="footer">
      <Stack gap="sm" align="center">
        <Anchor
          component={Link}
          to={lp('/')}
          underline="never"
          aria-label={t('nav_homeAria')}
        >
          <Group gap="xs" justify="center">
            <Logo h={28} />
            <Text size="sm" c="dimmed" visibleFrom="xs">
              {t('common_tagline')}
            </Text>
          </Group>
        </Anchor>

        <Group gap="md" justify="center">
          {links.map((link) => (
            <Anchor
              key={link.to}
              component={Link}
              to={link.to}
              size="xs"
              c="dimmed"
              py={4}
            >
              {link.label}
            </Anchor>
          ))}
          <Anchor
            href={withSambaskuUtm('https://github.com/sambasku#organisasi')}
            target="_blank"
            rel="noopener noreferrer"
            size="xs"
            c="dimmed"
            py={4}
          >
            <Group gap={4} wrap="nowrap">
              <ExternalLink size={13} aria-hidden />
              {t('nav_github')}
            </Group>
          </Anchor>
          <Anchor
            href={withSambaskuUtm('https://github.com/sambasku#sejarah')}
            target="_blank"
            rel="noopener noreferrer"
            size="xs"
            c="dimmed"
            py={4}
          >
            <Group gap={4} wrap="nowrap">
              <ExternalLink size={13} aria-hidden />
              {t('nav_history')}
            </Group>
          </Anchor>
          {/* Feed publik tanpa prefix locale (data kamus identik antar locale). */}
          <Anchor href="/rss.xml" size="xs" c="dimmed" py={4}>
            <Group gap={4} wrap="nowrap">
              <Rss size={13} aria-hidden />
              {t('nav_rss')}
            </Group>
          </Anchor>
        </Group>
      </Stack>

      <Divider my="sm" />

      <Stack gap={4} align="center">
        <Text size="xs" c="dimmed" ta="center">
          {t('common_copyright', { year: currentYear })}
          {' · '}
          <Anchor
            href={withSambaskuUtm(
              'https://creativecommons.org/licenses/by-sa/4.0/deed.id',
            )}
            target="_blank"
            rel="noopener noreferrer license"
            size="xs"
            c="dimmed"
            aria-label={t('common_licenseAria')}
          >
            {t('common_license')}
          </Anchor>
          {' · '}
          <Anchor component={Link} to={lp('/hapus-akun')} size="xs" c="dimmed">
            {t('common_deleteAccount')}
          </Anchor>
        </Text>
        <Group gap={4} wrap="nowrap" justify="center">
          <Text size="xs" c="dimmed">
            {t('common_madeWith')}
          </Text>
          <Heart
            size={12}
            color="var(--mantine-color-red-5)"
            fill="var(--mantine-color-red-5)"
            aria-hidden
          />
          <Text size="xs" c="dimmed">
            {t('common_forLanguagePreservation')}
          </Text>
        </Group>
      </Stack>
    </Container>
  );
}
