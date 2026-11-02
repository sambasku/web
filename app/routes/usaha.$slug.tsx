import { useEffect } from 'react';
import { Link, useLoaderData } from 'react-router';
import {
  Anchor,
  Badge,
  Breadcrumbs,
  Button,
  Container,
  Divider,
  Group,
  Image,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { ArrowLeft, Globe, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Route } from './+types/usaha.$slug';
import { buildMetaTags } from '@/application/utils/seo';
import {
  buildUsahaJsonLd,
  buildUsahaSeoCopy,
} from '@/application/utils/usaha-seo';
import { usahaSeoLabels } from '@/application/utils/usaha-seo-labels';
import {
  DEFAULT_LOCALE,
  isAppLocale,
  localePath,
} from '@/application/i18n/locales';
import { getFixedT } from '@/application/i18n/i18n-instance';
import { useLocalePath } from '@/application/i18n/use-locale';
import { fetchUsahaBySlug } from '@/domain/usaha';
import { usahaKindLabel, usahaLocationLine } from '@/domain/usaha-parse';
import { env } from '@/infrastructure/config/env';
import {
  AnalyticsEvents,
  trackEvent,
} from '@/infrastructure/analytics/analytics';
import { displayImageUrl } from '@/presentation/utils/display-image-url';
import { safeExternalUrl } from '@/presentation/utils/safe-external-url';
import { UsahaStatusBadge } from '@/presentation/usaha/usaha-card';

export function meta({ params, loaderData }: Route.MetaArgs) {
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const t = getFixedT(locale);
  const usaha = loaderData?.usaha;
  const path = localePath(
    locale,
    `/usaha/${encodeURIComponent(params.slug ?? '')}`,
  );
  if (!usaha) {
    return buildMetaTags({
      title: t('usaha_notFoundTitle'),
      description: t('usaha_notFoundBody'),
      path,
      locale,
      noindexAlways: true,
    });
  }
  const { title, description } = buildUsahaSeoCopy(
    usaha,
    usahaSeoLabels(locale),
  );
  const cover = usaha.coverUrl
    ? displayImageUrl(usaha.coverUrl, { width: 1200 })
    : undefined;
  return [
    ...buildMetaTags({
      title,
      description,
      path,
      locale,
      ...(cover ? { image: cover } : {}),
    }),
    ...(env.isProd
      ? [
          {
            'script:ld+json': buildUsahaJsonLd(
              usaha,
              usahaSeoLabels(locale),
              locale,
            ),
          },
        ]
      : []),
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const slug = params.slug?.trim();
  if (!slug || slug.length > 400) return { usaha: null };
  const usaha = await fetchUsahaBySlug(slug, request.signal).catch(() => {
    throw new Response('Gagal memuat data usaha', { status: 503 });
  });
  return { usaha };
}

/** Link eksternal aman + UTM otomatis (rule #32, HR-01). */
function SafeExtLink({
  href,
  children,
  fw,
}: {
  href: string;
  children: React.ReactNode;
  fw?: number;
}) {
  const safe = safeExternalUrl(href);
  if (!safe) return <Text size="sm">{children}</Text>;
  return (
    <Anchor
      href={safe}
      target="_blank"
      rel="noopener noreferrer"
      size="sm"
      fw={fw}
    >
      {children}
    </Anchor>
  );
}

function waHref(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  const normalized = digits.startsWith('62')
    ? digits
    : digits.startsWith('0')
      ? `62${digits.slice(1)}`
      : digits;
  return `https://wa.me/${normalized}`;
}

function telHref(raw: string): string | null {
  const digits = raw.replace(/[^0-9+]/g, '');
  return digits ? `tel:${digits}` : null;
}

export default function UsahaDetailPage() {
  const { usaha } = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const lp = useLocalePath();

  useEffect(() => {
    if (!usaha) return;
    trackEvent(AnalyticsEvents.usahaOpen, { slug: usaha.slug });
  }, [usaha]);

  if (!usaha) {
    return (
      <Container size="md" px="md" py={44}>
        <Stack gap="md">
          <Title order={1} fw={800} size="h3">
            {t('usaha_notFoundTitle')}
          </Title>
          <Text c="dimmed">{t('usaha_notFoundBody')}</Text>
          <Anchor component={Link} to={lp('/usaha')}>
            {t('usaha_backLink')}
          </Anchor>
        </Stack>
      </Container>
    );
  }

  const cover = usaha.coverUrl
    ? displayImageUrl(usaha.coverUrl, { width: 960 })
    : null;
  const location = usahaLocationLine(usaha);
  const mapsUrl =
    safeExternalUrl(usaha.mapsUrl) ??
    (usaha.lat !== null && usaha.lng !== null
      ? safeExternalUrl(
          `https://www.google.com/maps/search/?api=1&query=${usaha.lat},${usaha.lng}`,
        )
      : undefined);
  const contacts: Array<{
    key: string;
    icon: React.ReactNode;
    label: string;
    value: string;
    href?: string;
  }> = [];
  if (usaha.phone) {
    contacts.push({
      key: 'phone',
      icon: <Phone size={16} aria-hidden />,
      label: t('usaha_contributeFieldPhone'),
      value: usaha.phone,
      href: telHref(usaha.phone) ?? undefined,
    });
  }
  if (usaha.whatsapp) {
    contacts.push({
      key: 'wa',
      icon: <MessageCircle size={16} aria-hidden />,
      label: t('usaha_contributeFieldWhatsapp'),
      value: usaha.whatsapp,
      href: safeExternalUrl(waHref(usaha.whatsapp) ?? undefined),
    });
  }
  if (usaha.website) {
    contacts.push({
      key: 'web',
      icon: <Globe size={16} aria-hidden />,
      label: t('usaha_contributeFieldWebsite'),
      value: usaha.website,
      href: safeExternalUrl(usaha.website),
    });
  }
  if (usaha.socialUrl) {
    contacts.push({
      key: 'social',
      icon: <Globe size={16} aria-hidden />,
      label: t('usaha_contributeFieldSocial'),
      value: usaha.socialUrl,
      href: safeExternalUrl(usaha.socialUrl),
    });
  }

  return (
    <Container size="md" px={0} pb={32}>
      {cover ? (
        <Image
          src={cover}
          alt={usaha.name}
          style={{ aspectRatio: '16 / 9' }}
          fit="cover"
        />
      ) : null}

      <Stack gap={0} px="md">
        <Stack gap={0} pt={12}>
          <Breadcrumbs separator="/">
            <Anchor component={Link} to={lp('/')} size="xs" c="dimmed">
              {t('word_homeCrumb')}
            </Anchor>
            <Anchor component={Link} to={lp('/usaha')} size="xs" c="dimmed">
              {t('usaha_heading')}
            </Anchor>
            <Text size="xs" fw={500} lineClamp={1}>
              {usaha.name}
            </Text>
          </Breadcrumbs>
        </Stack>

        <Title order={1} fw={800} fz={{ base: 22, sm: 30 }} lh={1.25} mt={8}>
          {usaha.name}
        </Title>

        <Group gap={6} mt={8}>
          <UsahaStatusBadge status={usaha.operationalStatus} />
          {usaha.category ? (
            <Badge variant="light" color="gray">
              {usaha.category.name}
            </Badge>
          ) : null}
          <Badge variant="light" color="gray">
            {usahaKindLabel(usaha.kind)}
          </Badge>
        </Group>

        {usaha.operationalStatus === 'permanently_closed' ? (
          <Paper withBorder radius="md" p="sm" mt={12} bg="red.0">
            <Text size="sm" c="red.9">
              {t('usaha_closedNotice')}
            </Text>
          </Paper>
        ) : null}

        {usaha.description ? (
          <Text size="sm" lh={1.6} mt={14}>
            {usaha.description}
          </Text>
        ) : null}

        <Text fw={700} mt={20}>
          {t('usaha_contactHeading')}
        </Text>
        <Paper withBorder radius="md" p="md" mt={8}>
          {contacts.length === 0 && !location ? (
            <Text size="sm" c="dimmed">
              {t('usaha_contactEmpty')}
            </Text>
          ) : (
            <Stack gap="sm">
              {location ? (
                <Group gap={8} wrap="nowrap" align="flex-start">
                  <MapPin
                    size={16}
                    style={{ flexShrink: 0, color: 'var(--mantine-color-teal-6)' }}
                    aria-hidden
                  />
                  <Stack gap={0}>
                    <Text size="sm" fw={600} lh={1.3}>
                      {location}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {usaha.village?.name ?? 'Kabupaten Sambas'}
                    </Text>
                  </Stack>
                </Group>
              ) : null}
              {contacts.map((row) => (
                <Group key={row.key} gap={8} wrap="nowrap" align="flex-start">
                  <span
                    style={{ flexShrink: 0, color: 'var(--mantine-color-teal-6)' }}
                  >
                    {row.icon}
                  </span>
                  <Stack gap={0} style={{ minWidth: 0 }}>
                    {row.href ? (
                      <SafeExtLink href={row.href} fw={600}>
                        {row.value}
                      </SafeExtLink>
                    ) : (
                      <Text size="sm" fw={600} lh={1.3}>
                        {row.value}
                      </Text>
                    )}
                    <Text size="xs" c="dimmed">
                      {row.label}
                    </Text>
                  </Stack>
                </Group>
              ))}
            </Stack>
          )}
        </Paper>

        {mapsUrl ? (
          <Button
            component="a"
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            color="teal"
            leftSection={<MapPin size={18} />}
            mt={16}
          >
            {t('usaha_mapsButton')}
          </Button>
        ) : null}

        <Divider mt={20} />
        <Text fw={700} mt={12}>
          {t('usaha_catalogHeading')}
        </Text>
        {usaha.items.length === 0 ? (
          <Text size="sm" c="dimmed" mt={4}>
            {t('usaha_catalogEmpty')}
          </Text>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" mt={8}>
            {usaha.items.map((item) => {
              const image = item.imageUrl
                ? displayImageUrl(item.imageUrl, { width: 240 })
                : null;
              return (
                <Paper key={item.id} withBorder radius="md" p="sm">
                  <Group gap={10} wrap="nowrap" align="flex-start">
                    {image ? (
                      <Image
                        src={image}
                        alt={item.name}
                        w={56}
                        h={56}
                        radius={8}
                        fit="cover"
                        loading="lazy"
                      />
                    ) : null}
                    <Stack gap={2} style={{ minWidth: 0 }}>
                      <Text size="sm" fw={600} lineClamp={2}>
                        {item.name}
                      </Text>
                      {item.description ? (
                        <Text size="xs" c="dimmed" lineClamp={2}>
                          {item.description}
                        </Text>
                      ) : null}
                      <Text size="xs" fw={600} c="teal.7">
                        {item.priceText ?? t('usaha_priceEmpty')}
                      </Text>
                    </Stack>
                  </Group>
                </Paper>
              );
            })}
          </SimpleGrid>
        )}

        <Anchor
          component={Link}
          to={lp('/usaha')}
          size="sm"
          mt={24}
          style={{ alignSelf: 'flex-start' }}
        >
          <Group gap={6} wrap="nowrap">
            <ArrowLeft size={14} aria-hidden />
            {t('usaha_backLink')}
          </Group>
        </Anchor>
      </Stack>
    </Container>
  );
}
