# Graph Report - web  (2026-11-04)

## Corpus Check
- 176 files · ~258,746 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 19 file(s) not represented in the graph (top: (none) 5, .mdc 3, .example 3)

## Summary
- 1044 nodes · 3248 edges · 51 communities (44 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 22 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e8cb505e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useLocalePath
- trackEvent
- worker.ts
- kontribusi.tsx
- env.ts
- apiClient
- api-publik.tsx
- usaha-parse.ts
- isAppLocale
- events.ts
- locale-layout.tsx
- event-contribute-form.tsx
- api-client.ts
- locales.ts
- acara.usulan.tsx
- seo.ts
- wisata.$slug.tsx
- package.json
- localePath
- compilerOptions
- hapus-akun.tsx
- devDependencies
- ref_node_assert
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
- eksplorasi.tsx
- root.tsx
- wisata.tsx
- sitemap.ts
- home.tsx
- failover-policy.test.ts
- syarat-ketentuan.tsx
- entry.server.tsx
- category.use-case.ts
- sw.js
- user.use-case.ts
- faq-content.ts
- @react-router/dev
- upload-sitemap.sh
- engines
- ensure-sitemap-bucket.sh

## God Nodes (most connected - your core abstractions)
1. `localePath()` - 102 edges
2. `isAppLocale()` - 91 edges
3. `useLocalePath()` - 73 edges
4. `buildMetaTags()` - 72 edges
5. `getFixedT()` - 62 edges
6. `@mantine/core` - 58 edges
7. `trackEvent()` - 49 edges
8. `react-router` - 49 edges
9. `apiClient()` - 46 edges
10. `DEFAULT_LOCALE` - 45 edges

## Surprising Connections (you probably didn't know these)
- `Aset media` --references--> `displayImageUrl()`  [INFERRED]
  web/README.md → web/app/presentation/utils/display-image-url.ts
- `LocaleLayoutData` --references--> `AppLocale`  [EXTRACTED]
  web/app/application/i18n/use-locale.ts → web/app/application/i18n/locales.ts
- `SeoMetaProps` --references--> `AppLocale`  [EXTRACTED]
  web/app/application/utils/seo.ts → web/app/application/i18n/locales.ts
- `Layout()` --calls--> `isAppLocale()`  [EXTRACTED]
  web/app/root.tsx → web/app/application/i18n/locales.ts
- `loader()` --calls--> `localePath()`  [EXTRACTED]
  web/app/routes/legacy-redirect.tsx → web/app/application/i18n/locales.ts

## Import Cycles
- None detected.

## Communities (51 total, 7 thin omitted)

### Community 0 - "useLocalePath"
Cohesion: 0.05
Nodes (80): APP_LOCALES, stripLocalePrefix(), swapLocalePath(), LocaleLayoutData, useLocale(), useLocalePath(), getPublicProfile(), getWordDetail() (+72 more)

### Community 1 - "trackEvent"
Cohesion: 0.06
Nodes (71): getDiscussionDetail(), ListDiscussionsParams, listPublishedDiscussions(), formatDateId(), DiscussionPublicDetail, DiscussionPublicImage, DiscussionPublicItem, DiscussionReply (+63 more)

### Community 2 - "worker.ts"
Cohesion: 0.09
Nodes (43): cacheKeyRequest(), cacheKeyUrl(), cacheTtlSeconds(), canonicalCachePath(), freshSeconds(), isCacheableRequest(), isOgImagePath(), isSitemapPath() (+35 more)

### Community 3 - "kontribusi.tsx"
Cohesion: 0.08
Nodes (40): DialectRef, LanguageRef, listDialects(), listLanguages(), listWordClasses(), pickDefaultDialectId(), pickIndonesianLanguage(), pickSambasLanguage() (+32 more)

### Community 4 - "env.ts"
Cohesion: 0.08
Nodes (23): getWordByLemma(), LatestWord, listLatestWords(), listWordsAtoZ(), LOGO_DATA_URL, clampLemma(), clampText(), isValidLemma() (+15 more)

### Community 5 - "apiClient"
Cohesion: 0.09
Nodes (24): apiClient(), resolveUrl(), abortError(), AbortLike, COLD_HOST_MAX_IN_FLIGHT, ColdHostGate, Waiter, acquireApiSlot() (+16 more)

### Community 6 - "api-publik.tsx"
Cohesion: 0.12
Nodes (26): API_PUBLIK_ATTRIBUTION, API_PUBLIK_BASE, API_PUBLIK_DOCS_URL, API_PUBLIK_INTRO, API_PUBLIK_OPENAPI_URL, API_PUBLIK_OUT_OF_SCOPE, API_PUBLIK_PRIMARY, API_PUBLIK_SECONDARY (+18 more)

### Community 7 - "usaha-parse.ts"
Cohesion: 0.12
Nodes (28): SubmitUsahaContributionInput, fetchUsahaBySlug(), ApiUsaha, ApiUsahaItem, KIND_LABELS, KINDS, mapItem(), mapUsaha() (+20 more)

### Community 8 - "isAppLocale"
Cohesion: 0.11
Nodes (20): isAppLocale(), buildMetaTags(), meta(), meta(), meta(), loader(), MassRow, meta() (+12 more)

### Community 9 - "events.ts"
Cohesion: 0.12
Nodes (25): LABELS, ROW, formatDateTimeId(), EventListFilters, fetchEventBySlug(), ApiEvent, Event, EventCategoryRef (+17 more)

### Community 10 - "locale-layout.tsx"
Cohesion: 0.12
Nodes (17): getClientI18n(), createI18nInstance(), LOCALE_COOKIE, fromAcceptLanguage(), localeCookieHeader(), localeCookieValue(), parseCookie(), resolvePreferredLocale() (+9 more)

### Community 11 - "event-contribute-form.tsx"
Cohesion: 0.14
Nodes (23): submitEventContribution(), uploadEventPoster(), fetchEventCategories(), submitUsahaContribution(), fetchUsahaCategories(), EventContributeForm(), submit(), SOURCE_TYPES (+15 more)

### Community 12 - "api-client.ts"
Cohesion: 0.11
Nodes (19): ApiErrorDetail, ApiErrorPayload, ApiResponse, ApiResponseError, ApiResponseSuccess, CursorMeta, CursorPage, AppError (+11 more)

### Community 13 - "locales.ts"
Cohesion: 0.16
Nodes (19): sharedInit, AppLocale, AppLocaleConfig, byCode, DEFAULT_LOCALE, getLocaleConfig(), buildEventJsonLd(), buildEventListJsonLd() (+11 more)

### Community 14 - "acara.usulan.tsx"
Cohesion: 0.13
Nodes (18): compressImageForUpload(), PHOTO_UPLOAD_MAX_HEIGHT, PHOTO_UPLOAD_MAX_WIDTH, PHOTO_UPLOAD_QUALITY, EventContribution, EventContributionPayload, EventContributionStatus, fetchMyEventContributions() (+10 more)

### Community 15 - "seo.ts"
Cohesion: 0.11
Nodes (20): lemmaAltFromLocalizedPath(), LOGO_OG_SIZE, OG_CARD_HEIGHT, OG_CARD_WIDTH, resolveOgImageSize(), barePathFromLocalized(), buildHreflangLinks(), buildWordJsonLd() (+12 more)

### Community 16 - "wisata.$slug.tsx"
Cohesion: 0.18
Nodes (21): fetchPlaceBySlug(), fetchPlaceImages(), ApiImage, mapPlace(), Place, PlaceCategory, placeCategoryLabel(), PlaceImage (+13 more)

### Community 17 - "package.json"
Cohesion: 0.10
Nodes (21): description, name, private, type, version, @cloudflare/workers-types, eslint, @eslint/js (+13 more)

### Community 18 - "localePath"
Cohesion: 0.17
Nodes (17): localePath(), buildApiPublikJsonLd(), buildDiscussionFaqJsonLd(), buildFaqJsonLd(), buildLetterJsonLd(), buildPlaceJsonLd(), buildPlaceListJsonLd(), placesBreadcrumb() (+9 more)

### Community 19 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx, lib (+12 more)

### Community 20 - "hapus-akun.tsx"
Cohesion: 0.22
Nodes (14): confirmAccountDeletion(), requestAccountDeletion(), resetPassword(), ResetPasswordInput, formError(), HapusAkunPage(), onConfirm(), onRequest() (+6 more)

### Community 21 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, @cloudflare/vite-plugin, @cloudflare/workers-types, eslint, @eslint/js, eslint-plugin-react, eslint-plugin-react-hooks, globals (+9 more)

### Community 22 - "ref_node_assert"
Cohesion: 0.19
Nodes (5): API_ITEM, placeViewKey(), PlaceViewStorage, recordPlaceViewOnce(), createGtag()

### Community 23 - "getFixedT"
Cohesion: 0.26
Nodes (10): getCatalog(), getFixedT(), buildCuisineJsonLd(), buildCuisineListJsonLd(), buildCuisineListSeo(), isLocale(), resolve(), meta() (+2 more)

### Community 24 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, highlight.js, i18next, isbot, lucide-react, @mantine/code-highlight, @mantine/core, @mantine/hooks (+7 more)

### Community 25 - "sitemap[.]xml.ts"
Cohesion: 0.23
Nodes (12): collectVerifiedWords(), fetchCuisineBySlug(), fetchCuisines(), fetchEvents(), fetchPlaces(), fetchUsahas(), loader(), loader() (+4 more)

### Community 26 - "cuisines.ts"
Cohesion: 0.31
Nodes (10): fetchCuisinesFromCdn(), Cuisine, CuisineImage, CuisineSource, parseApiCuisine(), parseCdnCuisines(), parseCuisine(), parseImage() (+2 more)

### Community 27 - "assert-live-behavior.sh"
Cohesion: 0.36
Nodes (11): assert_cache_fill(), assert_shared_cache(), assert_xcache(), check_sitemap(), check_word_page(), fail(), get_headers(), get_status() (+3 more)

### Community 28 - "sitemap-items.ts"
Cohesion: 0.27
Nodes (10): buildSitemapItems(), lastmodOf(), letterOf(), SITEMAP_OBJECT_KEY, SitemapSourceWord, SitemapWord, SitemapWordPage, uniqueSlugs() (+2 more)

### Community 29 - "contribute-form.tsx"
Cohesion: 0.23
Nodes (11): ACCEPT, ContributeForm(), submit(), errorText(), PhotoDropzone(), slugify(), TYPES, uploadPlaceImage() (+3 more)

### Community 30 - "usaha-seo.ts"
Cohesion: 0.31
Nodes (9): buildUsahaJsonLd(), buildUsahaListJsonLd(), buildUsahaSeoCopy(), interpolate(), usahaSeoLabels(), resolveLocale(), truncateSeo(), UsahaSeoLabels (+1 more)

### Community 31 - "generate-sitemap.ts"
Cohesion: 0.29
Nodes (8): ApiPlace, CuisinesApiPayload, fetchCuisineSlugs(), fetchPlaceSlugs(), fetchWordPage(), main(), PlacesPayload, WordsPayload

### Community 32 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, build:staging, dev, format, lint, lint:fix, preview (+2 more)

### Community 33 - "SambasKu Web"
Cohesion: 0.20
Nodes (9): Aset media, Deploy, Dikerjakan dengan AI, Lingkungan, SambasKu Web, Scripts, Stack, Struktur singkat (+1 more)

### Community 34 - "eksplorasi.tsx"
Cohesion: 0.31
Nodes (6): cuisineCover(), placeCover(), EksplorasiPage(), ExploreCard(), CuisineCard(), KulinerListPage()

### Community 35 - "root.tsx"
Cohesion: 0.25
Nodes (5): App(), ErrorBoundary(), Layout(), subscribeNoop(), theme

### Community 36 - "wisata.tsx"
Cohesion: 0.31
Nodes (7): Filter, filterLabel(), FILTERS, loader(), matchesFilter(), PlaceListPage(), PlaceRow()

### Community 37 - "sitemap.ts"
Cohesion: 0.71
Nodes (5): seoLocales(), buildUrlsetXml(), priorityForLocale(), xhtmlAlternates(), xmlEscape()

### Community 38 - "home.tsx"
Cohesion: 0.33
Nodes (4): buildHomeJsonLd(), ALPHABETS, meta(), WHATSAPP_GROUP_URL

### Community 39 - "failover-policy.test.ts"
Cohesion: 0.43
Nodes (5): decideFailoverStep(), FailoverStep, FailoverStepInput, isAbortError(), sameHost()

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

## Knowledge Gaps
- **224 isolated node(s):** `sharedInit`, `AppLocaleConfig`, `byCode`, `ResetPasswordInput`, `ListDiscussionsParams` (+219 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 309 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react-router` connect `useLocalePath` to `trackEvent`, `worker.ts`, `kontribusi.tsx`, `env.ts`, `api-publik.tsx`, `usaha-parse.ts`, `isAppLocale`, `events.ts`, `locale-layout.tsx`, `locales.ts`, `acara.usulan.tsx`, `seo.ts`, `wisata.$slug.tsx`, `package.json`, `localePath`, `hapus-akun.tsx`, `getFixedT`, `eksplorasi.tsx`, `root.tsx`, `wisata.tsx`, `home.tsx`, `syarat-ketentuan.tsx`, `entry.server.tsx`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `@mantine/core` connect `useLocalePath` to `trackEvent`, `kontribusi.tsx`, `api-publik.tsx`, `usaha-parse.ts`, `isAppLocale`, `events.ts`, `locale-layout.tsx`, `event-contribute-form.tsx`, `locales.ts`, `acara.usulan.tsx`, `seo.ts`, `wisata.$slug.tsx`, `package.json`, `localePath`, `hapus-akun.tsx`, `getFixedT`, `contribute-form.tsx`, `eksplorasi.tsx`, `root.tsx`, `wisata.tsx`, `home.tsx`, `syarat-ketentuan.tsx`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Why does `localePath()` connect `localePath` to `useLocalePath`, `trackEvent`, `kontribusi.tsx`, `env.ts`, `api-publik.tsx`, `isAppLocale`, `locale-layout.tsx`, `locales.ts`, `acara.usulan.tsx`, `seo.ts`, `wisata.$slug.tsx`, `hapus-akun.tsx`, `getFixedT`, `usaha-seo.ts`, `eksplorasi.tsx`, `root.tsx`, `wisata.tsx`, `sitemap.ts`, `home.tsx`, `syarat-ketentuan.tsx`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **What connects `sharedInit`, `AppLocaleConfig`, `byCode` to the rest of the system?**
  _224 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useLocalePath` be split into smaller, more focused modules?**
  _Cohesion score 0.050726927939317316 - nodes in this community are weakly interconnected._
- **Should `trackEvent` be split into smaller, more focused modules?**
  _Cohesion score 0.058678611422172455 - nodes in this community are weakly interconnected._
- **Should `worker.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09143686502177069 - nodes in this community are weakly interconnected._