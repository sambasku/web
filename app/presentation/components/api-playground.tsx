import { useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Code,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import {
  API_PUBLIK_PRIMARY,
  API_PUBLIK_SECONDARY,
  buildApiPublikRequestUrl,
  splitApiPublikParams,
} from '@/application/utils/api-publik-content';
import { CodeHighlightProvider } from '@/presentation/components/code-highlight-provider';

export interface ApiPlaygroundLabels {
  intro: string;
  endpointLabel: string;
  run: string;
  running: string;
  duration: string;
  requestUrl: string;
  responsePreview: string;
  networkError: string;
}

interface RunResult {
  ok: boolean;
  status: number;
  statusText: string;
  durationMs: number;
  body: string;
}

const ALL_ENDPOINTS = [...API_PUBLIK_PRIMARY, ...API_PUBLIK_SECONDARY];

/** Fetch + ukur durasi. Di luar component agar react-hooks/purity tenang. */
async function runRequest(url: string): Promise<RunResult> {
  const startedAt = performance.now();
  try {
    const res = await fetch(url);
    const body = await res.text();
    let pretty = body;
    try {
      pretty = JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      // ponytail: fallback raw text; semua endpoint API balas JSON
    }
    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      durationMs: Math.round(performance.now() - startedAt),
      body: pretty,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      statusText: 'Network Error',
      durationMs: Math.round(performance.now() - startedAt),
      body: '',
    };
  }
}

export function ApiPlayground({ labels }: { labels: ApiPlaygroundLabels }) {
  const [endpointId, setEndpointId] = useState(ALL_ENDPOINTS[0].id);
  const endpoint = useMemo(
    () => ALL_ENDPOINTS.find((e) => e.id === endpointId) ?? ALL_ENDPOINTS[0],
    [endpointId],
  );
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [networkError, setNetworkError] = useState(false);

  const { pathParamNames, queryParamNames } = splitApiPublikParams(endpoint);

  function updateParam(name: string, value: string) {
    setParamValues((prev) => ({ ...prev, [name]: value }));
  }

  const built = buildApiPublikRequestUrl(endpoint, paramValues);

  async function run() {
    if ('error' in built) {
      setResult({
        ok: false,
        status: 0,
        statusText: 'Input',
        durationMs: 0,
        body: built.error,
      });
      return;
    }

    setRunning(true);
    const result = await runRequest(built.url);
    setNetworkError(result.status === 0);
    setResult(result.status === 0 ? null : result);
    setRunning(false);
  }

  const requestUrl = 'url' in built ? built.url : built.error;

  return (
    <CodeHighlightProvider>
      <Stack gap="md">
        <Text size="sm" c="dimmed" lh={1.7}>
          {labels.intro}
        </Text>

        <Select
          label={labels.endpointLabel}
          data={ALL_ENDPOINTS.map((e) => ({
            value: e.id,
            label: `${e.method} ${e.path} - ${e.title}`,
          }))}
          value={endpointId}
          onChange={(v) => {
            if (!v) return;
            setEndpointId(v);
            setParamValues({});
            setResult(null);
            setNetworkError(false);
          }}
          allowDeselect={false}
        />

        {pathParamNames.length + queryParamNames.length > 0 ? (
          <Group align="flex-start" gap="sm" w="100%">
            {pathParamNames.map((name) => (
              <TextInput
                key={name}
                label={name}
                description={
                  endpoint.params?.find((p) => p.name === name)?.detail
                }
                value={paramValues[name] ?? ''}
                onChange={(e) => updateParam(name, e.currentTarget.value)}
                style={{ flex: 1, minWidth: 220 }}
              />
            ))}
            {queryParamNames.map((name) => (
              <TextInput
                key={name}
                label={name}
                description={
                  endpoint.params?.find((p) => p.name === name)?.detail
                }
                value={paramValues[name] ?? ''}
                onChange={(e) => updateParam(name, e.currentTarget.value)}
                style={{ flex: 1, minWidth: 220 }}
              />
            ))}
          </Group>
        ) : null}

        <Group gap="sm">
          <Button onClick={run} loading={running}>
            {running ? labels.running : labels.run}
          </Button>
        </Group>

        <Stack gap={4}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            {labels.requestUrl}
          </Text>
          <Code block>{requestUrl}</Code>
        </Stack>

        {networkError ? (
          <Alert color="red">{labels.networkError}</Alert>
        ) : null}

        {result ? (
          <Stack gap="xs">
            <Group gap="sm">
              <Badge
                color={result.ok ? 'teal' : 'red'}
                variant="light"
                radius="sm"
              >
                {result.status} {result.statusText}
              </Badge>
              <Text size="sm" c="dimmed">
                {labels.duration}: {result.durationMs} ms
              </Text>
            </Group>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
              {labels.responsePreview}
            </Text>
            <CodeHighlight
              code={result.body}
              language={result.status === 0 ? 'bash' : 'json'}
              radius="md"
              withBorder
              withExpandButton
              defaultExpanded={false}
            />
          </Stack>
        ) : null}
      </Stack>
    </CodeHighlightProvider>
  );
}
