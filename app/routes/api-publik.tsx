import { Link } from 'react-router';
import {
  Anchor,
  Badge,
  Code,
  Container,
  Divider,
  Group,
  List,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { CodeHighlight, CodeHighlightTabs } from '@mantine/code-highlight';
import { useTranslation } from 'react-i18next';
import type { Route } from './+types/api-publik';
import {
  API_PUBLIK_ATTRIBUTION,
  API_PUBLIK_BASE,
  API_PUBLIK_DOCS_URL,
  API_PUBLIK_INTRO,
  API_PUBLIK_OPENAPI_URL,
  API_PUBLIK_OUT_OF_SCOPE,
  API_PUBLIK_PRIMARY,
  API_PUBLIK_SECONDARY,
  API_PUBLIK_TOC,
  type ApiPublikEndpoint,
} from '@/application/utils/api-publik-content';
import { buildApiPublikJsonLd, buildMetaTags } from '@/application/utils/seo';
import { env } from '@/infrastructure/config/env';
import {
  DEFAULT_LOCALE,
  isAppLocale,
  localePath,
} from '@/application/i18n/locales';
import { getFixedT } from '@/application/i18n/i18n-instance';
import { useLocalePath } from '@/application/i18n/use-locale';
import { CodeHighlightProvider } from '@/presentation/components/code-highlight-provider';
import '@/presentation/styles/code-highlight.css';

export function meta({ params }: Route.MetaArgs) {
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const t = getFixedT(locale);
  return [
    ...buildMetaTags({
      title: t('seo_apiPublikTitle'),
      description: t('seo_apiPublikDescription'),
      path: localePath(locale, '/api-publik'),
      locale,
    }),
    ...(env.isProd
      ? [{ 'script:ld+json': buildApiPublikJsonLd(locale) }]
      : []),
  ];
}

function EndpointBlock({
  endpoint,
  primary,
  copyLabel,
  copiedLabel,
  exampleLabel,
  responseLabel,
  paramsLabel,
  expandLabel,
  collapseLabel,
}: {
  endpoint: ApiPublikEndpoint;
  primary: boolean;
  copyLabel: string;
  copiedLabel: string;
  exampleLabel: string;
  responseLabel: string;
  paramsLabel: string;
  expandLabel: string;
  collapseLabel: string;
}) {
  const curlTabs = endpoint.curls.map((curl, i) => ({
    fileName: endpoint.curls.length === 1 ? 'curl' : `curl ${i + 1}`,
    code: curl,
    language: 'bash',
  }));

  return (
    <Stack gap="md" id={endpoint.id}>
      <Stack gap={6}>
        <Title order={primary ? 2 : 3} size={primary ? 'h3' : 'h4'} fw={700}>
          {endpoint.title}
        </Title>
        <Group gap="xs" wrap="wrap">
          <Badge color="teal" variant="light" radius="sm" tt="uppercase">
            {endpoint.method}
          </Badge>
          <Code>{endpoint.path}</Code>
        </Group>
        <Text size="sm" lh={1.75}>
          {endpoint.summary}
        </Text>
      </Stack>

      {endpoint.params && endpoint.params.length > 0 ? (
        <Stack gap="xs">
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            {paramsLabel}
          </Text>
          <List size="sm" spacing="xs" withPadding>
            {endpoint.params.map((p) => (
              <List.Item key={p.name}>
                <Text size="sm" lh={1.7} component="span">
                  <Code>{p.name}</Code> - {p.detail}
                </Text>
              </List.Item>
            ))}
          </List>
        </Stack>
      ) : null}

      {endpoint.notes?.map((note, i) => (
        <Text key={`${endpoint.id}-n-${i}`} size="sm" c="dimmed" lh={1.7}>
          {note}
        </Text>
      ))}

      <Stack gap="xs">
        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
          {exampleLabel}
        </Text>
        {curlTabs.length === 1 ? (
          <CodeHighlight
            code={curlTabs[0].code}
            language="bash"
            radius="md"
            withBorder
            copyLabel={copyLabel}
            copiedLabel={copiedLabel}
          />
        ) : (
          <CodeHighlightTabs
            code={curlTabs}
            radius="md"
            withBorder
            copyLabel={copyLabel}
            copiedLabel={copiedLabel}
          />
        )}
      </Stack>

      <Stack gap="xs">
        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
          {responseLabel}
        </Text>
        <CodeHighlight
          code={endpoint.sampleJson}
          language="json"
          radius="md"
          withBorder
          withLineNumbers
          copyLabel={copyLabel}
          copiedLabel={copiedLabel}
          withExpandButton={!primary}
          defaultExpanded={primary}
          expandCodeLabel={expandLabel}
          collapseCodeLabel={collapseLabel}
        />
      </Stack>
    </Stack>
  );
}

export default function ApiPublikPage() {
  const { t } = useTranslation();
  const lp = useLocalePath();
  const copyLabel = t('apiPublik_copy');
  const copiedLabel = t('apiPublik_copied');

  return (
    <CodeHighlightProvider>
      <Container size="sm" py={44}>
        <Stack gap="xl">
          <Stack gap="xs">
            <Title order={1} fw={800}>
              {t('apiPublik_pageTitle')}
            </Title>
            <Text size="sm" c="dimmed">
              {t('apiPublik_baseUrl')}: <Code>{API_PUBLIK_BASE}</Code>
            </Text>
            {API_PUBLIK_INTRO.map((p, i) => (
              <Text key={`intro-${i}`} size="md" lh={1.7}>
                {p}
              </Text>
            ))}
            <Text size="sm" lh={1.75}>
              {API_PUBLIK_ATTRIBUTION}
            </Text>
            <Text size="sm" c="dimmed" lh={1.7}>
              {t('apiPublik_interactiveDocs')}:{' '}
              <Anchor href={API_PUBLIK_DOCS_URL} target="_blank" rel="noopener noreferrer">
                /docs
              </Anchor>
              {' · '}
              <Anchor
                href={API_PUBLIK_OPENAPI_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                openapi.json
              </Anchor>
            </Text>
          </Stack>

          <Stack gap="xs">
            <Title order={2} size="h5" fw={700}>
              {t('apiPublik_toc')}
            </Title>
            <List size="sm" spacing={4} withPadding>
              {API_PUBLIK_TOC.map((item) => (
                <List.Item key={item.id}>
                  <Anchor href={`#${item.id}`} size="sm">
                    {item.label}
                  </Anchor>
                </List.Item>
              ))}
            </List>
          </Stack>

          <Stack gap="sm" id="konvensi">
            <Title order={2} size="h3" fw={700}>
              {t('apiPublik_conventions')}
            </Title>
            <List size="sm" spacing="xs" withPadding>
              <List.Item>
                <Text size="sm" lh={1.7} component="span">
                  Envelope: <Code>{'{ success, data, meta? }'}</Code>
                </Text>
              </List.Item>
              <List.Item>
                <Text size="sm" lh={1.7} component="span">
                  Auth: tidak perlu. Rate limit 100/menit/IP; 429 +{' '}
                  <Code>Retry-After</Code>.
                </Text>
              </List.Item>
              <List.Item>
                <Text size="sm" lh={1.7} component="span">
                  Hanya kata <Code>published</Code>. Cache publik singkat pada
                  GET baca kata.
                </Text>
              </List.Item>
            </List>
            <CodeHighlight
              code={`curl -sS -D - '${API_PUBLIK_BASE}/words/search?q=cawan&limit=1' -o /dev/null`}
              language="bash"
              radius="md"
              withBorder
              copyLabel={copyLabel}
              copiedLabel={copiedLabel}
            />
          </Stack>

          <Divider />

          {API_PUBLIK_PRIMARY.map((endpoint) => (
            <EndpointBlock
              key={endpoint.id}
              endpoint={endpoint}
              primary
              copyLabel={copyLabel}
              copiedLabel={copiedLabel}
              exampleLabel={t('apiPublik_example')}
              responseLabel={t('apiPublik_response')}
              paramsLabel={t('apiPublik_params')}
              expandLabel={t('apiPublik_expand')}
              collapseLabel={t('apiPublik_collapse')}
            />
          ))}

          <Stack gap="md">
            <Title order={2} size="h3" fw={700}>
              {t('apiPublik_alsoAvailable')}
            </Title>
            {API_PUBLIK_SECONDARY.map((endpoint) => (
              <EndpointBlock
                key={endpoint.id}
                endpoint={endpoint}
                primary={false}
                copyLabel={copyLabel}
                copiedLabel={copiedLabel}
                exampleLabel={t('apiPublik_example')}
                responseLabel={t('apiPublik_response')}
                paramsLabel={t('apiPublik_params')}
                expandLabel={t('apiPublik_expand')}
                collapseLabel={t('apiPublik_collapse')}
              />
            ))}
          </Stack>

          <Text size="sm" c="dimmed" lh={1.7}>
            {API_PUBLIK_OUT_OF_SCOPE}
          </Text>

          <Text size="sm" c="dimmed">
            <Anchor component={Link} to={lp('/words')}>
              {t('nav_words')}
            </Anchor>
            {' · '}
            <Anchor component={Link} to={lp('/faq')}>
              {t('nav_faq')}
            </Anchor>
            {' · '}
            <Anchor href="/llms-full.txt" size="sm">
              llms-full.txt
            </Anchor>
            {' · '}
            <Anchor component={Link} to={lp('/')}>
              {t('common_backHome')}
            </Anchor>
          </Text>
        </Stack>
      </Container>
    </CodeHighlightProvider>
  );
}
