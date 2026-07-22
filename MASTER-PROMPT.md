# NexaROS Website Builder — Master Implementation Prompt

## CRITICAL CONTEXT (Read First)

You are continuing development of the NexaROS Website Builder. This is a monorepo with:
- **Backend**: `apps/backend/` — NestJS 11, Prisma 7, PostgreSQL on port 4000
- **Admin Portal**: `apps/admin-portal/` — Next.js 15, React 19, Zustand + TanStack Query, port 3003
- **Customer Web**: `apps/customer-web/` — Next.js 15, React 19, Tailwind v4, port 3001
- **Admin Login**: `admin@nexaros.com` / `admin123` → `POST /api/v1/admin/auth/login` returns `{ token }` (NOT `data.accessToken`)
- **Customer Owner Login**: `nnarasimharao570@gmail.com` / `admin123`, tenant ID: `cmrrm96yf0009qp64zxg3cpia`
- **Prisma**: Use `npx prisma db push --accept-data-loss --skip-generate` for schema changes, then `npx prisma generate`
- **Design System**: `AppColors` with `gray` (NOT `grey`), `danger` (NOT `error`), NO `primary500`/`orange500`/`purple500`
- **Git**: Push after each completed phase. Commit messages: `feat: Phase N — description`

## WHAT'S ALREADY DONE (DO NOT RE-IMPLEMENT)

### Phase 1 — Bug Fixes: ✅ COMPLETE (except 1 bug)
- Route ordering fixed in Gallery, Announcements, Offers controllers
- Menu items added to getWebsiteConfig() categories select
- Offers code alias added
- Gallery category field added to schema/DTO/public response
- Field component labels working
- SocialHoursTab stores structured {open, close, isOpen} objects
- Delete confirmation dialogs implemented
- Unsaved changes warning (beforeunload) implemented
- Slug resolution fixed
- **ONE REMAINING BUG**: Gallery `category` field exists in schema, DTO, and UI, but `gallery.service.ts` `create()` (line 33-48) and `update()` (line 51-65) never persist `dto.category`. Fix: add `category: dto.category` to create data, and `if (dto.category !== undefined) data.category = dto.category` to update data.

### Phase 2 — Media Upload & Preview: ✅ COMPLETE
- MediaAsset Prisma model with folder, tags, dimensions, soft-delete
- MediaService: upload (multer, 10MB limit), list (pagination/filters), delete, getFolders
- MediaController: POST /upload, GET /list, GET /folders, DELETE /:id
- LivePreview: iframe pointing to customer-web, device switching (375px/768px/100%), postMessage theme updates
- MediaField: drag-and-drop file upload with preview
- MediaLibrary: browse/search/delete previously uploaded assets

### Phase 3 — Content Models: ⚠️ PARTIALLY COMPLETE
**DONE:**
- WebsiteRevision Prisma model + save/list/revert endpoints
- History tab with revert-to-revision UI
- Publish confirmation dialog (auto-saves revision before publish)
- publishedAt field on TenantWebsiteConfig
- Gallery drag-drop reorder (@dnd-kit/sortable)
- Live theme preview via postMessage (CSS variables sent to iframe)

**MISSING (implement these):**
- Testimonial model + CRUD + public endpoint + admin tab
- Faq model + CRUD + public endpoint + admin tab
- BlogPost model + CRUD + public endpoint + admin tab
- Event model + CRUD + public endpoint + admin tab

### Phase 5 — Real-time: ⚠️ PARTIALLY COMPLETE
**DONE:**
- Backend Socket.IO fully set up (3 gateways, Redis adapter)
- CMS afterMutation emits `website:updated` and `website:published` events
- Customer-web has `useTenantSocket` hook that auto-refreshes on website events

**MISSING:**
- Admin-portal has NO socket client code (socket.io-client installed but unused)
- No autosave with debounce

## IMPLEMENTATION PLAN

Execute each phase sequentially. After completing each phase, run `pnpm run lint` in the affected app, then commit and push to GitHub before starting the next phase.

