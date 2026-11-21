# Graph Report - web  (2026-11-16)

## Corpus Check
- 189 files · ~266,100 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 19 file(s) not represented in the graph (top: (none) 5, .mdc 3, .example 3)

## Summary
- 1149 nodes · 3614 edges · 64 communities (56 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 22 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d10c55f3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react-router
- acara.$slug.tsx
- worker.ts
- kontribusi.tsx
- env.ts
- ColdHostGate
- api-publik.tsx
- usaha-parse.ts
- localePath
- events.ts
- locale-layout.tsx
- usaha-contribute-form.tsx
- api-client.ts
- locales.ts
- event-contributions.ts
- seo.ts
- wisata.$slug.tsx
- package.json
- ruang-diskusi.tsx
- compilerOptions
- hapus-akun.tsx
- devDependencies
- ref_node_assert
- kuliner.tsx
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
- root.tsx
- word.entity.ts
- sitemap.ts
- @mantine/core
- useLocalePath
- syarat-ketentuan.tsx
- entry.server.tsx
- api.entity.ts
- sw.js
- apiClient
- faq-content.ts
- @react-router/dev
- upload-sitemap.sh
- engines
- ensure-sitemap-bucket.sh
- encyclopedia.use-case.ts
- encyclopedia.tsx
- words.$lemma.tsx
- failover.ts
- trackEvent
- rss[.]xml.ts
- analytics.ts
- discussion.use-case.ts
- privacy-policy.tsx
- encyclopedia.$slug.tsx
- acara.usulan.tsx
- kontribusi.massal.tsx
- overrides

## God Nodes (most connected - your core abstractions)
1. `localePath()` - 117 edges
2. `isAppLocale()` - 105 edges
3. `useLocalePath()` - 87 edges
4. `buildMetaTags()` - 86 edges
5. `getFixedT()` - 75 edges
6. `@mantine/core` - 66 edges
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

## Communities (64 total, 8 thin omitted)

### Community 0 - "react-router"
Cohesion: 0.15
Nodes (20): LocaleLayoutData, ListWordsParams, searchWords(), SearchWordsParams, WordSummary, SearchBar(), SearchBarProps, glossLines() (+12 more)

### Community 1 - "acara.$slug.tsx"
Cohesion: 0.07
Nodes (59): getDiscussionDetail(), formatDateId(), formatDateTimeId(), WordImage, WordImageAttribution, EventImage, fetchEventBySlug(), fetchEventImages() (+51 more)

### Community 2 - "worker.ts"
Cohesion: 0.09
Nodes (43): cacheKeyRequest(), cacheKeyUrl(), cacheTtlSeconds(), canonicalCachePath(), freshSeconds(), isCacheableRequest(), isOgImagePath(), isSitemapPath() (+35 more)

### Community 3 - "kontribusi.tsx"
Cohesion: 0.08
Nodes (41): DialectRef, LanguageRef, listDialects(), listLanguages(), listWordClasses(), pickDefaultDialectId(), pickIndonesianLanguage(), pickSambasLanguage() (+33 more)

### Community 4 - "env.ts"
Cohesion: 0.10
Nodes (19): getWordByLemma(), listWordsAtoZ(), LOGO_DATA_URL, clampLemma(), clampText(), isValidLemma(), OG_CARD_HEIGHT, OG_CARD_WIDTH (+11 more)

### Community 5 - "ColdHostGate"
Cohesion: 0.12
Nodes (12): abortError(), AbortLike, COLD_HOST_MAX_IN_FLIGHT, ColdHostGate, Waiter, acquireApiSlot(), acquireColdSlot(), decideFailoverStep() (+4 more)

### Community 6 - "api-publik.tsx"
Cohesion: 0.12
Nodes (26): API_PUBLIK_ATTRIBUTION, API_PUBLIK_BASE, API_PUBLIK_DOCS_URL, API_PUBLIK_INTRO, API_PUBLIK_OPENAPI_URL, API_PUBLIK_OUT_OF_SCOPE, API_PUBLIK_PRIMARY, API_PUBLIK_SECONDARY (+18 more)

### Community 7 - "usaha-parse.ts"
Cohesion: 0.15
Nodes (21): SubmitUsahaContributionInput, fetchUsahaBySlug(), ApiUsaha, ApiUsahaItem, KIND_LABELS, KINDS, mapItem(), mapUsaha() (+13 more)

### Community 8 - "localePath"
Cohesion: 0.14
Nodes (37): getFixedT(), isAppLocale(), localePath(), eventSeoLabels(), buildApiPublikJsonLd(), buildHomeJsonLd(), buildLetterJsonLd(), buildMetaTags() (+29 more)

### Community 9 - "events.ts"
Cohesion: 0.07
Nodes (43): buildEventJsonLd(), buildEventListJsonLd(), buildEventSeoCopy(), eventOgLocale(), EventSeoLabels, interpolate(), resolveLocale(), LABELS (+35 more)

### Community 10 - "locale-layout.tsx"
Cohesion: 0.16
Nodes (15): getClientI18n(), createI18nInstance(), APP_LOCALES, LOCALE_COOKIE, fromAcceptLanguage(), localeCookieHeader(), localeCookieValue(), parseCookie() (+7 more)

### Community 11 - "usaha-contribute-form.tsx"
Cohesion: 0.21
Nodes (15): submitUsahaContribution(), fetchUsahaCategories(), CENTER, cleanQuery(), hitsFrom(), inSambas(), NominatimHit, pin() (+7 more)

### Community 12 - "api-client.ts"
Cohesion: 0.18
Nodes (11): AppError, attempt(), bindSignals(), ErrorPayload, InfraFailure, NotFoundError, RateLimitError, RequestOptions (+3 more)

### Community 13 - "locales.ts"
Cohesion: 0.16
Nodes (11): getCatalog(), sharedInit, AppLocale, AppLocaleConfig, byCode, DEFAULT_LOCALE, I18N_DEFAULT_NS, i18nResources (+3 more)

### Community 14 - "event-contributions.ts"
Cohesion: 0.23
Nodes (10): compressImageForUpload(), PHOTO_UPLOAD_MAX_HEIGHT, PHOTO_UPLOAD_MAX_WIDTH, PHOTO_UPLOAD_QUALITY, EventContribution, EventContributionPayload, EventContributionStatus, SubmitEventContributionInput (+2 more)

### Community 15 - "seo.ts"
Cohesion: 0.15
Nodes (18): lemmaAltFromLocalizedPath(), LOGO_OG_SIZE, resolveOgImageSize(), barePathFromLocalized(), buildFaqJsonLd(), buildHreflangLinks(), buildWordJsonLd(), buildWordSeoCopy() (+10 more)

### Community 16 - "wisata.$slug.tsx"
Cohesion: 0.09
Nodes (37): placeViewKey(), PlaceViewStorage, recordPlaceViewOnce(), fetchPlaceBySlug(), fetchPlaceImages(), fetchPlaces(), ApiImage, mapPlace() (+29 more)

### Community 17 - "package.json"
Cohesion: 0.09
Nodes (24): description, name, private, type, version, @cloudflare/workers-types, dompurify, eslint (+16 more)

### Community 18 - "ruang-diskusi.tsx"
Cohesion: 0.50
Nodes (3): buildDiscussionFaqJsonLd(), meta(), PLAY_STORE_URL

### Community 19 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx, lib (+12 more)

### Community 20 - "hapus-akun.tsx"
Cohesion: 0.23
Nodes (14): confirmAccountDeletion(), requestAccountDeletion(), resetPassword(), ResetPasswordInput, formError(), HapusAkunPage(), onConfirm(), onRequest() (+6 more)

### Community 21 - "devDependencies"
Cohesion: 0.11
Nodes (18): devDependencies, @cloudflare/vite-plugin, @cloudflare/workers-types, eslint, @eslint/js, eslint-plugin-react, eslint-plugin-react-hooks, globals (+10 more)

### Community 23 - "kuliner.tsx"
Cohesion: 0.26
Nodes (10): buildCuisineJsonLd(), buildCuisineListJsonLd(), buildCuisineListSeo(), isLocale(), resolve(), Cuisine, cuisineCover(), CuisineCard() (+2 more)

### Community 24 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, dompurify, highlight.js, i18next, isbot, lucide-react, @mantine/code-highlight, @mantine/core (+9 more)

### Community 25 - "sitemap[.]xml.ts"
Cohesion: 0.36
Nodes (7): listEncyclopediaArticles(), collectVerifiedWords(), EncyclopediaArticleListItem, fetchEncyclopediaArticles(), fetchUsahas(), loader(), loader()

### Community 26 - "cuisines.ts"
Cohesion: 0.23
Nodes (14): fetchCuisineBySlug(), fetchCuisines(), fetchCuisinesFromCdn(), CuisineImage, CuisineSource, parseApiCuisine(), parseCdnCuisines(), parseCuisine() (+6 more)

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

### Community 35 - "root.tsx"
Cohesion: 0.25
Nodes (5): App(), ErrorBoundary(), Layout(), subscribeNoop(), theme

### Community 36 - "word.entity.ts"
Cohesion: 0.13
Nodes (21): getWordOfDay(), formatWordClass(), formatWordType(), MONTH_NAMES_ID, MeaningGroup, MeaningGroupMember, WordClass, WordExample (+13 more)

### Community 37 - "sitemap.ts"
Cohesion: 0.71
Nodes (5): seoLocales(), buildUrlsetXml(), priorityForLocale(), xhtmlAlternates(), xmlEscape()

### Community 38 - "@mantine/core"
Cohesion: 0.15
Nodes (16): HOME_NAV_HUBS, PLAY_STORE_URL, Footer(), Header(), MobileDrawer, Logo(), LogoProps, subscribeNoop() (+8 more)

### Community 39 - "useLocalePath"
Cohesion: 0.16
Nodes (14): useLocalePath(), submitEncyclopediaContribution(), getPublicProfile(), VerifierMark(), STATUS_COLOR, STATUS_KEY, UsahaCard(), EncyclopediaUsulanPage() (+6 more)

### Community 40 - "syarat-ketentuan.tsx"
Cohesion: 0.33
Nodes (4): LegalDoc, MarkdownBlocks(), meta(), TermsPage()

### Community 41 - "entry.server.tsx"
Cohesion: 0.33
Nodes (4): streamTimeout, RFC-9110, isbot, react-dom

### Community 42 - "api.entity.ts"
Cohesion: 0.15
Nodes (11): listCategories(), ApiErrorDetail, ApiErrorPayload, ApiResponse, ApiResponseError, ApiResponseSuccess, CursorMeta, CursorPage (+3 more)

### Community 43 - "sw.js"
Cohesion: 0.60
Nodes (3): cachePut(), handleAsset(), handleNavigation()

### Community 44 - "apiClient"
Cohesion: 0.24
Nodes (7): PublicProfile, apiClient(), resolveUrl(), isColdTier(), isReplayableMethod(), releaseApiSlot(), releaseColdSlot()

### Community 51 - "encyclopedia.use-case.ts"
Cohesion: 0.13
Nodes (18): listArticleComments(), ListEncyclopediaArticlesParams, listEncyclopediaTags(), listMyEncyclopediaContributions(), ArticleDetailResponse, EncyclopediaArticle, EncyclopediaArticleAuthor, EncyclopediaArticleListItem (+10 more)

### Community 52 - "encyclopedia.tsx"
Cohesion: 0.17
Nodes (15): getLocaleConfig(), stripLocalePrefix(), swapLocalePath(), useLocale(), listEncyclopediaCategories(), LanguageSwitcher(), LanguageSwitcherPanel(), useLocaleSwitch() (+7 more)

### Community 53 - "words.$lemma.tsx"
Cohesion: 0.16
Nodes (13): getWordDetail(), RelatedWord, WordAudio, groupRelations(), RELATION_LABELS, RELATION_ORDER, RelationSection, WordAudioPlayer() (+5 more)

### Community 54 - "failover.ts"
Cohesion: 0.20
Nodes (11): activeTier(), advanceTier(), apiGate, ApiTier, cancelProbe(), coldGate, effectiveIndex(), hasFallbacks() (+3 more)

### Community 55 - "trackEvent"
Cohesion: 0.24
Nodes (11): submitEventContribution(), fetchEventCategories(), trackEvent(), EventContributeForm(), submit(), SOURCE_TYPES, EventKontribusiPage(), blankMassRows() (+3 more)

### Community 56 - "rss[.]xml.ts"
Cohesion: 0.27
Nodes (9): LatestWord, listLatestWords(), buildRssXml(), RssChannel, RssItem, toRfc822(), loader(), loadLatestWords() (+1 more)

### Community 57 - "analytics.ts"
Cohesion: 0.36
Nodes (10): AnalyticsEventName, AnalyticsParams, ensureGtagLoaded(), isGaDebugMode(), isGaEnabled(), measurementId(), trackPageView(), Window (+2 more)

### Community 58 - "discussion.use-case.ts"
Cohesion: 0.27
Nodes (8): ListDiscussionsParams, listPublishedDiscussions(), DiscussionPublicDetail, DiscussionPublicImage, DiscussionPublicItem, DiscussionReply, DiscussionReplyStatus, loader()

### Community 59 - "privacy-policy.tsx"
Cohesion: 0.33
Nodes (4): LegalDoc, MarkdownBlocks(), meta(), PrivacyPolicyPage()

### Community 60 - "encyclopedia.$slug.tsx"
Cohesion: 0.47
Nodes (4): getEncyclopediaArticle(), buildEncyclopediaArticleJsonLd(), loader(), meta()

### Community 61 - "acara.usulan.tsx"
Cohesion: 0.40
Nodes (4): fetchMyEventContributions(), EventUsulanPage(), STATUS_COLOR, STATUS_KEY

### Community 63 - "overrides"
Cohesion: 0.50
Nodes (4): fflate, satori, pnpm, overrides

## Knowledge Gaps
- **244 isolated node(s):** `sharedInit`, `AppLocaleConfig`, `byCode`, `ResetPasswordInput`, `ListDiscussionsParams` (+239 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 338 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react-router` connect `react-router` to `acara.$slug.tsx`, `worker.ts`, `kontribusi.tsx`, `env.ts`, `api-publik.tsx`, `localePath`, `events.ts`, `locale-layout.tsx`, `locales.ts`, `seo.ts`, `wisata.$slug.tsx`, `package.json`, `ruang-diskusi.tsx`, `hapus-akun.tsx`, `kuliner.tsx`, `layanan.kontribusi.tsx`, `root.tsx`, `word.entity.ts`, `@mantine/core`, `useLocalePath`, `syarat-ketentuan.tsx`, `entry.server.tsx`, `encyclopedia.tsx`, `words.$lemma.tsx`, `analytics.ts`, `privacy-policy.tsx`, `encyclopedia.$slug.tsx`, `acara.usulan.tsx`, `kontribusi.massal.tsx`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Why does `@mantine/core` connect `@mantine/core` to `react-router`, `acara.$slug.tsx`, `kontribusi.tsx`, `api-publik.tsx`, `events.ts`, `locale-layout.tsx`, `usaha-contribute-form.tsx`, `seo.ts`, `wisata.$slug.tsx`, `package.json`, `ruang-diskusi.tsx`, `hapus-akun.tsx`, `kuliner.tsx`, `contribute-form.tsx`, `layanan.kontribusi.tsx`, `root.tsx`, `word.entity.ts`, `useLocalePath`, `syarat-ketentuan.tsx`, `encyclopedia.tsx`, `words.$lemma.tsx`, `trackEvent`, `privacy-policy.tsx`, `encyclopedia.$slug.tsx`, `acara.usulan.tsx`, `kontribusi.massal.tsx`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Why does `localePath()` connect `localePath` to `react-router`, `acara.$slug.tsx`, `kontribusi.tsx`, `env.ts`, `api-publik.tsx`, `events.ts`, `locale-layout.tsx`, `locales.ts`, `seo.ts`, `wisata.$slug.tsx`, `ruang-diskusi.tsx`, `hapus-akun.tsx`, `kuliner.tsx`, `usaha-seo.ts`, `layanan.kontribusi.tsx`, `root.tsx`, `sitemap.ts`, `@mantine/core`, `useLocalePath`, `syarat-ketentuan.tsx`, `encyclopedia.tsx`, `words.$lemma.tsx`, `rss[.]xml.ts`, `privacy-policy.tsx`, `encyclopedia.$slug.tsx`, `acara.usulan.tsx`, `kontribusi.massal.tsx`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **What connects `sharedInit`, `AppLocaleConfig`, `byCode` to the rest of the system?**
  _244 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `acara.$slug.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06751054852320675 - nodes in this community are weakly interconnected._
- **Should `worker.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09143686502177069 - nodes in this community are weakly interconnected._
- **Should `kontribusi.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07673469387755102 - nodes in this community are weakly interconnected._