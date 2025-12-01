here

# 🎨 **AutoSecure Frontend - Complete Development Plan**

**Project:** Next.js 16 Frontend for AutoSecure  
**Approach:** Option B (Full Code Delivery)  
**Design:** Multi-step form for policies, custom HTML for dashboard/lists  
**Timeline:** ~10-12 phases

---

## 📋 **Table of Contents**

1. [Project Overview](#project-overview)
2. [Tech Stack & Tools](#tech-stack--tools)
3. [Design System](#design-system)
4. [Phase Breakdown](#phase-breakdown)
5. [File Structure](#file-structure)
6. [Acceptance Criteria](#acceptance-criteria)

---

## 🎯 **Project Overview**

**Frontend Features:**

- ✅ Two-factor authentication (Email + Password + TOTP)
- ✅ Dashboard with analytics (charts, metrics)
- ✅ Multi-step policy form (6 sections, 46 fields)
- ✅ Policy list with filters, search, pagination
- ✅ Policy detail view (view, edit, delete, PDF, email)
- ✅ Admin dashboard (Meta, Users, Email Templates, Site Settings)
- ✅ Export interface (field selection, filters)
- ✅ Audit logs viewer
- ✅ Responsive design (desktop, tablet, mobile)
- ✅ Role-based UI (Owner, Admin, User)

---

## 🛠️ **Tech Stack & Tools**

### **Core**

- **Framework:** Next.js 16 (App Router, React 19)
- **Language:** TypeScript 5.9
- **Styling:** Tailwind CSS 4
- **Animations:** Framer Motion
- **Forms:** React Hook Form + Zod
- **HTTP:** Axios
- **Charts:** Recharts (lightweight, React-native)
- **Icons:** Heroicons
- **Notifications:** React Hot Toast
- **Date Picker:** React DatePicker
- **Rich Text Editor:** Tiptap (for email templates)

### **UI Components**

- **Headless UI:** Modals, Dropdowns, Tabs
- **Custom Components:** Buttons, Inputs, Cards, Tables, File Upload

### **State Management**

- **Auth:** React Context API
- **Server State:** SWR (data fetching, caching)
- **Form State:** React Hook Form

---

## 🎨 **Design System**

### **Colors** (Match Backend Branding)

```typescript
// tailwind.config.ts
colors: {
  primary: '#3B82F6',    // Blue (main actions)
  secondary: '#10B981',  // Green (success)
  accent: '#F59E0B',     // Amber (warnings)
  danger: '#EF4444',     // Red (errors, delete)
  dark: '#1F2937',       // Dark gray (text)
  light: '#F9FAFB',      // Light gray (backgrounds)
}
```

### **Typography**

- **Font:** Inter (already configured)
- **Sizes:** xs, sm, base, lg, xl, 2xl, 3xl, 4xl

### **Spacing**

- **Consistent:** 4px increments (1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48)

### **Components Style**

- **Cards:** White bg, subtle shadow, rounded corners
- **Buttons:** Primary (blue), Secondary (gray), Danger (red)
- **Inputs:** Border focus effect, error states
- **Tables:** Striped rows, hover effects
- **Modals:** Backdrop blur, slide-in animation

---

## 📦 **Phase Breakdown**

---

### **Phase 1️⃣: Foundation & Setup** (Deliverables: 5)

**Goal:** Configure project, setup Tailwind, API client, routing structure

#### **Deliverables:**

1. **Tailwind Configuration**
   - Custom theme (colors, fonts, spacing)
   - Custom components (buttons, inputs, cards)
   - Responsive breakpoints

2. **API Client Setup**
   - Axios instance with base URL
   - Request/response interceptors
   - Token refresh logic
   - Error handling

3. **TypeScript Types**
   - API response types
   - Policy, User, Meta, AuditLog types
   - Form validation schemas (Zod)

4. **Routing Structure**
   - App Router setup
   - Route groups (auth, dashboard)
   - Middleware for protected routes

5. **Environment Variables**
   - `.env.local` setup
   - API base URL, frontend URL

#### **Acceptance Criteria:**

- ✅ Tailwind compiles without errors
- ✅ API client makes test requests
- ✅ TypeScript types match backend models
- ✅ Routes render correctly

---

### **Phase 2️⃣: Authentication System** (Deliverables: 6)

**Goal:** Complete auth flow (login, TOTP, logout, session management)

#### **Deliverables:**

1. **Auth Context & Hooks**
   - `AuthContext.tsx` (user state, login/logout)
   - `useAuth()` hook
   - `useRequireAuth()` hook (redirect if not logged in)
   - Token storage (localStorage + httpOnly cookies)

2. **Login Page**
   - Email + Password form
   - Form validation (Zod)
   - Error handling (wrong credentials)
   - Loading states
   - Redirect to TOTP

3. **TOTP Verification Page**
   - 6-digit code input (auto-focus, numeric only)
   - QR code display (first-time setup)
   - Error handling (invalid code)
   - Success → Dashboard redirect

4. **Protected Route Middleware**
   - Check auth on page load
   - Redirect to login if not authenticated
   - Handle token expiry

5. **Logout Functionality**
   - Clear tokens
   - API call to `/auth/logout`
   - Redirect to login

6. **Auth UI Components**
   - Auth layout (centered card)
   - Logo, branding
   - Animations (fade in, slide up)

#### **Acceptance Criteria:**

- ✅ User can login with email + password
- ✅ TOTP verification works (6-digit code)
- ✅ First-time users see QR code
- ✅ Protected routes redirect to login
- ✅ Logout clears session
- ✅ Token refresh works automatically

---

### **Phase 3️⃣: Dashboard Layout** (Deliverables: 4)

**Goal:** Sidebar, topbar, navigation, responsive design

#### **Deliverables:**

1. **Sidebar Component**
   - Logo at top
   - Navigation links (Dashboard, Policies, Admin, Exports)
   - Active state highlighting
   - Collapsible on mobile
   - Role-based menu items (Owner sees Admin, Users don't)
   - Logout button at bottom

2. **Topbar Component**
   - Page title (dynamic)
   - User profile dropdown (name, email, role, logout)
   - Notifications icon (future)
   - Breadcrumbs (optional)
   - Mobile: hamburger menu toggle

3. **Dashboard Layout Wrapper**
   - Sidebar + Topbar + Content area
   - Responsive (sidebar collapses on mobile)
   - Framer Motion transitions (page changes)
   - Loading states (skeleton screens)

4. **Navigation Logic**
   - Active route detection
   - Dynamic page titles
   - Role-based access (hide admin links for users)

#### **Acceptance Criteria:**

- ✅ Sidebar shows correct links based on role
- ✅ Topbar displays user info
- ✅ Navigation works smoothly
- ✅ Responsive on mobile/tablet/desktop
- ✅ Animations are smooth

---

### **Phase 4️⃣: Dashboard Analytics** (Deliverables: 5)

**Goal:** Overview page with charts, metrics, insights (using your HTML reference)

#### **Deliverables:**

1. **Overview Page Layout**
   - Use your HTML reference as base
   - Metrics cards (4-6 cards)
   - Charts section (2-3 charts)
   - Recent activity feed

2. **Metrics Cards**
   - Total Policies (with trend ↑/↓)
   - Active Policies
   - Total Premium Collected
   - Policies Expiring Soon
   - Monthly Revenue
   - Pending Payments

3. **Charts Components**
   - **Policies Over Time** (Line chart - Recharts)
   - **Premium by Status** (Pie chart)
   - **Top Branches** (Bar chart)
   - **Monthly Trends** (Area chart)

4. **Analytics Data Fetching**
   - Fetch from `/api/v1/analytics/overview`
   - Fetch from `/api/v1/analytics/trends`
   - SWR for caching
   - Loading skeletons
   - Error states

5. **Recent Activity**
   - Last 10 policies created
   - Quick links to view policy

#### **Acceptance Criteria:**

- ✅ Dashboard loads analytics data
- ✅ Charts render correctly with real data
- ✅ Metrics cards show correct numbers
- ✅ Responsive on all devices
- ✅ Loading states work
- ✅ Matches your HTML design reference

---

### **Phase 5️⃣: Policy List Page** (Deliverables: 6)

**Goal:** Insurance list with filters, search, pagination (using your HTML reference)

#### **Deliverables:**

1. **Policy List Page Layout**
   - Use your HTML reference
   - Table view (desktop)
   - Card view (mobile)
   - Header with "Add New Policy" button

2. **Policy Table Component**
   - Columns: Policy No, Customer, Vehicle, Status, Premium, Actions
   - Sortable columns
   - Row actions (View, Edit, Delete, PDF, Email)
   - Hover effects
   - Striped rows

3. **Filters & Search**
   - Search bar (policy no, customer, registration)
   - Filter by status (dropdown)
   - Filter by branch (dropdown)
   - Filter by payment status (dropdown)
   - Date range filter (start/end date)
   - Clear filters button

4. **Pagination Component**
   - Page numbers
   - Previous/Next buttons
   - Items per page selector (10, 25, 50, 100)
   - Total count display

5. **Data Fetching (SWR)**
   - Fetch policies from `/api/v1/policies`
   - Query params: page, limit, search, filters
   - Debounced search
   - Loading states
   - Error handling

6. **Quick Actions**
   - **View:** Opens detail modal
   - **Edit:** Navigates to edit form
   - **Delete:** Confirmation modal → API call
   - **PDF:** Downloads PDF
   - **Email:** Sends premium email (with success toast)

#### **Acceptance Criteria:**

- ✅ Policy list displays correctly
- ✅ Search works (debounced)
- ✅ Filters work (status, branch, payment)
- ✅ Pagination works
- ✅ Sorting works
- ✅ Quick actions work (view, edit, delete, PDF, email)
- ✅ Responsive design
- ✅ Matches your HTML reference

---

### **Phase 6️⃣: Multi-Step Policy Form (Create)** (Deliverables: 8)

**Goal:** Wizard-style form for creating policies (6 steps, 46 fields)

#### **Deliverables:**

1. **Form Wizard Container**
   - Step indicator (1/6, 2/6, etc.)
   - Progress bar (visual)
   - Step titles (Policy Details, Customer, Vehicle, etc.)
   - Previous/Next navigation
   - Step validation (can't proceed if errors)

2. **Step 1: Policy Details**
   - Fields: serial_no, policy_no, issue_date, ins_type, start_date, end_date, ins_status, ins_co_id, saod dates, inspection
   - Dropdowns from Meta (ins_type, ins_status)
   - Date pickers
   - Validation (Zod schema)

3. **Step 2: Customer Details**
   - Fields: branch_id, executive, customer, aadhaar, PAN, mobile, email, city, address
   - File uploads (Aadhaar, PAN) - drag & drop or click
   - Validation (PAN format, Aadhaar 12 digits, email, mobile)

4. **Step 3: Vehicle Details**
   - Fields: product, manufacturer, model, hypothecation, mfg_date, engine, chassis, registration, reg_date
   - Dependent dropdown (model_name depends on manufacturer)
   - Validation (uppercase engine/chassis/reg numbers)

5. **Step 4: Premium Details**
   - Fields: sum_insured, cng_value, discounted_value, ncb, net_premium, on_date_premium, addon_coverage, commission, courier
   - Multi-select (addon_coverage)
   - Number inputs with currency formatting
   - Validation (min 0, max constraints)

6. **Step 5: Customer Payment**
   - Fields: premium_amount, payment_type, payment_status, voucher_no, payment_details (repeating group)
   - Repeating group UI (add/remove payment entries)
   - Validation (sum of payments = premium_amount)

7. **Step 6: Krunal Payment & Review**
   - Fields: krunal_payment_mode, krunal_bank_name, krunal_cheque_no, krunal_amount, krunal_cheque_date
   - **Review Section:** Summary of all entered data (read-only, grouped)
   - "Submit" button (creates policy)

8. **Form Submission**
   - Collect all steps data
   - FormData with files
   - POST to `/api/v1/policies`
   - Loading state (disable form, show spinner)
   - Success: Show toast, redirect to policy detail
   - Error: Show error, allow retry

#### **Acceptance Criteria:**

- ✅ All 6 steps render correctly
- ✅ Navigation works (Next/Previous)
- ✅ Step validation prevents progression
- ✅ File uploads work (Aadhaar, PAN)
- ✅ Dependent dropdowns work (manufacturer → model)
- ✅ Payment details repeating group works
- ✅ Review step shows all data
- ✅ Form submission creates policy
- ✅ Error handling works
- ✅ Responsive on all devices

---

### **Phase 7️⃣: Policy Detail & Edit** (Deliverables: 5)

**Goal:** View policy, edit policy, delete, download PDF, send email

#### **Deliverables:**

1. **Policy Detail Page**
   - Fetch policy from `/api/v1/policies/:id`
   - Display all fields (sectioned like backend)
   - File preview (Aadhaar, PAN - click to open in new tab)
   - Action buttons (Edit, Delete, Download PDF, Send Email)

2. **Edit Policy (Reuse Multi-Step Form)**
   - Pre-fill form with existing data
   - Allow changing files (upload new, delete old)
   - PATCH to `/api/v1/policies/:id`
   - Success: Update UI, show toast

3. **Delete Policy**
   - Confirmation modal ("Type DELETE to confirm")
   - DELETE to `/api/v1/policies/:id`
   - Success: Redirect to list, show toast

4. **Download PDF**
   - GET `/api/v1/policies/:id/pdf`
   - Download as file
   - Loading state (button shows spinner)

5. **Send Email**
   - POST `/api/v1/emails/send-premium`
   - Success toast ("Email sent to customer")
   - Error toast (rate limit, email failure)
   - Disable button for 60s after send (show countdown)

#### **Acceptance Criteria:**

- ✅ Policy detail displays all data
- ✅ Files can be previewed/downloaded
- ✅ Edit form works (pre-filled)
- ✅ Delete requires confirmation
- ✅ PDF downloads correctly
- ✅ Email sends successfully
- ✅ Rate limiting feedback works

---

### **Phase 8️⃣: Admin - Meta Management** (Deliverables: 4)

**Goal:** CRUD for dropdown options (Meta)

#### **Deliverables:**

1. **Meta Categories List**
   - Display all categories (ins_type, ins_status, ncb, etc.)
   - Click category → Show options

2. **Meta Options Table**
   - Columns: Value, Label, Active, Sort Order, Actions
   - Sortable (drag & drop reordering)
   - Add new option (inline form)
   - Edit option (inline edit)
   - Delete option (confirmation)
   - Toggle active/inactive

3. **Meta CRUD Operations**
   - **Create:** POST `/api/v1/meta`
   - **Update:** PATCH `/api/v1/meta/:id`
   - **Delete:** DELETE `/api/v1/meta/:id`
   - **Reorder:** POST `/api/v1/meta/reorder`

4. **Dependent Dropdowns Setup**
   - UI to set parent_value (e.g., model_name → manufacturer)

#### **Acceptance Criteria:**

- ✅ All categories displayed
- ✅ Options can be added/edited/deleted
- ✅ Reordering works (drag & drop)
- ✅ Active/inactive toggle works
- ✅ Dependent dropdowns can be configured

---

### **Phase 9️⃣: Admin - User Management** (Deliverables: 3)

**Goal:** CRUD for users, role management

#### **Deliverables:**

1. **User List Table**
   - Columns: Email, Full Name, Role, Active, Created At, Actions
   - Owner-only: Change role, Delete user
   - Admin: Create user, Activate/Deactivate user

2. **Create User Modal**
   - Email, Password, Role, Full Name
   - POST to `/api/v1/users`
   - Success: Add to table, show toast

3. **User Management Actions**
   - **Change Role** (Owner only): Dropdown → PATCH `/api/v1/users/:id/role`
   - **Toggle Status** (Admin): Active/Inactive → PATCH `/api/v1/users/:id/status`
   - **Delete User** (Owner only): Confirmation → DELETE `/api/v1/users/:id`

#### **Acceptance Criteria:**

- ✅ User list displays correctly
- ✅ Create user works
- ✅ Role changes work (Owner only)
- ✅ Activate/Deactivate works
- ✅ Delete works (with confirmation)
- ✅ Role-based access enforced

---

### **Phase 🔟: Admin - Email Templates** (Deliverables: 3)

**Goal:** Edit email templates (premium_details)

#### **Deliverables:**

1. **Email Template List**
   - Display all templates (name, active status)
   - Click → Edit

2. **Email Template Editor**
   - Rich text editor (Tiptap) for body_html
   - Subject line input (with {{variables}})
   - Variable helper (show available variables)
   - Preview pane (rendered HTML)
   - Save button (PATCH `/api/v1/email-templates/:id`)

3. **Template Variables**
   - Display list of available variables
   - Click to insert into editor
   - Preview updates in real-time

#### **Acceptance Criteria:**

- ✅ Templates can be edited
- ✅ Rich text editor works
- ✅ Variables can be inserted
- ✅ Preview shows rendered HTML
- ✅ Save persists changes

---

### **Phase 1️⃣1️⃣: Admin - Site Settings & Branding** (Deliverables: 4)

**Goal:** Site kill-switch, branding settings, logo upload

#### **Deliverables:**

1. **Site Settings Page**
   - Toggle site enabled/disabled (Owner only)
   - Maintenance message input
   - Save button (PATCH `/api/v1/settings/toggle`, `/api/v1/settings/message`)

2. **Branding Settings**
   - Company name input
   - Color pickers (primary, secondary, accent)
   - Footer text input
   - Save button (PATCH `/api/v1/settings/branding`)

3. **Logo Upload**
   - File upload (PNG/JPG)
   - Preview current logo
   - Upload button (POST `/api/v1/settings/branding/logo`)
   - Success: Update preview

4. **Kill-Switch Indicator**
   - If site disabled, show banner at top (Owner sees "Site Disabled" badge)
   - Non-owners see maintenance page

#### **Acceptance Criteria:**

- ✅ Site can be toggled on/off
- ✅ Maintenance message updates
- ✅ Branding settings save correctly
- ✅ Logo upload works
- ✅ Kill-switch indicator shows

---

### **Phase 1️⃣2️⃣: Audit Logs Viewer** (Deliverables: 3)

**Goal:** Display audit logs with filters (using your HTML reference)

#### **Deliverables:**

1. **Audit Logs Page**
   - Use your HTML reference
   - Table view: User, Action, Resource, Details, IP, Timestamp
   - Filters: Action type, Date range, User

2. **Filters & Search**
   - Filter by action (login, create, update, delete, export)
   - Date range picker
   - User selector (dropdown)

3. **Data Fetching**
   - GET `/api/v1/audit-logs` (you'll need to create this endpoint)
   - Pagination
   - Loading states

#### **Acceptance Criteria:**

- ✅ Audit logs display correctly
- ✅ Filters work
- ✅ Pagination works
- ✅ Matches HTML reference

---

### **Phase 1️⃣3️⃣: Export Interface** (Deliverables: 4)

**Goal:** Export policies to Excel with field selection

#### **Deliverables:**

1. **Export Page**
   - Field selector (checkbox list of all 46 fields)
   - "Select All" / "Deselect All" buttons
   - Date range filter (start, end)
   - Status filters (ins_status, payment_status, branch)

2. **Field Categories**
   - Group fields by section (Policy Details, Customer, Vehicle, Premium, Payment)
   - Collapsible sections

3. **Export Button**
   - POST to `/api/v1/exports/policies` with selected fields
   - Download Excel file
   - Loading state (disable button, show spinner)
   - Success toast

4. **Export Presets**
   - Save/Load field selections (localStorage)
   - "Quick Export" (all fields)
   - "Basic Export" (policy_no, customer, premium, status)

#### **Acceptance Criteria:**

- ✅ Field selection works
- ✅ Export generates Excel file
- ✅ Filters work (date range, status)
- ✅ Presets work

---

### **Phase 1️⃣4️⃣: UI Polish & Responsive** (Deliverables: 6)

**Goal:** Final touches, animations, error handling, accessibility

#### **Deliverables:**

1. **Loading States**
   - Skeleton screens (policy list, dashboard)
   - Spinners (buttons, forms)
   - Progress bars (file uploads)

2. **Error Handling**
   - Toast notifications (react-hot-toast)
   - Error pages (404, 500)
   - Form validation errors (inline)
   - API error messages

3. **Animations (Framer Motion)**
   - Page transitions (fade in)
   - Modal open/close (slide up)
   - List item animations (stagger)
   - Button hover effects

4. **Responsive Design**
   - Mobile: Hamburger menu, card view
   - Tablet: Sidebar collapsible, optimized table
   - Desktop: Full layout

5. **Accessibility**
   - Keyboard navigation (Tab, Enter, Esc)
   - Focus states (visible outlines)
   - ARIA labels (screen readers)
   - Color contrast (WCAG AA)

6. **Performance**
   - Image optimization (Next.js Image)
   - Code splitting (dynamic imports)
   - Caching (SWR)
   - Lazy loading (large lists)

#### **Acceptance Criteria:**

- ✅ Loading states work
- ✅ Errors display correctly
- ✅ Animations are smooth
- ✅ Responsive on all devices
- ✅ Keyboard navigation works
- ✅ Performance is good (Lighthouse score >90)

---

## 📁 **File Structure (Detailed)**

```
└── 📁autosecure
    └── 📁backend
        └── 📁src
            └── 📁config
                ├── database.ts
            └── 📁controllers
                ├── analyticsController.ts
                ├── auditLogController.ts
                ├── authController.ts
                ├── emailController.ts
                ├── emailTemplateController.ts
                ├── exportController.ts
                ├── fileController.ts
                ├── metaController.ts
                ├── policyController.ts
                ├── siteSettingsController.ts
                ├── userController.ts
            └── 📁middleware
                ├── authMiddleware.ts
                ├── errorMiddleware.ts
                ├── rateLimitMiddleware.ts
                ├── siteMiddleware.ts
                ├── uploadMiddleware.ts
            └── 📁models
                ├── AuditLog.ts
                ├── EmailLog.ts
                ├── EmailTemplate.ts
                ├── index.ts
                ├── Meta.ts
                ├── Policy.ts
                ├── SiteSettings.ts
                ├── User.ts
            └── 📁routes
                ├── analyticsRoutes.ts
                ├── auditLogRoutes.ts
                ├── authRoutes.ts
                ├── emailRoutes.ts
                ├── emailTemplateRoutes.ts
                ├── exportRoutes.ts
                ├── fileRoutes.ts
                ├── metaRoutes.ts
                ├── policyRoutes.ts
                ├── siteSettingsRoutes.ts
                ├── userRoutes.ts
            └── 📁scripts
                ├── initDb.ts
                ├── migratePolicyFields.ts
                ├── seedEmailTemplate.ts
                ├── seedMeta.ts
                ├── testEmail.ts
            └── 📁services
                ├── auditService.ts
                ├── emailService.ts
                ├── fileStorageService.ts
                ├── jwtService.ts
                ├── passwordService.ts
                ├── pdfService.ts
                ├── smtpService.ts
                ├── totpService.ts
            └── 📁types
                ├── express.d.ts
            └── 📁utils
                ├── asyncHandler.ts
                ├── errors.ts
                ├── validators.ts
            ├── server.ts
            ├── test-services.ts
        └── 📁storage
            └── 📁backups
            └── 📁branding
                ├── logo-1024.png
                ├── logo.png
            └── 📁policies
                └── 📁123456789
                    ├── aadhaar_123456789012.png
                    ├── pan_ABCDE1234F.pdf
                    ├── RC_Book_1764257301990.pdf
                └── 📁pol_0011
        ├── .env
        ├── .env.example
        ├── nodemon.json
        ├── package.json
        ├── test-auth.http
        ├── tsconfig.json
        ├── tsconfig.tsbuildinfo
    └── 📁frontend
            └── 📁types
                └── 📁app
                    └── 📁(auth)
                        └── 📁login
                            ├── page.ts
                        └── 📁verify-totp
                            ├── page.ts
                        ├── layout.ts
                    └── 📁(dashboard)
                        └── 📁admin
                            └── 📁email-templates
                                ├── page.ts
                            └── 📁meta
                                ├── page.ts
                            └── 📁settings
                                ├── page.ts
                            └── 📁users
                                ├── page.ts
                        └── 📁audit-logs
                            ├── page.ts
                        └── 📁dashboard
                            ├── page.ts
                        └── 📁exports
                            ├── page.ts
                        └── 📁policies
                            └── 📁[id]
                                └── 📁edit
                                    ├── page.ts
                                ├── page.ts
                            └── 📁new
                                ├── page.ts
                            ├── page.ts
                    ├── page.ts
                ├── cache-life.d.ts
                ├── package.json
                ├── routes.d.ts
                ├── validator.ts
            ├── build-manifest.json
            ├── package.json
            ├── react-loadable-manifest.json
            ├── trace
        └── 📁app
            └── 📁(auth)
                └── 📁login
                    ├── page.tsx
                └── 📁verify-totp
                    ├── page.tsx
                ├── layout.tsx
            └── 📁(dashboard)
                └── 📁admin
                    └── 📁audit-logs
                        ├── page.tsx
                    └── 📁email-templates
                        ├── page.tsx
                    └── 📁meta
                        ├── page.tsx
                    └── 📁settings
                        ├── page.tsx
                    └── 📁users
                        ├── page.tsx
                └── 📁dashboard
                    ├── page.tsx
                └── 📁exports
                    ├── page.tsx
                └── 📁policies
                    └── 📁[id]
                        └── 📁edit
                            ├── page.tsx
                        ├── page.tsx
                    └── 📁new
                        ├── page.tsx
                    ├── page.tsx
                ├── layout.tsx
            ├── favicon.ico
            ├── globals.css
            ├── layout.tsx
            ├── not-found.tsx
            ├── page.tsx
        └── 📁components
            └── 📁admin
                ├── AccessDenied.tsx
                ├── CreateMetaModal.tsx
                ├── CreateUserModal.tsx
                ├── MetaOptionsTable.tsx
                ├── UserTable.tsx
            └── 📁audit
            └── 📁auth
            └── 📁charts
            └── 📁dashboard
                ├── MetricCard.tsx
                ├── MonthlyTrendChart.tsx
                ├── PoliciesByStatusChart.tsx
                ├── PoliciesByTypeChart.tsx
                ├── QuickActions.tsx
                ├── RecentActivity.tsx
            └── 📁exports
            └── 📁layout
                ├── Sidebar.tsx
                ├── SiteStatusBanner.tsx
                ├── Topbar.tsx
            └── 📁policies
                └── 📁steps
                    ├── Step1PolicyDetails.tsx
                    ├── Step2CustomerDetails.tsx
                    ├── Step3VehicleDetails.tsx
                    ├── Step4PremiumDetails.tsx
                    ├── Step5PaymentDetails.tsx
                    ├── Step6ReviewSubmit.tsx
                ├── PolicyFilters.tsx
                ├── PolicyTable.tsx
                ├── PolicyWizard.tsx
                ├── SendEmailModal.tsx
            └── 📁ui
                ├── Badge.tsx
                ├── Button.tsx
                ├── Card.tsx
                ├── Checkbox.tsx
                ├── FileUpload.tsx
                ├── Input.tsx
                ├── LoadingBar.tsx
                ├── Modal.tsx
                ├── Pagination.tsx
                ├── Select.tsx
                ├── Skeleton.tsx
                ├── Spinner.tsx
                ├── Table.tsx
        └── 📁lib
            └── 📁api
                ├── analytics.ts
                ├── auditLogs.ts
                ├── auth.ts
                ├── client.ts
                ├── emails.ts
                ├── emailTemplates.ts
                ├── exports.ts
                ├── meta.ts
                ├── policies.ts
                ├── settings.ts
                ├── users.ts
            └── 📁context
                ├── AuthContext.tsx
                ├── PolicyFormContext.tsx
            └── 📁hooks
                ├── useAnalytics.ts
                ├── useAuth.ts
                ├── useMeta.ts
                ├── usePolicies.ts
                ├── useRequireRole.ts
                ├── useToast.ts
            └── 📁types
                ├── api.ts
                ├── auditLog.ts
                ├── emailTemplate.ts
                ├── meta.ts
                ├── policy.ts
                ├── user.ts
            └── 📁utils
                ├── constants.ts
                ├── formatters.ts
                ├── validators.ts
        └── 📁public
            ├── logo-1024.png
            ├── logo.png
        ├── .env.local
        ├── .env.local.example
        ├── .gitignore
        ├── eslint.config.mjs
        ├── next-env.d.ts
        ├── next.config.js
        ├── package.json
        ├── postcss.config.js
        ├── postcss.config.mjs
        ├── tailwind.config.ts
        ├── tsconfig.json
    └── 📁shared
        └── 📁constants
        └── 📁types
        ├── package.json
        ├── tsconfig.json
    ├── .eslintrc.js
    ├── .hintrc
    ├── .prettierrc
    ├── package-lock.json
    ├── package.json
    └── tsconfig.base.json
```

---

## ✅ **Acceptance Criteria (Overall)**

### **Functional**

- ✅ All auth flows work (login, TOTP, logout)
- ✅ Dashboard displays real analytics
- ✅ Policies can be created, edited, deleted
- ✅ Multi-step form works smoothly
- ✅ File uploads work (Aadhaar, PAN)
- ✅ PDF download works
- ✅ Email sending works
- ✅ Admin can manage meta, users, templates, settings
- ✅ Exports generate Excel files
- ✅ Audit logs display

### **Design**

- ✅ Matches your HTML references (dashboard, audit logs, policy list)
- ✅ Multi-step form is intuitive
- ✅ Consistent styling (colors, typography, spacing)
- ✅ Smooth animations
- ✅ Responsive on all devices

### **Technical**

- ✅ TypeScript strict mode (no errors)
- ✅ ESLint passes
- ✅ Fast page loads (<2s)
- ✅ API calls optimized (caching with SWR)
- ✅ Error handling comprehensive
- ✅ Accessible (keyboard nav, ARIA labels)

---

we completely made **Phase 1️⃣3️⃣: Export Interface** and were going to start **Phase 1️⃣4️⃣: UI Polish & Responsive**

now wait for my next prompt which will include most important details if you understand then say yes and wait
