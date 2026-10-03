import { Link } from 'react-router';
import {
  Anchor,
  Avatar,
  Badge,
  Card,
  Container,
  Group,
  Stack,
  Tabs,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { ExternalLink, Info } from 'lucide-react';
import { useLoaderData } from 'react-router';
import type { Route } from './+types/kontributor';
import { buildMetaTags } from '@/application/utils/seo';
import {
  DEFAULT_LOCALE,
  isAppLocale,
  localePath,
} from '@/application/i18n/locales';
import { useLocalePath } from '@/application/i18n/use-locale';
import {
  listSponsors,
  type Sponsor,
} from '@/application/use-cases/sponsor.use-case';
import {
  listContributors,
  type Contributor,
} from '@/application/use-cases/contributor.use-case';
import { displayImageUrl } from '@/presentation/utils/display-image-url';

export async function loader({ request }: Route.LoaderArgs) {
  const [sponsors, contributors] = await Promise.all([
    listSponsors(request.signal),
    listContributors(request.signal),
  ]);
  return { sponsors, contributors };
}

export function meta({ params }: Route.MetaArgs) {
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  return [
    ...buildMetaTags({
      title: 'Sponsor & Tim Kami SambasKu',
      description:
        'Para pendukung operasional, mitra, dan orang-orang yang terlibat langsung membangun SambasKu: pendanaan, kerja sama, pengembangan aplikasi, dan rekam pelafalan bahasa Melayu Sambas.',
      path: localePath(locale, '/kontributor'),
      locale,
    }),
  ];
}

function SponsorCard({ sponsor }: { sponsor: Sponsor }) {
  const name = (
    <Group gap={6} wrap="nowrap">
      <Text fw={700} size="md">
        {sponsor.name}
      </Text>
      {sponsor.url ? <ExternalLink size={14} aria-hidden /> : null}
    </Group>
  );

  return (
    <Card withBorder radius="md" padding="md">
      <Group gap="md" wrap="nowrap" align="flex-start">
        <Avatar
          src={displayImageUrl(sponsor.logoUrl, { width: 96, height: 96 })}
          name={sponsor.name}
          size="lg"
          radius="sm"
          mt={2}
        />
        <Stack gap={4} style={{ minWidth: 0 }}>
          {sponsor.url ? (
            <Anchor
              href={sponsor.url}
              target="_blank"
              rel="noopener noreferrer"
              c="inherit"
              underline="never"
            >
              {name}
            </Anchor>
          ) : (
            name
          )}
          {sponsor.description ? (
            <Text size="sm" c="dimmed" lh={1.6}>
              {sponsor.description}
            </Text>
          ) : null}
          <Text size="sm" lh={1.6}>
            {sponsor.note}
          </Text>
        </Stack>
      </Group>
    </Card>
  );
}

function ContributorCard({ contributor }: { contributor: Contributor }) {
  const name = (
    <Group gap={6} wrap="nowrap">
      <Text fw={700} size="md">
        {contributor.name}
      </Text>
      {contributor.url ? <ExternalLink size={14} aria-hidden /> : null}
    </Group>
  );

  return (
    <Card withBorder radius="md" padding="md">
      <Group gap="md" wrap="nowrap" align="flex-start">
        <Avatar
          src={contributor.avatarUrl}
          name={contributor.name}
          size="lg"
          radius="xl"
          mt={2}
        />
        <Stack gap={4} style={{ minWidth: 0 }}>
          {contributor.url ? (
            <Anchor
              href={contributor.url}
              target="_blank"
              rel="noopener noreferrer"
              c="inherit"
              underline="never"
            >
              {name}
            </Anchor>
          ) : (
            name
          )}
          <Group gap={6}>
            {contributor.roles.map((role) => (
              <Badge key={role} variant="light" size="sm">
                {role}
              </Badge>
            ))}
          </Group>
          <Text size="sm" lh={1.6}>
            {contributor.note}
          </Text>
        </Stack>
      </Group>
    </Card>
  );
}

export default function SponsorshipTeamPage() {
  const { sponsors, contributors } = useLoaderData<typeof loader>();
  const lp = useLocalePath();

  return (
    <Container size="sm" py={44}>
      <Stack gap="lg">
        <Stack gap="xs">
          <Title order={1} fw={800}>
            Sponsor & Tim Kami
          </Title>
          <Text c="dimmed" size="md" lh={1.7}>
            SambasKu bisa jalan berkat dukungan para pendana, mitra, dan
            orang-orang yang menyumbangkan waktu dan tenaganya.
          </Text>
        </Stack>

        <Tabs defaultValue="sponsor" keepMounted={false}>
          <Tabs.List>
            <Tabs.Tab value="sponsor">Sponsor &amp; Mitra</Tabs.Tab>
            <Tabs.Tab value="tim">Tim Kami</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="sponsor" pt="md">
            <Stack gap="sm">
              <Group gap={6} wrap="nowrap">
                <Text size="sm" c="dimmed">
                  Sponsor dan mitra yang mendukung operasional SambasKu.
                </Text>
                <Tooltip
                  multiline
                  w={280}
                  withArrow
                  position="bottom-end"
                  label="Sponsor: pemberi dana atau barang untuk biaya operasional (domain, server, honorarium). Mitra: rekan kerja sama yang berkontribusi dana, tenaga, materi, atau data - misal lembaga yang berbagi data, sekolah yang memakai kamus ini untuk belajar, atau komunitas yang membantu verifikasi. Nama semua pendukung kami cantumkan sebagai apresiasi atas dukungannya."
                >
                  <Info size={14} style={{ flexShrink: 0, cursor: 'help' }} />
                </Tooltip>
              </Group>
              {sponsors.length > 0 ? (
                sponsors.map((sponsor) => (
                  <SponsorCard key={sponsor.id} sponsor={sponsor} />
                ))
              ) : (
                <Text c="dimmed" size="sm">
                  Belum ada sponsor yang tercatat. Kamu bisa menjadi
                  pendukung pertama kami.
                </Text>
              )}
              <Text size="xs" c="dimmed">
                Semua dana cuma dipakai untuk biaya operasional, seperti
                domain dan server, dan catatan lengkapnya terbuka di{' '}
                <Anchor
                  href="https://github.com/sambasku#kas-publik"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Kas Publik
                </Anchor>
                .
              </Text>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="tim" pt="md">
            <Stack gap="sm">
              <Text size="sm" c="dimmed">
                Orang-orang yang membangun dan merawat SambasKu.
              </Text>
              {contributors.length > 0 ? (
                contributors.map((contributor) => (
                  <ContributorCard
                    key={contributor.id}
                    contributor={contributor}
                  />
                ))
              ) : (
                <Text c="dimmed" size="sm">
                  Belum ada anggota tim yang tercatat.
                </Text>
              )}
            </Stack>
          </Tabs.Panel>
        </Tabs>

        <Text size="sm" c="dimmed">
          <Anchor component={Link} to={lp('/faq')}>
            FAQ
          </Anchor>
          {' · '}
          <Anchor component={Link} to={lp('/')}>
            Kembali ke Beranda
          </Anchor>
        </Text>
      </Stack>
    </Container>
  );
}