---

### PHASE 1 FIX: Gallery Category Bug
**File:** `apps/backend/src/modules/gallery/gallery.service.ts`
- In `create()` method (line 33-48): Add `category: dto.category` to the `data` object in `prisma.galleryImage.create()`
- In `update()` method (line 51-65): Add `if (dto.category !== undefined) data.category = dto.category;` after line 61
- Commit: `fix: persist gallery category field in create/update`

---

### PHASE 3 COMPLETION: Missing Content Models

For each of the 4 content types (Testimonial, Faq, BlogPost, Event), create:

#### A. Prisma Models (add to `apps/backend/prisma/schema.prisma`)

```prisma
model Testimonial {
  id           String   @id @default(cuid())
  tenantId     String
  tenant       Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  customerName String
  rating       Int      @default(5)
  text         String
  avatar       String?
  isFeatured   Boolean  @default(false)
  isVerified   Boolean  @default(false)
  branchId     String?
  deletedAt    DateTime?
  createdBy    String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([tenantId])
  @@map("testimonials")
}

model Faq {
  id           String   @id @default(cuid())
  tenantId     String
  tenant       Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  question     String
  answer       String
  category     String?
  displayOrder Int      @default(0)
  isActive     Boolean  @default(true)
  deletedAt    DateTime?
  createdBy    String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([tenantId])
  @@map("faqs")
}

model BlogPost {
  id          String    @id @default(cuid())
  tenantId    String
  tenant      Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  title       String
  slug        String
  content     String
  excerpt     String?
  coverImage  String?
  author      String?
  tags        String[]
  status      String    @default("DRAFT") // DRAFT, PUBLISHED, ARCHIVED
  publishedAt DateTime?
  deletedAt   DateTime?
  createdBy   String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@unique([tenantId, slug])
  @@index([tenantId])
  @@map("blog_posts")
}

model Event {
  id          String    @id @default(cuid())
  tenantId    String
  tenant      Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  title       String
  description String?
  startDate   DateTime
  endDate     DateTime?
  image       String?
  location    String?
  isVirtual   Boolean   @default(false)
  status      String    @default("UPCOMING") // UPCOMING, ONGOING, PAST, CANCELLED
  deletedAt   DateTime?
  createdBy   String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([tenantId])
  @@map("events")
}
```

Also add relations to the `Tenant` model:
```prisma
testimonials  Testimonial[]
faqs          Faq[]
blogPosts     BlogPost[]
events        Event[]
```

Push with: `cd apps/backend && npx prisma db push --accept-data-loss --skip-generate && npx prisma generate`

#### B. Backend Modules (create for each content type)

Create 4 new NestJS modules following the exact pattern of the existing Gallery module:

**Files to create per module (e.g., for Testimonials):**
- `apps/backend/src/modules/testimonials/testimonials.module.ts` — imports PrismaModule, exports Service
- `apps/backend/src/modules/testimonials/testimonials.service.ts` — CRUD with tenant scoping, soft delete, afterMutation events
- `apps/backend/src/modules/testimonials/testimonials.controller.ts` — Owner endpoints (JWT + TenantScopeGuard)
- `apps/backend/src/modules/testimonials/dto/create-testimonial.dto.ts` — class-validator DTOs
- `apps/backend/src/modules/testimonials/dto/update-testimonial.dto.ts` — PartialType of create DTO

**Repeat for:** `faqs/`, `blog-posts/`, `events/` (use `events` directory name, NOT `blog-events`)

**Key patterns to follow from gallery.module.ts:**
- Module: `@Module({ imports: [PrismaModule], controllers: [...], providers: [...], exports: [...] })`
- Service: Inject `PrismaService`, always filter by `tenantId`, use `afterMutation` for Socket.IO events
- Controller: `@UseGuards(JwtAuthGuard, TenantScopeGuard)`, tenantId from `req.user.tenantId`

**Register all 4 modules in `apps/backend/src/app.module.ts`.**

#### C. Public Endpoints

