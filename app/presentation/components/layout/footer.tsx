import { Link } from 'react-router';
import { Anchor, Container, Divider, Group, Stack, Text } from '@mantine/core';
import { Heart, ExternalLink, Rss } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Logo } from './logo';
import { useLocalePath } from '@/application/i18n/use-locale';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useTranslation();
  const lp = useLocalePath();

  const links = [
    { to: lp('/words'), label: t('nav_words') },
    { to: lp('/kontribusi'), label: t('nav_contribute') },
    { to: lp('/wisata'), label: t('nav_places') },
    { to: lp('/ruang-diskusi'), label: t('nav_ask') },
    { to: lp('/faq'), label: t('nav_faq') },
    { to: lp('/api-publik'), label: t('nav_apiPublik') },
    { to: lp('/privacy-policy'), label: t('nav_privacy') },
  ] as const;

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
            href="https://github.com/sambasku#organisasi"
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
