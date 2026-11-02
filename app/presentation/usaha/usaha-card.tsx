import { Link } from 'react-router';
import { Anchor, Badge, Box, Group, Image, Stack, Text } from '@mantine/core';
import { MapPin, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Usaha, UsahaOperationalStatus } from '@/domain/usaha-parse';
import { usahaLocationLine } from '@/domain/usaha-parse';
import { useLocalePath } from '@/application/i18n/use-locale';
import { displayImageUrl } from '@/presentation/utils/display-image-url';

/**
 * Kartu usaha untuk direktori `/usaha` dan daftar terkait.
 * Ringkas: cover, nama, kategori, lokasi, badge status buka.
 */

const STATUS_COLOR: Record<UsahaOperationalStatus, string> = {
  unknown: 'gray',
  open: 'teal',
  temporarily_closed: 'orange',
  permanently_closed: 'red',
};

const STATUS_KEY: Partial<Record<UsahaOperationalStatus, string>> = {
  open: 'usaha_statusOpen',
  temporarily_closed: 'usaha_statusTemporarilyClosed',
  permanently_closed: 'usaha_statusPermanentlyClosed',
};

/// `unknown` sengaja tidak menampilkan badge: tidak ada info = tidak diklaim.
export function UsahaStatusBadge({ status }: { status: UsahaOperationalStatus }) {
  const { t } = useTranslation();
  const key = STATUS_KEY[status];
  if (!key) return null;
  return (
    <Badge variant="light" color={STATUS_COLOR[status]} size="sm" tt="none">
      {t(key)}
    </Badge>
  );
}

export function UsahaCard({ usaha }: { usaha: Usaha }) {
  const lp = useLocalePath();
  const cover = usaha.coverUrl
    ? displayImageUrl(usaha.coverUrl, { width: 480, height: 270 })
    : null;
  const location = usahaLocationLine(usaha);

  return (
    <Anchor
      component={Link}
      to={lp(`/usaha/${encodeURIComponent(usaha.slug)}`)}
      underline="never"
      c="inherit"
      style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}
    >
      {cover ? (
        <Image
          src={cover}
          alt={usaha.name}
          w={112}
          h={84}
          radius={12}
          fit="cover"
          loading="lazy"
          style={{ flexShrink: 0 }}
        />
      ) : (
        <Box
          w={112}
          h={84}
          bg="gray.2"
          style={{
            borderRadius: 12,
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <ShoppingBag size={22} color="var(--mantine-color-gray-5)" aria-hidden />
        </Box>
      )}
      <Stack gap={4} style={{ minWidth: 0 }}>
        <Group gap={6} wrap="wrap">
          <UsahaStatusBadge status={usaha.operationalStatus} />
          {usaha.category ? (
            <Badge variant="light" color="gray" size="sm" tt="none">
              {usaha.category.name}
            </Badge>
          ) : null}
        </Group>
        <Text component="h3" fz={{ base: 15, sm: 16 }} fw={600} lh={1.3} m={0}>
          {usaha.name}
        </Text>
        {location ? (
          <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
            <MapPin
              size={13}
              style={{ flexShrink: 0, color: 'var(--mantine-color-teal-6)' }}
              aria-hidden
            />
            <Text fz={12} c="dimmed" lineClamp={1}>
              {location}
            </Text>
          </Group>
        ) : null}
      </Stack>
    </Anchor>
  );
}