Add to `apps/backend/src/modules/public/public.controller.ts` and `public.service.ts`:
- `GET /public/cms/:slug/testimonials` — returns testimonials for a tenant by slug
- `GET /public/cms/:slug/faqs` — returns active FAQs sorted by displayOrder
- `GET /public/cms/:slug/blog` — returns published blog posts
- `GET /public/cms/:slug/events` — returns upcoming/ongoing events

Follow the exact pattern of existing public endpoints (e.g., `getPublicOffers`).

#### D. Admin Endpoints

Add admin CRUD endpoints. Either create separate admin controllers per module OR add to existing admin controller pattern. Follow `cms-admin.controller.ts` pattern:
- `GET /admin/tenants/:tenantId/testimonials`
- `POST /admin/tenants/:tenantId/testimonials`
- `PUT /admin/tenants/:tenantId/testimonials/:id`
- `DELETE /admin/tenants/:tenantId/testimonials/:id`

Repeat for faqs, blog-posts, events.

#### E. Admin Portal API Client

Add to `apps/admin-portal/src/lib/api.ts`:
```typescript
// Testimonials
adminApi.listTestimonials(tenantId)
adminApi.createTestimonial(tenantId, data)
adminApi.updateTestimonial(tenantId, id, data)
adminApi.deleteTestimonial(tenantId, id)

// FAQs
adminApi.listFaqs(tenantId)
adminApi.createFaq(tenantId, data)
adminApi.updateFaq(tenantId, id, data)
adminApi.deleteFaq(tenantId, id)

// Blog Posts
adminApi.listBlogPosts(tenantId)
adminApi.createBlogPost(tenantId, data)
adminApi.updateBlogPost(tenantId, id, data)
adminApi.deleteBlogPost(tenantId, id)

// Events
adminApi.listEvents(tenantId)
adminApi.createEvent(tenantId, data)
adminApi.updateEvent(tenantId, id, data)
adminApi.deleteEvent(tenantId, id)
```

#### F. Admin Portal Management Tabs

Add 4 new tabs to `apps/admin-portal/src/app/(dashboard)/website/[tenantId]/page.tsx`:

1. **TestimonialsTab** — DataTable with star rating display, verification toggle, add/edit dialog with rating selector
2. **FaqsTab** — DataTable with drag-drop reorder (@dnd-kit), add/edit dialog with question/answer/category
3. **BlogTab** — DataTable with status badges (Draft/Published), add/edit dialog with title/content/excerpt/cover image/tags
4. **EventsTab** — DataTable with date display, status badges, add/edit dialog with date range/virtual toggle/location

Add these to the tabs array and tab rendering in the main WebsiteHub component.
Import from `management-tabs.tsx` — add the new tab components there.

#### G. Customer-Web Integration

Update `apps/customer-web/src/components/restaurant/RestaurantSite.tsx` to display:
- Testimonials section (star ratings, customer names, avatars)
- FAQ section (accordion-style, categorized)
- Blog section (card grid with cover images)
- Events section (date cards with location)

These should be conditional on the `homeSections` config having them enabled.

**Commit:** `feat: Phase 3 — Testimonial, FAQ, Blog, Event models with CRUD, public endpoints, admin tabs`

---

### PHASE 4: Website Builder Layout

#### A. Extract Tab Components to Separate Files

