# Graph Report - web  (2026-11-17)

## Corpus Check
- 190 files · ~266,562 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 19 file(s) not represented in the graph (top: (none) 5, .mdc 3, .example 3)

## Summary
- 1155 nodes · 3640 edges · 64 communities (58 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 22 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d10c55f3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useLocalePath
- usaha.$slug.tsx
- worker.ts
- kontribusi.tsx
- env.ts
- ColdHostGate
- api-publik.tsx
- usaha-parse.ts
- localePath
- events.ts
- locale-layout.tsx
- event-contribute-form.tsx
- api-client.ts
- locales.ts
- wisata.$slug.tsx
- seo.ts
- wisata.tsx
- package.json
- displayImageUrl
- compilerOptions
- hapus-akun.tsx
- devDependencies
- security-headers.test.ts
- getFixedT
- dependencies
- sitemap[.]xml.ts
- cuisines.ts
- assert-live-behavior.sh
- sitemap-items.ts
- contribute-form.tsx
- usaha-seo.ts
- generate-sitemap.ts
- scripts
- SambasKu Web
- layanan.kontribusi.tsx
- acara.$slug.tsx
- word.entity.ts
- sitemap.ts
- @mantine/core
- ruang-diskusi.$id.tsx
- syarat-ketentuan.tsx
- entry.server.tsx
- category.use-case.ts
- sw.js
- user.use-case.ts
- faq-content.ts
- @react-router/dev
- upload-sitemap.sh
- places.ts
- ensure-sitemap-bucket.sh
- apiClient
- stripLocalePrefix
- words.$lemma.tsx
- failover.ts
- word.use-case.ts
- usage-labels.ts
- analytics.ts
- discussion.use-case.ts
- privacy-policy.tsx
- KontribusiPage
- usaha-contribute-form.tsx
- failover-policy.test.ts
- overrides

## God Nodes (most connected - your core abstractions)
1. `localePath()` - 117 edges
2. `isAppLocale()` - 105 edges
3. `useLocalePath()` - 87 edges
4. `buildMetaTags()` - 86 edges
5. `getFixedT()` - 75 edges
6. `@mantine/core` - 67 edges
7. `react-router` - 56 edges
8. `apiClient()` - 54 edges
9. `DEFAULT_LOCALE` - 52 edges
10. `trackEvent()` - 49 edges

## Surprising Connections (you probably didn't know these)
- `Aset media` --references--> `displayImageUrl()`  [INFERRED]
  README.md → app/presentation/utils/display-image-url.ts
- `main()` --calls--> `buildSitemapItems()`  [EXTRACTED]
  scripts/generate-sitemap.ts → app/application/utils/sitemap-items.ts
- `main()` --calls--> `collectVerifiedWords()`  [EXTRACTED]
  scripts/generate-sitemap.ts → app/application/utils/sitemap-items.ts
- `main()` --calls--> `buildUrlsetXml()`  [EXTRACTED]
  scripts/generate-sitemap.ts → app/application/utils/sitemap.ts
- `fetchCuisineSlugs()` --indirect_call--> `parseApiCuisine()`  [INFERRED]
  scripts/generate-sitemap.ts → app/domain/cuisines-parse.ts

## Import Cycles
- None detected.

## Communities (64 total, 6 thin omitted)

### Community 0 - "useLocalePath"
Cohesion: 0.14
Nodes (22): useLocalePath(), searchWords(), SearchBar(), SearchBarProps, WordCardSkeleton(), WordListSkeleton(), STATUS_COLOR, STATUS_KEY (+14 more)

### Community 1 - "usaha.$slug.tsx"
Cohesion: 0.22
Nodes (14): fetchEventBySlug(), fetchEventImages(), ImageLightbox(), ImageLightboxItem, ImageLightboxProps, LightboxTrigger(), useImageLightbox(), UsahaStatusBadge() (+6 more)

### Community 2 - "worker.ts"
Cohesion: 0.17
Nodes (29): cacheKeyRequest(), cacheKeyUrl(), cacheTtlSeconds(), canonicalCachePath(), freshSeconds(), isCacheableRequest(), isOgImagePath(), isSitemapPath() (+21 more)

### Community 3 - "kontribusi.tsx"
Cohesion: 0.16
Nodes (17): DialectRef, LanguageRef, listDialects(), listLanguages(), listWordClasses(), pickDefaultDialectId(), pickIndonesianLanguage(), pickSambasLanguage() (+9 more)

### Community 4 - "env.ts"
Cohesion: 0.08
Nodes (26): getWordByLemma(), LatestWord, listLatestWords(), LOGO_DATA_URL, clampLemma(), clampText(), isValidLemma(), OG_CARD_HEIGHT (+18 more)

### Community 5 - "ColdHostGate"
Cohesion: 0.17
Nodes (7): abortError(), AbortLike, COLD_HOST_MAX_IN_FLIGHT, ColdHostGate, Waiter, acquireApiSlot(), acquireColdSlot()

### Community 6 - "api-publik.tsx"
Cohesion: 0.11
Nodes (27): API_PUBLIK_ATTRIBUTION, API_PUBLIK_BASE, API_PUBLIK_DOCS_URL, API_PUBLIK_INTRO, API_PUBLIK_OPENAPI_URL, API_PUBLIK_OUT_OF_SCOPE, API_PUBLIK_PRIMARY, API_PUBLIK_SECONDARY (+19 more)

### Community 7 - "usaha-parse.ts"
Cohesion: 0.16
Nodes (21): fetchUsahaBySlug(), ApiUsaha, ApiUsahaItem, KIND_LABELS, KINDS, mapItem(), mapUsaha(), OPERATIONAL (+13 more)

### Community 8 - "localePath"
Cohesion: 0.13
Nodes (32): isAppLocale(), localePath(), lemmaAltFromLocalizedPath(), buildMetaTags(), buildPlaceJsonLd(), buildPlaceListJsonLd(), placesBreadcrumb(), ErrorBoundary() (+24 more)

### Community 9 - "events.ts"
Cohesion: 0.05
Nodes (55): compressImageForUpload(), PHOTO_UPLOAD_MAX_HEIGHT, PHOTO_UPLOAD_MAX_WIDTH, PHOTO_UPLOAD_QUALITY, buildEventJsonLd(), buildEventListJsonLd(), buildEventSeoCopy(), eventOgLocale() (+47 more)

### Community 10 - "locale-layout.tsx"
Cohesion: 0.12
Nodes (18): getClientI18n(), createI18nInstance(), APP_LOCALES, LOCALE_COOKIE, fromAcceptLanguage(), localeCookieHeader(), localeCookieValue(), parseCookie() (+10 more)

### Community 11 - "event-contribute-form.tsx"
Cohesion: 0.19
Nodes (16): submitEventContribution(), uploadEventPoster(), fetchEventCategories(), EventContributeForm(), submit(), SOURCE_TYPES, CENTER, cleanQuery() (+8 more)

### Community 12 - "api-client.ts"
Cohesion: 0.11
Nodes (20): ApiErrorDetail, ApiErrorPayload, ApiResponse, ApiResponseError, ApiResponseSuccess, CursorMeta, CursorPage, AppError (+12 more)

### Community 13 - "locales.ts"
Cohesion: 0.19
Nodes (6): AppLocaleConfig, byCode, DEFAULT_LOCALE, meta(), loader(), meta()

### Community 14 - "wisata.$slug.tsx"
Cohesion: 0.19
Nodes (14): WordImageAttribution, fetchPlaceImages(), sendPlaceView(), capitalize(), ExtLink(), ImageCredit(), PROVIDER_HOME, withUtm() (+6 more)

### Community 15 - "seo.ts"
Cohesion: 0.18
Nodes (17): barePathFromLocalized(), buildApiPublikJsonLd(), buildEncyclopediaArticleJsonLd(), buildHomeJsonLd(), buildHreflangLinks(), buildLetterJsonLd(), buildWordJsonLd(), buildWordSeoCopy() (+9 more)

### Community 16 - "wisata.tsx"
Cohesion: 0.16
Nodes (15): fetchCuisines(), cuisineCover(), fetchPlaces(), placeCover(), EksplorasiPage(), ExploreCard(), loader(), loader() (+7 more)

### Community 17 - "package.json"
Cohesion: 0.09
Nodes (25): description, engines, node, name, private, type, version, @cloudflare/workers-types (+17 more)

### Community 18 - "displayImageUrl"
Cohesion: 0.21
Nodes (15): WordImage, hasViolenceWarning(), IMAGE_CONTENT_WARNING_KEKERASAN, ImageContentWarning, isKnownPendingPlaceholderUrl(), isPendingImage(), PENDING_PLACEHOLDER_HOSTS, RevealViolenceConfirmFooter() (+7 more)

### Community 19 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx, lib (+12 more)

### Community 20 - "hapus-akun.tsx"
Cohesion: 0.23
Nodes (14): confirmAccountDeletion(), requestAccountDeletion(), resetPassword(), ResetPasswordInput, formError(), HapusAkunPage(), onConfirm(), onRequest() (+6 more)

### Community 21 - "devDependencies"
Cohesion: 0.11
Nodes (18): devDependencies, @cloudflare/vite-plugin, @cloudflare/workers-types, eslint, @eslint/js, eslint-plugin-react, eslint-plugin-react-hooks, globals (+10 more)

### Community 22 - "security-headers.test.ts"
Cohesion: 0.17
Nodes (14): apiConnectOriginsFrom(), buildCsp(), buildSecurityHeaders(), SecurityHeaderConfig, SecurityHeaders, headerValue(), matchesBuild(), PROD_HEADERS (+6 more)

### Community 23 - "getFixedT"
Cohesion: 0.14
Nodes (20): getCatalog(), getFixedT(), sharedInit, buildCuisineJsonLd(), buildCuisineListJsonLd(), buildCuisineListSeo(), isLocale(), resolve() (+12 more)

### Community 24 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, dompurify, highlight.js, i18next, isbot, lucide-react, @mantine/code-highlight, @mantine/core (+9 more)

### Community 25 - "sitemap[.]xml.ts"
Cohesion: 0.43
Nodes (6): listEncyclopediaArticles(), collectVerifiedWords(), EncyclopediaArticleListItem, fetchEncyclopediaArticles(), fetchUsahas(), loader()

### Community 26 - "cuisines.ts"
Cohesion: 0.22
Nodes (14): fetchCuisineBySlug(), fetchCuisinesFromCdn(), Cuisine, CuisineImage, CuisineSource, parseApiCuisine(), parseCdnCuisines(), parseCuisine() (+6 more)

### Community 27 - "assert-live-behavior.sh"
Cohesion: 0.36
Nodes (11): assert_cache_fill(), assert_shared_cache(), assert_xcache(), check_sitemap(), check_word_page(), fail(), get_headers(), get_status() (+3 more)

### Community 28 - "sitemap-items.ts"
Cohesion: 0.20
Nodes (14): LOGO_OG_SIZE, resolveOgImageSize(), wordOgCardPath(), wordOgCardUrl(), buildSitemapItems(), lastmodOf(), letterOf(), SITEMAP_OBJECT_KEY (+6 more)

### Community 29 - "contribute-form.tsx"
Cohesion: 0.23
Nodes (11): ACCEPT, ContributeForm(), submit(), errorText(), PhotoDropzone(), slugify(), TYPES, uploadPlaceImage() (+3 more)

### Community 30 - "usaha-seo.ts"
Cohesion: 0.23
Nodes (12): AppLocale, LocaleLayoutData, SeoMetaProps, buildUsahaJsonLd(), buildUsahaListJsonLd(), buildUsahaSeoCopy(), interpolate(), usahaSeoLabels() (+4 more)

### Community 31 - "generate-sitemap.ts"
Cohesion: 0.31
Nodes (7): ApiPlace, CuisinesApiPayload, fetchPlaceSlugs(), fetchWordPage(), main(), PlacesPayload, WordsPayload

### Community 32 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, build:staging, dev, format, lint, lint:fix, preview (+2 more)

### Community 33 - "SambasKu Web"
Cohesion: 0.20
Nodes (9): Aset media, Deploy, Dikerjakan dengan AI, Lingkungan, SambasKu Web, Scripts, Stack, Struktur singkat (+1 more)

### Community 34 - "layanan.kontribusi.tsx"
Cohesion: 0.12
Nodes (20): fetchKecamatan(), fetchLayanan(), fetchLayananBySlug(), Layanan, LayananCategory, LayananPhone, LayananPhoneWire, LayananRegion (+12 more)

### Community 35 - "acara.$slug.tsx"
Cohesion: 0.20
Nodes (12): formatDateTimeId(), MONTH_NAMES_ID, EventCard(), EventMiniList(), EventStatusBadge(), STATUS_COLOR, STATUS_KEY, isProxiedImageHost() (+4 more)

### Community 36 - "word.entity.ts"
Cohesion: 0.12
Nodes (19): formatWordType(), MeaningGroup, MeaningGroupMember, WordAudio, WordClass, WordExample, WordMeaning, WordPronunciation (+11 more)

### Community 37 - "sitemap.ts"
Cohesion: 0.53
Nodes (7): seoLocales(), buildUrlsetXml(), imageEntriesXml(), priorityForLocale(), SitemapImage, xhtmlAlternates(), xmlEscape()

### Community 38 - "@mantine/core"
Cohesion: 0.14
Nodes (16): HOME_NAV_HUBS, AppDownloadBadges(), PLAY_STORE_URL, Footer(), Logo(), LogoProps, isOwnHost(), OWN_HOSTS (+8 more)

### Community 39 - "ruang-diskusi.$id.tsx"
Cohesion: 0.22
Nodes (10): getDiscussionDetail(), getPublicProfile(), formatDateId(), VerifierMark(), loader(), replyBodyLabel(), RuangDiskusiDetailPage(), sortReplies() (+2 more)

### Community 40 - "syarat-ketentuan.tsx"
Cohesion: 0.33
Nodes (4): LegalDoc, MarkdownBlocks(), meta(), TermsPage()

### Community 41 - "entry.server.tsx"
Cohesion: 0.33
Nodes (4): streamTimeout, RFC-9110, isbot, react-dom

### Community 42 - "category.use-case.ts"
Cohesion: 0.50
Nodes (3): listCategories(), CategoryOption, loader()

### Community 43 - "sw.js"
Cohesion: 0.60
Nodes (3): cachePut(), handleAsset(), handleNavigation()

### Community 49 - "places.ts"
Cohesion: 0.24
Nodes (14): fetchPlaceBySlug(), ApiImage, mapPlace(), Place, PlaceCategory, placeCategoryLabel(), PlaceImage, placeLabel() (+6 more)

### Community 51 - "apiClient"
Cohesion: 0.11
Nodes (24): getEncyclopediaArticle(), listArticleComments(), ListEncyclopediaArticlesParams, listEncyclopediaCategories(), listEncyclopediaTags(), listMyEncyclopediaContributions(), submitEncyclopediaContribution(), ArticleDetailResponse (+16 more)

### Community 52 - "stripLocalePrefix"
Cohesion: 0.19
Nodes (17): getLocaleConfig(), stripLocalePrefix(), swapLocalePath(), useLocale(), Header(), MobileDrawer, LanguageSwitcher(), LanguageSwitcherPanel() (+9 more)

### Community 53 - "words.$lemma.tsx"
Cohesion: 0.18
Nodes (13): formatWordClass(), AnalyticsEvents, trackEvent(), WordAudioPlayer(), WordOgCard(), blankMassRows(), KontribusiMassalPage(), onSubmit() (+5 more)

### Community 54 - "failover.ts"
Cohesion: 0.14
Nodes (15): activeTier(), advanceTier(), apiGate, ApiTier, cancelProbe(), coldGate, effectiveIndex(), hasFallbacks() (+7 more)

### Community 55 - "word.use-case.ts"
Cohesion: 0.19
Nodes (12): getWordDetail(), getWordOfDay(), KbbiSuggestion, listWordsAtoZ(), ListWordsParams, SearchWordsParams, WordOfTheDay, useDesktopMascot() (+4 more)

### Community 56 - "usage-labels.ts"
Cohesion: 0.21
Nodes (12): WordDetail, BROWSE_EXCLUDED_USAGE_LABELS, label(), PROMINENT_USAGE_LABELS, REGISTER_LABELS, USAGE_LABEL_LABELS, USAGE_LABELS, UsageLabel (+4 more)

### Community 57 - "analytics.ts"
Cohesion: 0.08
Nodes (23): RelatedWord, groupRelations(), RELATION_LABELS, RELATION_ORDER, RelationSection, placeViewKey(), PlaceViewStorage, recordPlaceViewOnce() (+15 more)

### Community 58 - "discussion.use-case.ts"
Cohesion: 0.27
Nodes (8): ListDiscussionsParams, listPublishedDiscussions(), DiscussionPublicDetail, DiscussionPublicImage, DiscussionPublicItem, DiscussionReply, DiscussionReplyStatus, loader()

### Community 59 - "privacy-policy.tsx"
Cohesion: 0.33
Nodes (4): LegalDoc, MarkdownBlocks(), meta(), PrivacyPolicyPage()

### Community 60 - "KontribusiPage"
Cohesion: 0.22
Nodes (11): lookupKbbi(), hasConflictingUsageLabels(), KbbiLookupFields(), KbbiLookupModal(), KontribusiPage(), onSubmit(), MaknaCard(), applySuggestion() (+3 more)

### Community 61 - "usaha-contribute-form.tsx"
Cohesion: 0.29
Nodes (9): submitUsahaContribution(), SubmitUsahaContributionInput, fetchUsahaCategories(), UsahaKind, KINDS, UsahaContributeForm(), submit(), UsahaKontribusiPage() (+1 more)

### Community 62 - "failover-policy.test.ts"
Cohesion: 0.43
Nodes (5): decideFailoverStep(), FailoverStep, FailoverStepInput, isAbortError(), sameHost()

### Community 63 - "overrides"
Cohesion: 0.50
Nodes (4): fflate, satori, pnpm, overrides

## Knowledge Gaps
- **245 isolated node(s):** `sharedInit`, `AppLocaleConfig`, `byCode`, `ResetPasswordInput`, `ListDiscussionsParams` (+240 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 339 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react-router` connect `useLocalePath` to `usaha.$slug.tsx`, `worker.ts`, `kontribusi.tsx`, `env.ts`, `api-publik.tsx`, `localePath`, `events.ts`, `locale-layout.tsx`, `locales.ts`, `wisata.$slug.tsx`, `seo.ts`, `wisata.tsx`, `package.json`, `displayImageUrl`, `hapus-akun.tsx`, `getFixedT`, `layanan.kontribusi.tsx`, `acara.$slug.tsx`, `word.entity.ts`, `@mantine/core`, `ruang-diskusi.$id.tsx`, `syarat-ketentuan.tsx`, `entry.server.tsx`, `stripLocalePrefix`, `words.$lemma.tsx`, `analytics.ts`, `privacy-policy.tsx`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Why does `@mantine/core` connect `@mantine/core` to `useLocalePath`, `usaha.$slug.tsx`, `kontribusi.tsx`, `api-publik.tsx`, `events.ts`, `locale-layout.tsx`, `event-contribute-form.tsx`, `locales.ts`, `wisata.$slug.tsx`, `seo.ts`, `wisata.tsx`, `package.json`, `displayImageUrl`, `hapus-akun.tsx`, `getFixedT`, `contribute-form.tsx`, `layanan.kontribusi.tsx`, `acara.$slug.tsx`, `word.entity.ts`, `ruang-diskusi.$id.tsx`, `syarat-ketentuan.tsx`, `stripLocalePrefix`, `words.$lemma.tsx`, `word.use-case.ts`, `usage-labels.ts`, `analytics.ts`, `privacy-policy.tsx`, `usaha-contribute-form.tsx`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `localePath()` connect `localePath` to `useLocalePath`, `usaha.$slug.tsx`, `kontribusi.tsx`, `env.ts`, `api-publik.tsx`, `events.ts`, `locale-layout.tsx`, `locales.ts`, `wisata.$slug.tsx`, `seo.ts`, `wisata.tsx`, `displayImageUrl`, `hapus-akun.tsx`, `getFixedT`, `usaha-seo.ts`, `layanan.kontribusi.tsx`, `acara.$slug.tsx`, `word.entity.ts`, `sitemap.ts`, `@mantine/core`, `ruang-diskusi.$id.tsx`, `syarat-ketentuan.tsx`, `stripLocalePrefix`, `words.$lemma.tsx`, `analytics.ts`, `privacy-policy.tsx`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **What connects `sharedInit`, `AppLocaleConfig`, `byCode` to the rest of the system?**
  _245 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useLocalePath` be split into smaller, more focused modules?**
  _Cohesion score 0.14453781512605043 - nodes in this community are weakly interconnected._
- **Should `env.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07729468599033816 - nodes in this community are weakly interconnected._
- **Should `api-publik.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10793650793650794 - nodes in this community are weakly interconnected._