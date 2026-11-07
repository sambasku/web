import { Link, useLoaderData } from "react-router";
import {
  Anchor,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Group,
  Image,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { Calendar, BookOpen, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import DOMPurify from "dompurify";
import { marked } from "marked";
import type { Route } from "./+types/encyclopedia.$slug";
import { getEncyclopediaArticle } from "../application/use-cases/encyclopedia.use-case";
import {
  buildMetaTags,
  buildEncyclopediaArticleJsonLd,
} from "../application/utils/seo";
import {
  DEFAULT_LOCALE,
  isAppLocale,
  localePath,
} from "../application/i18n/locales";
import { getFixedT } from "../application/i18n/i18n-instance";
import { useLocalePath } from "../application/i18n/use-locale";
import { displayImageUrl } from "../presentation/utils/display-image-url";

export function meta({ params, loaderData }: Route.MetaArgs) {
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const t = getFixedT(locale);
  const article = loaderData;
  if (!article) return [];
  return [
    ...buildMetaTags({
      title: `${article.title} - ${t("encyclopedia_heading")}`,
      description: article.excerpt,
      path: localePath(
        locale,
        `/ensiklopedia/${encodeURIComponent(article.slug)}`,
      ),
      locale,
    }),
    ...(loaderData
      ? [
          {
            "script:ld+json": buildEncyclopediaArticleJsonLd(
              {
                slug: article.slug,
                title: article.title,
                excerpt: article.excerpt,
                coverUrl: article.cover_url,
                publishedAt: article.published_at,
                updatedAt: article.updated_at,
                authorName:
                  article.author.display_name || article.author.username,
              },
              locale,
            ),
          },
        ]
      : []),
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const slug = params.slug;
  if (!slug) throw new Response("Not Found", { status: 404 });
  try {
    const article = await getEncyclopediaArticle(slug, request.signal);
    if (!article.data) throw new Response("Not Found", { status: 404 });
    return article.data;
  } catch {
    throw new Response("Not Found", { status: 404 });
  }
}

export default function EncyclopediaDetailPage() {
  const article = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const lp = useLocalePath();

  const renderMarkdown = (md: string) => {
    if (!md) return { __html: "" };
    const html = marked.parse(md) as string;
    return { __html: DOMPurify.sanitize(html) };
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Group gap="xs">
          <Anchor
            component={Link}
            to={lp("/ensiklopedia")}
            size="xs"
            c="dimmed"
          >
            {t("encyclopedia_backLink")}
          </Anchor>
        </Group>

        <Stack gap="sm">
          <Title order={1} fz={{ base: 24, sm: 32 }} fw={800} lh={1.2}>
            {article.title}
          </Title>
          <Group gap="md" wrap="wrap">
            <Group gap={4}>
              <User size={14} color="gray" />
              <Text size="xs" c="dimmed">
                {t("encyclopedia_authorLabel")}:{" "}
                {article.author.display_name || article.author.username}
              </Text>
            </Group>
            {article.published_at && (
              <Group gap={4}>
                <Calendar size={14} color="gray" />
                <Text size="xs" c="dimmed">
                  {new Date(article.published_at).toLocaleDateString(
                    undefined,
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    },
                  )}
                </Text>
              </Group>
            )}
            {article.status === "published" && (
              <Badge variant="light" color="teal" size="xs">
                {t("encyclopedia_verifierLabel")}
              </Badge>
            )}
          </Group>
        </Stack>

        {article.cover_url && (
          <Image
            src={displayImageUrl(article.cover_url, { width: 1200 })}
            alt={article.title}
            radius="md"
            fit="cover"
            h={{ base: 200, sm: 400 }}
          />
        )}

        <Paper
          withBorder
          p="md"
          radius="md"
          shadow="none"
          bg="var(--mantine-color-gray-0)"
        >
          <Text fz="lg" fw={500} lh={1.6} style={{ whiteSpace: "pre-wrap" }}>
            {article.excerpt}
          </Text>
        </Paper>

        <Box
          component="div"
          dangerouslySetInnerHTML={renderMarkdown(article.body_md)}
          style={{
            lineHeight: 1.7,
            fontSize: "1rem",
            color: "var(--mantine-color-text)",
          }}
        />

        {article.references_md && (
          <Stack
            gap="sm"
            mt="xl"
            pt="xl"
            style={{ borderTop: "1px solid var(--mantine-color-gray-3)" }}
          >
            <Title order={3} size="h4">
              {t("encyclopedia_referencesHeading")}
            </Title>
            <Box
              component="div"
              dangerouslySetInnerHTML={renderMarkdown(article.references_md)}
            />
          </Stack>
        )}

        <Group justify="flex-end" mt="xl">
          <Button
            component={Link}
            to={lp(`/ensiklopedia/usulan?article_slug=${article.slug}`)}
            variant="light"
            size="sm"
            leftSection={<BookOpen size={16} />}
          >
            {t("encyclopedia_suggestEdit")}
          </Button>
        </Group>

        <Divider my="xl" />

        <Stack gap="md">
          <Group justify="space-between" align="flex-start" wrap="wrap">
            <Title order={2} size="h4">
              {t("encyclopedia_commentsHeading", {
                count: article.comments?.items.length ?? 0,
              })}
            </Title>
          </Group>

          {article.comments?.items.length === 0 ? (
            <Text size="sm" c="dimmed" ta="center" py={32}>
              {t("encyclopedia_commentsEmpty")}
            </Text>
          ) : (
            <Stack gap="sm">
              {article.comments?.items.map((c) => (
                <Paper key={c.id} withBorder p="sm" radius="md" shadow="none">
                  <Group
                    justify="space-between"
                    wrap="nowrap"
                    align="flex-start"
                  >
                    <Group gap="xs">
                      <Text size="xs" fw={600}>
                        {c.display_name || c.username}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </Text>
                    </Group>
                    {c.isEdited && (
                      <Badge variant="outline" size="xs">
                        Edited
                      </Badge>
                    )}
                  </Group>
                  <Text size="sm" mt={4}>
                    {c.body}
                  </Text>
                </Paper>
              ))}
            </Stack>
          )}
        </Stack>
      </Stack>
    </Container>
  );
}