Move all 11 inline tab components from the 528-line monolith into separate files:
- `apps/admin-portal/src/components/website/tabs/BrandingTab.tsx`
- `apps/admin-portal/src/components/website/tabs/ThemeTab.tsx`
- `apps/admin-portal/src/components/website/tabs/TypographyTab.tsx`
- `apps/admin-portal/src/components/website/tabs/SeoTab.tsx`
- `apps/admin-portal/src/components/website/tabs/SocialHoursTab.tsx`
- `apps/admin-portal/src/components/website/tabs/ContactTab.tsx`
- `apps/admin-portal/src/components/website/tabs/LegalTab.tsx`
- `apps/admin-portal/src/components/website/tabs/SectionsTab.tsx`
- `apps/admin-portal/src/components/website/tabs/FeaturesTab.tsx`
- `apps/admin-portal/src/components/website/tabs/PreviewTab.tsx`
- `apps/admin-portal/src/components/website/tabs/HistoryTab.tsx`
- `apps/admin-portal/src/components/website/tabs/OffersTab.tsx` (move from management-tabs.tsx)
- `apps/admin-portal/src/components/website/tabs/AnnouncementsTab.tsx` (move from management-tabs.tsx)
- `apps/admin-portal/src/components/website/tabs/GalleryTab.tsx` (move from management-tabs.tsx)
- `apps/admin-portal/src/components/website/tabs/TestimonialsTab.tsx` (new)
- `apps/admin-portal/src/components/website/tabs/FaqsTab.tsx` (new)
- `apps/admin-portal/src/components/website/tabs/BlogTab.tsx` (new)
- `apps/admin-portal/src/components/website/tabs/EventsTab.tsx` (new)

Keep shared helpers (`Field`, `ConfirmDeleteDialog`) in `apps/admin-portal/src/components/website/shared.tsx`.

#### B. Create Website Builder Zustand Store

Create `apps/admin-portal/src/stores/website-builder.store.ts`:
```typescript
interface WebsiteBuilderState {
  // UI state
  device: 'desktop' | 'tablet' | 'mobile';
  activeTab: string;
  selectedSection: string | null;
  isPreviewMode: boolean;
  sidebarCollapsed: boolean;
  propertiesPanelOpen: boolean;

  // History (undo/redo)
  history: Record<string, any>[];
  historyIndex: number;
  maxHistory: number;

  // Draft
  draft: Record<string, any>;
  serverHash: string;
  isDirty: boolean;
  lastSavedAt: Date | null;
  lastPublishedAt: Date | null;

  // Actions
  setDevice: (device: 'desktop' | 'tablet' | 'mobile') => void;
  setActiveTab: (tab: string) => void;
  setSelectedSection: (section: string | null) => void;
  togglePreviewMode: () => void;
  setDraft: (updates: Record<string, any>) => void;
  pushHistory: (state: Record<string, any>) => void;
  undo: () => Record<string, any> | null;
  redo: () => Record<string, any> | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  markSaved: (hash: string) => void;
  markPublished: (at: Date) => void;
}
```

#### B. Create WebsiteBuilderLayout Component

Create `apps/admin-portal/src/components/website/WebsiteBuilderLayout.tsx`:
- **3-panel layout**: Left sidebar (260px) + Center canvas + Right properties panel (320px)
- **Left sidebar**: Pages list, Sections navigator, Components library (collapsible)
- **Center canvas**: LivePreview with device switching, section overlay indicators
- **Right panel**: Context-sensitive properties (shows settings for selected section)
- **Top toolbar**: Undo/Redo buttons, Save, Publish, Device switcher, Preview/Build toggle

Use Tailwind CSS grid/flex for layout. Use `framer-motion` for panel animations.

#### C. Refactor WebsiteHub to Use Builder Layout

Update `apps/admin-portal/src/app/(dashboard)/website/[tenantId]/page.tsx` to:
- Import and use `WebsiteBuilderLayout` instead of the current grid layout
- Use the Zustand store for all state management
- Replace local `useState` with store actions

**Commit:** `feat: Phase 4 — 3-panel website builder layout with section-based editing`

---

### PHASE 5 COMPLETION: Real-time Sync

#### A. Admin Portal Socket.IO Client

Create `apps/admin-portal/src/lib/socket.ts`:
```typescript
import { io, Socket } from 'socket.io-client';

// Connect to backend / namespace with admin JWT
// Subscribe to website:updated events for the current tenant
// On event: update draft in store, show toast "Changes detected from another session"
```

