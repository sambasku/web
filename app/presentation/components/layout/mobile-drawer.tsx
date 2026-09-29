import { Anchor, Box, Drawer, Group, Stack } from '@mantine/core';
import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useLocalePath } from '@/application/i18n/use-locale';
import { stripLocalePrefix } from '@/application/i18n/locales';
import { LanguageSwitcherPanel } from './language-switcher';
import { primaryNavItems } from './primary-nav-items';

/** Drawer navigasi mobile - di-split chunk terpisah (lazy). */
export function MobileDrawer({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  const location = useLocation();
  const { t } = useTranslation();
  const lp = useLocalePath();
  const navItems = primaryNavItems(t, lp);

  const isActive = (bare: string) => {
    const { path } = stripLocalePrefix(location.pathname);
    return path === bare || path.startsWith(`${bare}/`);
  };

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={t('nav_menu')}
      padding="md"
      size="xs"
      position="right"
      closeButtonProps={{ 'aria-label': t('nav_closeMenu') }}
    >
      <Stack gap="xs">
        {navItems.map((item) => (
          <Anchor
            key={item.bare}
            component={Link}
            to={item.to}
            onClick={onClose}
            underline="never"
            size="md"
            fw={isActive(item.bare) ? 600 : 400}
            c={isActive(item.bare) ? 'var(--mantine-color-text)' : 'dimmed'}
            px="sm"
            py="xs"
            style={{ borderRadius: 'var(--mantine-radius-sm)', textAlign: 'left' }}
          >
            <Group gap="sm">
              <item.icon size={18} />
              {item.label}
            </Group>
          </Anchor>
        ))}
        <Box pt="md" px="xs">
          <LanguageSwitcherPanel onPicked={onClose} />
        </Box>
      </Stack>
    </Drawer>
  );
}

export default MobileDrawer;
