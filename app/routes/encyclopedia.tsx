import {
  Link,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "react-router";
import {
  ActionIcon,
  Anchor,
  Badge,
  Button,
  Container,
  Group,
  Image,
  Paper,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { ArrowRight, LibraryBig, PlusCircle, Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Route } from "./+types/encyclopedia";
import {
  listEncyclopediaArticles,
  listEncyclopediaCategories,
} from "../application/use-cases/encyclopedia.use-case";
import { buildMetaTags } from "../application/utils/seo";
import {
  DEFAULT_LOCALE,
  isAppLocale,
  localePath,
  stripLocalePrefix,
} from "../application/i18n/locales";
import { getFixedT } from "../application/i18n/i18n-instance";
import { useLocalePath } from "../application/i18n/use-locale";
import { displayImageUrl } from "../presentation/utils/display-image-url";

const THUMB = 96;

export function meta({ params }: Route.MetaArgs) {
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const t = getFixedT(locale);
  return buildMetaTags({
    title: t("encyclopedia_seoTitle"),
    description: t("encyclopedia_seoDescription"),
    keywords: t("encyclopedia_seoKeywords"),
    path: localePath(locale, "/ensiklopedia"),
    locale,
  });
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category") || undefined;
  const tag = url.searchParams.get("tag") || undefined;
  const q = url.searchParams.get("q")?.trim() || undefined;
  const cursor = url.searchParams.get("cursor") || undefined;
  try {
    const [articlesRes, categoriesRes] = await Promise.all([
      listEncyclopediaArticles({
        category,
        tag,
        q,
        cursor,
        limit: 12,
        signal: request.signal,
      }),
      listEncyclopediaCategories(request.signal),
    ]);
    return {
      q,
      category,
      tag,
      items: articlesRes.data?.items ?? [],
      meta: articlesRes.data?.meta ?? {
        limit: 12,
        next_cursor: null,
        has_more: false,
      },
      categories: categoriesRes.data ?? [],
    };
  } catch {
    return {
      q: q ?? "",
      category,
      tag,
      items: [],
      meta: { limit: 12, next_cursor: null, has_more: false },
      categories: [],
    };
  }
}

export default function EncyclopediaListPage() {
  const { q, category, tag, items, meta, categories } =
    useLoaderData<typeof loader>();
  const [, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const lp = useLocalePath();
  const isLoading =
    navigation.state === "loading" &&
    stripLocalePrefix(navigation.location.pathname).path === "/ensiklopedia";

  const handleFilter = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const query = (form.get("q") as string)?.trim() || "";
    const categoryValue = (form.get("category") as string)?.trim() || "";
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (categoryValue) next.set("category", categoryValue);
    setSearchParams(next);
  };

  const clearFilter = () => {
    const next = new URLSearchParams();
    if (tag) next.set("tag", tag);
    setSearchParams(next);
  };

  const hasFilter = q || category;

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Stack gap="sm">
          <Group gap="xs">
            <ThemeIcon variant="light" size="md" radius="sm">
              <LibraryBig size={16} />
            </ThemeIcon>
            <Title order={1} size="h2">
              {t("encyclopedia_heading")}
            </Title>
          </Group>
          <Text size="sm" c="dimmed" maw={640}>
            {t("encyclopedia_intro")}
          </Text>
        </Stack>

        <Paper withBorder p="md" radius="md">
          <Stack gap="xs">
            <Text size="sm" fw={600}>
              {t("encyclopedia_contributeCardTitle")}
            </Text>
            <Text size="xs" c="dimmed">
              {t("encyclopedia_contributeCardBody")}
            </Text>
            <Button
              component={Link}
              to={lp("/ensiklopedia/usulan")}
              size="compact-md"
              variant="light"
              color="indigo"
              leftSection={<PlusCircle size={16} />}
            >
              {t("encyclopedia_contributeCardButton")}
            </Button>
          </Stack>
        </Paper>

        <form onSubmit={handleFilter}>
          <Group gap="xs" wrap="nowrap">
            <Select
              name="category"
              data={[
                { value: "", label: t("encyclopedia_filterAll") },
                ...categories.map((c) => ({ value: c.name, label: c.name })),
              ]}
              defaultValue={category}
              key={category ?? "all"}
              placeholder={t("encyclopedia_filterAll")}
              size="xs"
              w={180}
              clearable
              searchable
            />
            <TextInput
              name="q"
              defaultValue={q}
              key={q || "empty"}
              placeholder={t("encyclopedia_searchPlaceholder")}
              size="xs"
              w={240}
              leftSection={<Search size={14} />}
              rightSection={
                hasFilter ? (
                  <ActionIcon
                    variant="subtle"
                    size="xs"
                    onClick={clearFilter}
                    aria-label={t("word_listClearFilterAria")}
                  >
                    <X size={12} />
                  </ActionIcon>
                ) : null
              }
            />
            <Button type="submit" size="xs" leftSection={<Search size={14} />}>
              {t("word_listFilterSubmit")}
            </Button>
          </Group>
        </form>

        {isLoading && items.length > 0 ? (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} h={THUMB + 80} radius="md" />
            ))}
          </SimpleGrid>
        ) : items.length > 0 ? (
          <Stack gap="md">
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              {items.map((item) => (
                <ArticleCard key={item.id} article={item} />
              ))}
            </SimpleGrid>

            {meta.has_more && meta.next_cursor && (
              <Group justify="center" pt="md">
                <Button
                  component={Link}
                  to={lp(
                    "/ensiklopedia",
                    `?${new URLSearchParams({
                      ...(q ? { q } : {}),
                      ...(category ? { category } : {}),
                      ...(tag ? { tag } : {}),
                      cursor: meta.next_cursor,
                    }).toString()}`,
                  )}
                  variant="light"
                  leftSection={<ArrowRight size={16} />}
                >
                  {t("common_loadMore")}
                </Button>
              </Group>
            )}
          </Stack>
        ) : (
          <Stack align="center" gap="sm" py={48} maw={420} mx="auto">
            <ThemeIcon size={52} variant="light" color="gray" radius="xl">
              <LibraryBig size={24} />
            </ThemeIcon>
            <Title order={4} ta="center">
              {hasFilter
                ? t("encyclopedia_noMatchTitle")
                : t("encyclopedia_emptyTitle")}
            </Title>
            <Text size="sm" c="dimmed" ta="center">
              {hasFilter
                ? t("encyclopedia_noMatchBody")
                : t("encyclopedia_emptyBody")}
            </Text>
            {hasFilter && (
              <Button
                variant="light"
                size="xs"
                onClick={clearFilter}
                leftSection={<X size={14} />}
                mt="xs"
              >
                {t("word_listClearFilter")}
              </Button>
            )}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}