Create `apps/admin-portal/src/hooks/use-website-socket.ts`:
```typescript
export function useWebsiteSocket(tenantId: string) {
  // Connect to socket, join tenant room
  // Listen for website:updated → update store draft
  // Listen for website:published → show "Published" toast, update lastPublishedAt
  // Listen for gallery:created/updated/deleted → invalidate queries
  // Cleanup on unmount
}
```

#### B. Autosave with Debounce

Add autosave to the website builder store:
- After any draft change, start a 30-second debounce timer
- If no changes for 30s, auto-save via `adminApi.updateWebsiteConfig()`
- Show "Auto-saved" indicator in toolbar
- Cancel autosave on manual save
- Don't autosave if not dirty

#### C. Conflict Resolution

When receiving a `website:updated` event from another session:
- If the incoming version > local version, show a toast: "Another admin made changes. Accept theirs or keep yours?"
- "Accept" overwrites local draft with server state
- "Keep mine" continues with local draft (will overwrite on next save)

**Commit:** `feat: Phase 5 — admin portal real-time sync with autosave and conflict resolution`

---

### PHASE 6: Publishing Workflow

#### A. Draft/Published Separation

Add `status` field to `TenantWebsiteConfig`:
```prisma
status WebsiteConfigStatus @default(DRAFT)

enum WebsiteConfigStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

#### B. Scheduled Publishing

Add `scheduledPublishAt` field to `TenantWebsiteConfig`:
```prisma
scheduledPublishAt DateTime?
```

Create a cron job in `cms.service.ts`:
```typescript
@Cron(CronExpression.EVERY_MINUTE)
async checkScheduledPublishes() {
  // Find all configs where scheduledPublishAt <= now AND status === DRAFT
  // For each: set status = PUBLISHED, publishedAt = now, emit events
}
```

#### C. Side-by-Side Diff View

Create `apps/admin-portal/src/components/website/DiffView.tsx`:
- Compare current draft vs last published version
- Show added/removed/changed fields with green/red highlighting
- Use JSON diff algorithm (implement simple recursive diff, no library needed)

#### D. Version History Timeline

Enhance the existing HistoryTab with:
- Timeline visualization (vertical line with dots)
- For each revision: show who saved, what changed (diff summary), revert button
- Filter by date range

**Commit:** `feat: Phase 6 — draft/publish workflow with scheduled publishing and diff view`

---

### PHASE 7: SEO, Analytics & AI

#### A. SEO Score Calculation

Create `apps/backend/src/modules/cms/seo-score.service.ts`:
```typescript
calculateSeoScore(config: TenantWebsiteConfig): {
  score: number; // 0-100
  checks: Array<{ name: string; passed: boolean; message: string }>;
}
```

Checks:
- Meta title exists and is 30-60 chars ✓
- Meta description exists and is 120-160 chars ✓
- OG image is set ✓
- Favicon is set ✓
- Logo is set ✓
- Phone number is set ✓
- Address is set ✓
- Social links have at least 2 platforms ✓
- Opening hours are configured ✓
- At least 3 home sections are enabled ✓

Add endpoint: `GET /admin/tenants/:tenantId/website/seo-score`

#### B. SEO Score UI

Add SEO score indicator to the website CMS page:
- Circular progress bar (0-100) in the sidebar
- Color: red (<40), yellow (40-70), green (>70)
- Expandable checklist showing passed/failed items with suggestions

#### C. Google Search Preview

Create `apps/admin-portal/src/components/website/GoogleSearchPreview.tsx`:
- Render a mock Google search result card
- Show: page title (blue), URL (green), meta description (gray)
- Update in real-time as user edits SEO fields

#### D. Social Card Preview

Create `apps/admin-portal/src/components/website/SocialCardPreview.tsx`:
- Render a mock Twitter/Facebook card
- Show: OG image, title, description, URL
- Update in real-time

#### E. Analytics Dashboard

Add a "Visitor Stats" panel to the website dashboard:
- Use the existing BI module data
- Show: total visitors (this week/month), page views, device breakdown (pie chart), top pages
- Use `react-apexcharts` (already installed) for charts

#### F. AI Content Generation

Add "AI Assist" buttons next to:
- Meta title field → generate 3 title suggestions via LlmService
- Meta description field → generate 3 description suggestions
- Tagline field → generate 5 tagline suggestions

Create backend endpoint: `POST /admin/ai/generate-seo` with body `{ type: 'title'|'description'|'tagline', context: { restaurantName, cuisine, existingContent } }`

Use the existing `LlmService` (`apps/backend/src/modules/ai-chat/llm.service.ts`).

#### G. Fix Sitemap

Fix `apps/customer-web/src/app/sitemap.ts`:
- The `getTenantSlugs()` function returns empty array
- Query the backend for active tenant slugs: `fetch('http://localhost:4000/api/v1/public/tenants/slugs')`
- OR create a new public endpoint: `GET /public/tenants/slugs` that returns active tenant slugs

**Commit:** `feat: Phase 7 — SEO score, search/social previews, analytics dashboard, AI content generation`

---

### PHASE 8: Advanced Features

#### A. Undo/Redo

Implement in the Zustand store:
- History stack of max 50 states
- On every draft change, push current state to history
- Undo: restore previous state, push current to redo stack
- Redo: restore next state, push current to undo stack
- Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Shift+Z (redo)
- Show undo/redo buttons in toolbar with count badges

#### B. Visual Section Reordering

Enhance `SectionsTab` with `@dnd-kit/sortable`:
- Replace arrow buttons with drag handles
- Each section is a sortable card with preview thumbnail
- Drag to reorder, auto-save order on drop

#### C. Per-Section Visibility Toggles

Add visibility options to each home section:
- Desktop only / Tablet only / Mobile only / All devices
- Store as `visibility: { desktop: true, tablet: true, mobile: true }` in section config
- Apply visibility in customer-web via CSS classes or conditional rendering

#### D. Branch-Specific Content Overrides

For multi-branch restaurants:
- Allow overriding content per branch (e.g., different hours, different hero image)
- Add `branchId` optional field to website config overrides
- Store as `branchOverrides: { [branchId]: Partial<WebsiteConfig> }` in the main config
- Customer-web resolves branch overrides based on selected branch

**Commit:** `feat: Phase 8 — undo/redo, visual section reorder, per-section visibility, branch overrides`

---

## EXECUTION RULES

1. **After each phase**: Run `pnpm run lint` in the modified app. Fix any errors before committing.
2. **Schema changes**: Always use `npx prisma db push --accept-data-loss --skip-generate` then `npx prisma generate`.
3. **Module registration**: Every new NestJS module MUST be imported in `apps/backend/src/app.module.ts`.
4. **Tenant scoping**: Every query MUST filter by `tenantId`. Never write queries without tenant filtering.
5. **Primary keys**: Always use `cuid()` (string), never auto-increment integers.
6. **Soft deletes**: Use `deletedAt` timestamp, never hard delete.
7. **No comments**: Do not add code comments unless explicitly asked.
8. **Git**: Commit after each phase with descriptive message, push to `main`.
9. **Backend restart**: After any backend change, verify it compiles by checking `/tmp/backend.log`.
10. **Frontend restart**: Next.js auto-recompiles. Check `/tmp/admin-portal.log` or `/tmp/customer-web.log` for errors.

## VERIFICATION

After ALL phases are complete:
1. Check all 4 dev servers are running (ports 3001, 3002, 3003, 4000)
2. Test admin login at `http://localhost:3003/login`
3. Navigate to `http://localhost:3003/website` — verify tenant list loads
4. Select a tenant — verify all tabs load (including new Testimonials, FAQ, Blog, Events)
5. Test gallery drag-drop reorder
6. Test live preview with device switching
7. Test publish flow with confirmation dialog
8. Test revision history (save revision, revert)
9. Test media upload via MediaField
10. Verify customer-web loads at `http://localhost:3001/restaurant/narasimha-restaurants`
11. Run `git log --oneline -10` to verify all phase commits exist
