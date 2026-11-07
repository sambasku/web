import { useState } from "react";
import { Link, useNavigation } from "react-router";
import {
  Anchor,
  Button,
  Container,
  Group,
  Paper,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Route } from "./+types/encyclopedia.usulan";
import { submitEncyclopediaContribution } from "../application/use-cases/encyclopedia.use-case";
import { buildMetaTags } from "../application/utils/seo";
import {
  DEFAULT_LOCALE,
  isAppLocale,
  localePath,
} from "../application/i18n/locales";
import { useLocalePath } from "@/application/i18n/use-locale";

export function meta({ params }: Route.MetaArgs) {
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  return buildMetaTags({
    title: "Usulkan Artikel Ensiklopedia",
    description:
      "Kirim usulan artikel baru atau perbaikan artikel ensiklopedia Sambas.",
    path: localePath(locale, "/ensiklopedia/usulan"),
    locale,
    noindexAlways: true,
  });
}

export default function EncyclopediaUsulanPage() {
  const { t } = useTranslation();
  const lp = useLocalePath();
  const navigation = useNavigation();
  const [success, setSuccess] = useState(false);

  const isSubmitting = navigation.state === "submitting";
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const articleSlug = new URLSearchParams(window.location.search).get(
      "article_slug",
    );

    const payload = {
      kind: (articleSlug ? "edit" : "new") as "new" | "edit",
      articleSlug: articleSlug || undefined,
      title: (form.get("title") as string).trim(),
      excerpt: (form.get("excerpt") as string).trim(),
      body_md: (form.get("body_md") as string).trim(),
      category_id: (form.get("category_id") as string).trim(),
      tags: ((form.get("tags") as string) || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      change_note: (form.get("change_note") as string)?.trim() || undefined,
    };

    if (
      !payload.title ||
      !payload.excerpt ||
      !payload.body_md ||
      !payload.category_id
    ) {
      alert(t("encyclopedia_fieldRequired"));
      return;
    }

    try {
      await submitEncyclopediaContribution(payload);
      setSuccess(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengirim usulan");
    }
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
          <Title order={1} size="h3">
            {t("encyclopedia_contributeTitle")}
          </Title>
          <Text size="sm" c="dimmed">
            {t("encyclopedia_contributeIntro")}
          </Text>
        </Stack>

        <Paper withBorder p="md" radius="md" shadow="none">
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <TextInput
                label={t("encyclopedia_fieldTitle")}
                name="title"
                required
                placeholder="Contoh: Sejarah Istana Alwatzikoebillah"
              />
              <TextInput
                label={t("encyclopedia_fieldExcerpt")}
                name="excerpt"
                required
                placeholder="Ringkasan singkat isi artikel..."
              />
              <TextInput
                label={t("encyclopedia_fieldCategory")}
                name="category_id"
                required
                placeholder="ID Kategori"
              />
              <TextInput
                label={t("encyclopedia_fieldTags")}
                name="tags"
                placeholder="sejarah, budaya, tokoh"
              />
              <TextInput
                label={t("encyclopedia_fieldChangeNote")}
                name="change_note"
                placeholder="Apa yang kamu ubah?"
              />
              <Textarea
                label={t("encyclopedia_fieldBody")}
                name="body_md"
                required
                minRows={10}
                placeholder="Tulis isi artikel menggunakan format Markdown..."
              />
              <Button
                type="submit"
                loading={isSubmitting}
                leftSection={<CheckCircle size={16} />}
              >
                {t("encyclopedia_submitSuccessTitle")}
              </Button>
            </Stack>
          </form>
        </Paper>

        {success && (
          <Paper
            withBorder
            p="md"
            radius="md"
            bg="green.0"
            style={{ border: "1px solid var(--mantine-color-green-6)" }}
          >
            <Stack align="center" gap="sm">
              <CheckCircle size={32} color="var(--mantine-color-green-6)" />
              <Text fw={600} ta="center">
                {t("encyclopedia_submitSuccessTitle")}
              </Text>
              <Text size="sm" c="dimmed" ta="center">
                {t("encyclopedia_submitSuccessBody")}
              </Text>
              <Button
                component={Link}
                to={lp("/ensiklopedia")}
                variant="light"
                size="xs"
              >
                {t("common_backHome")}
              </Button>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}