function ArticleCard({
  article,
}: {
  article: {
    slug: string;
    title: string;
    excerpt: string;
    cover_url: string | null;
    category: { name: string | null };
    tags: { id: string; name: string }[];
  };
}) {
  const lp = useLocalePath();
  const cover = article.cover_url
    ? displayImageUrl(article.cover_url, { width: 640 })
    : undefined;
  return (
    <Anchor
      component={Link}
      to={lp(`/ensiklopedia/${encodeURIComponent(article.slug)}`)}
      underline="never"
      c="inherit"
    >
      <Paper withBorder p="md" radius="md" shadow="none" h="100%">
        <Stack gap="xs">
          {cover ? (
            <Image
              src={cover}
              alt={article.title}
              h={140}
              fit="cover"
              radius="sm"
            />
          ) : null}
          <Stack gap={4}>
            <Text
              component="h2"
              fz={{ base: 15, sm: 17 }}
              fw={600}
              lh={1.3}
              m={0}
            >
              {article.title}
            </Text>
            <Text fz={{ base: 12, sm: 14 }} c="dimmed" lineClamp={2}>
              {article.excerpt}
            </Text>
            <Group gap={6} wrap="wrap">
              {article.category?.name ? (
                <Badge variant="light" color="teal" size="xs">
                  {article.category.name}
                </Badge>
              ) : null}
              {article.tags
                ?.slice(0, 3)
                .map((tag: { id: string; name: string }) => (
                  <Badge key={tag.id} variant="default" color="gray" size="xs">
                    {tag.name}
                  </Badge>
                ))}
            </Group>
          </Stack>
        </Stack>
      </Paper>
    </Anchor>
  );
}
