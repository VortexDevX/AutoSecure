📁 AutoSecure/
├── 📁 backend/
│   ├── 📁 src/
│   │   ├── 📁 config/
│   │   │   └── 📄 database.ts
│   │   ├── 📁 controllers/
│   │   │   ├── 📄 analyticsController.ts
│   │   │   ├── 📄 auditLogController.ts
│   │   │   ├── 📄 authController.ts
│   │   │   ├── 📄 emailController.ts
│   │   │   ├── 📄 emailTemplateController.ts
│   │   │   ├── 📄 exportController.ts
│   │   │   ├── 📄 fileController.ts
│   │   │   ├── 📄 licenseController.ts
│   │   │   ├── 📄 licenseFileController.ts
│   │   │   ├── 📄 metaController.ts
│   │   │   ├── 📄 policyController.ts
│   │   │   ├── 📄 siteSettingsController.ts
│   │   │   └── 📄 userController.ts
│   │   ├── 📁 middleware/
│   │   │   ├── 📄 authMiddleware.ts
│   │   │   ├── 📄 errorMiddleware.ts
│   │   │   ├── 📄 rateLimitMiddleware.ts
│   │   │   ├── 📄 siteMiddleware.ts
│   │   │   └── 📄 uploadMiddleware.ts
│   │   ├── 📁 models/
│   │   │   ├── 📄 AuditLog.ts
│   │   │   ├── 📄 EmailLog.ts
│   │   │   ├── 📄 EmailTemplate.ts
│   │   │   ├── 📄 LicenseRecord.ts
│   │   │   ├── 📄 Meta.ts
│   │   │   ├── 📄 Policy.ts
│   │   │   ├── 📄 SiteSettings.ts
│   │   │   ├── 📄 User.ts
│   │   │   └── 📄 index.ts
│   │   ├── 📁 routes/
│   │   │   ├── 📄 analyticsRoutes.ts
│   │   │   ├── 📄 auditLogRoutes.ts
│   │   │   ├── 📄 authRoutes.ts
│   │   │   ├── 📄 emailRoutes.ts
│   │   │   ├── 📄 emailTemplateRoutes.ts
│   │   │   ├── 📄 exportRoutes.ts
│   │   │   ├── 📄 fileRoutes.ts
│   │   │   ├── 📄 licenseRoutes.ts
│   │   │   ├── 📄 metaRoutes.ts
│   │   │   ├── 📄 policyRoutes.ts
│   │   │   ├── 📄 siteSettingsRoutes.ts
│   │   │   └── 📄 userRoutes.ts
│   │   ├── 📁 scripts/
│   │   │   ├── 📄 initDb.ts
│   │   │   ├── 📄 migrateLicenseUrls.ts
│   │   │   ├── 📄 migratePolicyFields.ts
│   │   │   ├── 📄 migratePolicyFolderWhitespace.ts
│   │   │   ├── 📄 migratePolicyFolders.ts
│   │   │   ├── 📄 seedEmailTemplate.ts
│   │   │   ├── 📄 seedLicenseEmailTemplate.ts
│   │   │   ├── 📄 seedMeta.ts
│   │   │   └── 📄 testEmail.ts
│   │   ├── 📁 services/
│   │   │   ├── 📄 auditService.ts
│   │   │   ├── 📄 emailService.ts
│   │   │   ├── 📄 fileStorageService.ts
│   │   │   ├── 📄 jwtService.ts
│   │   │   ├── 📄 licenseStorageService.ts
│   │   │   ├── 📄 passwordService.ts
│   │   │   ├── 📄 smtpService.ts
│   │   │   └── 📄 totpService.ts
│   │   ├── 📁 types/
│   │   │   └── 📄 express.d.ts
│   │   ├── 📁 utils/
│   │   │   ├── 📄 asyncHandler.ts
│   │   │   ├── 📄 errors.ts
│   │   │   └── 📄 validators.ts
│   │   ├── 📄 server.ts
│   │   └── 📄 test-services.ts
│   ├── 📁 storage/
│   │   └── 📁 branding/
│   │       └── 📄 logo.png
│   ├── 📄 nodemon.json
│   ├── 📄 package.json
│   ├── 📄 test-auth.http
│   └── 📄 tsconfig.json
├── 📁 electron-app/
│   ├── 📁 release/
│   │   ├── 📁 .icon-ico/
│   │   │   └── 📄 icon.ico
│   │   ├── 📁 win-unpacked/
│   │   │   ├── 📁 locales/
│   │   │   │   ├── 📄 af.pak
│   │   │   │   ├── 📄 am.pak
│   │   │   │   ├── 📄 ar.pak
│   │   │   │   ├── 📄 bg.pak
│   │   │   │   ├── 📄 bn.pak
│   │   │   │   ├── 📄 ca.pak
│   │   │   │   ├── 📄 cs.pak
│   │   │   │   ├── 📄 da.pak
│   │   │   │   ├── 📄 de.pak
│   │   │   │   ├── 📄 el.pak
│   │   │   │   ├── 📄 en-GB.pak
│   │   │   │   ├── 📄 en-US.pak
│   │   │   │   ├── 📄 es-419.pak
│   │   │   │   ├── 📄 es.pak
│   │   │   │   ├── 📄 et.pak
│   │   │   │   ├── 📄 fa.pak
│   │   │   │   ├── 📄 fi.pak
│   │   │   │   ├── 📄 fil.pak
│   │   │   │   ├── 📄 fr.pak
│   │   │   │   ├── 📄 gu.pak
│   │   │   │   ├── 📄 he.pak
│   │   │   │   ├── 📄 hi.pak
│   │   │   │   ├── 📄 hr.pak
│   │   │   │   ├── 📄 hu.pak
│   │   │   │   ├── 📄 id.pak
│   │   │   │   ├── 📄 it.pak
│   │   │   │   ├── 📄 ja.pak
│   │   │   │   ├── 📄 kn.pak
│   │   │   │   ├── 📄 ko.pak
│   │   │   │   ├── 📄 lt.pak
│   │   │   │   ├── 📄 lv.pak
│   │   │   │   ├── 📄 ml.pak
│   │   │   │   ├── 📄 mr.pak
│   │   │   │   ├── 📄 ms.pak
│   │   │   │   ├── 📄 nb.pak
│   │   │   │   ├── 📄 nl.pak
│   │   │   │   ├── 📄 pl.pak
│   │   │   │   ├── 📄 pt-BR.pak
│   │   │   │   ├── 📄 pt-PT.pak
│   │   │   │   ├── 📄 ro.pak
│   │   │   │   ├── 📄 ru.pak
│   │   │   │   ├── 📄 sk.pak
│   │   │   │   ├── 📄 sl.pak
│   │   │   │   ├── 📄 sr.pak
│   │   │   │   ├── 📄 sv.pak
│   │   │   │   ├── 📄 sw.pak
│   │   │   │   ├── 📄 ta.pak
│   │   │   │   ├── 📄 te.pak
│   │   │   │   ├── 📄 th.pak
│   │   │   │   ├── 📄 tr.pak
│   │   │   │   ├── 📄 uk.pak
│   │   │   │   ├── 📄 ur.pak
│   │   │   │   ├── 📄 vi.pak
│   │   │   │   ├── 📄 zh-CN.pak
│   │   │   │   └── 📄 zh-TW.pak
│   │   │   ├── 📁 resources/
│   │   │   │   ├── 📁 backend/
│   │   │   │   │   └── 📄 package.json
│   │   │   │   ├── 📁 frontend/
│   │   │   │   └── 📄 app.asar
│   │   │   ├── 📄 LICENSE.electron.txt
│   │   │   ├── 📄 LICENSES.chromium.html
│   │   │   ├── 📄 chrome_100_percent.pak
│   │   │   ├── 📄 chrome_200_percent.pak
│   │   │   ├── 📄 icudtl.dat
│   │   │   ├── 📄 resources.pak
│   │   │   ├── 📄 snapshot_blob.bin
│   │   │   ├── 📄 v8_context_snapshot.bin
│   │   │   └── 📄 vk_swiftshader_icd.json
│   │   ├── 📄 AutoSecure Setup 1.0.0.exe.blockmap
│   │   ├── 📄 builder-debug.yml
│   │   └── 📄 builder-effective-config.yaml
│   ├── 📄 icon.ico
│   ├── 📄 logo.png
│   ├── 📄 main.js
│   ├── 📄 package.json
│   └── 📄 splash.html
├── 📁 frontend/
│   ├── 📁 app/
│   │   ├── 📁 (auth)/
│   │   │   ├── 📁 login/
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 verify-totp/
│   │   │   │   └── 📄 page.tsx
│   │   │   └── 📄 layout.tsx
│   │   ├── 📁 (dashboard)/
│   │   │   ├── 📁 admin/
│   │   │   │   ├── 📁 audit-logs/
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   ├── 📁 email-templates/
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   └── 📁 users/
│   │   │   │       └── 📄 page.tsx
│   │   │   ├── 📁 dashboard/
│   │   │   │   ├── 📄 loading.tsx
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 exports/
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 licenses/
│   │   │   │   ├── 📁 [id]/
│   │   │   │   │   ├── 📁 edit/
│   │   │   │   │   │   ├── 📄 ClientPage.tsx
│   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   ├── 📄 ClientPage.tsx
│   │   │   │   │   ├── 📄 layout.tsx
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   ├── 📁 new/
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   ├── 📄 loading.tsx
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 policies/
│   │   │   │   ├── 📁 [id]/
│   │   │   │   │   ├── 📁 edit/
│   │   │   │   │   │   ├── 📄 ClientPage.tsx
│   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   ├── 📄 ClientPage.tsx
│   │   │   │   │   ├── 📄 layout.tsx
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   ├── 📁 new/
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   ├── 📄 loading.tsx
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📄 error.tsx
│   │   │   ├── 📄 layout.tsx
│   │   │   └── 📄 loading.tsx
│   │   ├── 📄 favicon.ico
│   │   ├── 📄 global-error.tsx
│   │   ├── 📄 globals.css
│   │   ├── 📄 layout.tsx
│   │   ├── 📄 not-found.tsx
│   │   └── 📄 page.tsx
│   ├── 📁 components/
│   │   ├── 📁 admin/
│   │   │   ├── 📄 AccessDenied.tsx
│   │   │   ├── 📄 CreateMetaModal.tsx
│   │   │   ├── 📄 CreateUserModal.tsx
│   │   │   ├── 📄 MetaOptionsTable.tsx
│   │   │   └── 📄 UserTable.tsx
│   │   ├── 📁 dashboard/
│   │   │   ├── 📄 BranchPerformance.tsx
│   │   │   ├── 📄 FinancialMetrics.tsx
│   │   │   ├── 📄 LicenseAnalytics.tsx
│   │   │   ├── 📄 MetricCard.tsx
│   │   │   ├── 📄 MobileBlockScreen.tsx
│   │   │   ├── 📄 MonthlyTrendChart.tsx
│   │   │   ├── 📄 NotificationsCenter.tsx
│   │   │   ├── 📄 PerformanceChart.tsx
│   │   │   ├── 📄 PoliciesByStatusChart.tsx
│   │   │   ├── 📄 PoliciesByTypeChart.tsx
│   │   │   ├── 📄 QuickActions.tsx
│   │   │   ├── 📄 QuickActionsPanel.tsx
│   │   │   ├── 📄 RecentActivity.tsx
│   │   │   ├── 📄 RenewalCalendar.tsx
│   │   │   └── 📄 RevenueTrendChart.tsx
│   │   ├── 📁 layout/
│   │   │   ├── 📄 Sidebar.tsx
│   │   │   ├── 📄 SiteStatusBanner.tsx
│   │   │   └── 📄 Topbar.tsx
│   │   ├── 📁 licenses/
│   │   │   ├── 📄 LicenseFilters.tsx
│   │   │   ├── 📄 LicenseForm.tsx
│   │   │   ├── 📄 LicenseTable.tsx
│   │   │   └── 📄 SendLicenseEmailModal.tsx
│   │   ├── 📁 policies/
│   │   │   ├── 📁 steps/
│   │   │   │   ├── 📄 Step1PolicyDetails.tsx
│   │   │   │   ├── 📄 Step2CustomerDetails.tsx
│   │   │   │   ├── 📄 Step3VehicleDetails.tsx
│   │   │   │   ├── 📄 Step4PremiumDetails.tsx
│   │   │   │   ├── 📄 Step5PaymentDetails.tsx
│   │   │   │   └── 📄 Step6ReviewSubmit.tsx
│   │   │   ├── 📄 PolicyFilters.tsx
│   │   │   ├── 📄 PolicyTable.tsx
│   │   │   ├── 📄 PolicyWizard.tsx
│   │   │   └── 📄 SendEmailModal.tsx
│   │   └── 📁 ui/
│   │       ├── 📄 Badge.tsx
│   │       ├── 📄 Button.tsx
│   │       ├── 📄 Card.tsx
│   │       ├── 📄 Checkbox.tsx
│   │       ├── 📄 DatePicker.tsx
│   │       ├── 📄 DateRangeSelector.tsx
│   │       ├── 📄 FileUpload.tsx
│   │       ├── 📄 Input.tsx
│   │       ├── 📄 LoadingBar.tsx
│   │       ├── 📄 Modal.tsx
│   │       ├── 📄 NavLink.tsx
│   │       ├── 📄 PageLoader.tsx
│   │       ├── 📄 PageTransition.tsx
│   │       ├── 📄 Pagination.tsx
│   │       ├── 📄 Select.tsx
│   │       ├── 📄 Skeleton.tsx
│   │       ├── 📄 Spinner.tsx
│   │       └── 📄 Table.tsx
│   ├── 📁 lib/
│   │   ├── 📁 api/
│   │   │   ├── 📄 analytics.ts
│   │   │   ├── 📄 auditLogs.ts
│   │   │   ├── 📄 auth.ts
│   │   │   ├── 📄 client.ts
│   │   │   ├── 📄 emailTemplates.ts
│   │   │   ├── 📄 emails.ts
│   │   │   ├── 📄 exports.ts
│   │   │   ├── 📄 licenses.ts
│   │   │   ├── 📄 meta.ts
│   │   │   ├── 📄 policies.ts
│   │   │   ├── 📄 settings.ts
│   │   │   └── 📄 users.ts
│   │   ├── 📁 context/
│   │   │   ├── 📄 AuthContext.tsx
│   │   │   ├── 📄 NavigationContext.tsx
│   │   │   ├── 📄 PolicyFormContext.tsx
│   │   │   └── 📄 PrivacyContext.tsx
│   │   ├── 📁 hooks/
│   │   │   ├── 📄 useAnalytics.ts
│   │   │   ├── 📄 useAuth.ts
│   │   │   ├── 📄 useMeta.ts
│   │   │   ├── 📄 usePolicies.ts
│   │   │   ├── 📄 useRequireRole.ts
│   │   │   ├── 📄 useRouteId.ts
│   │   │   └── 📄 useToast.ts
│   │   ├── 📁 theme/
│   │   │   └── 📄 palettes.ts
│   │   ├── 📁 types/
│   │   │   ├── 📄 api.ts
│   │   │   ├── 📄 auditLog.ts
│   │   │   ├── 📄 emailTemplate.ts
│   │   │   ├── 📄 license.ts
│   │   │   ├── 📄 meta.ts
│   │   │   ├── 📄 policy.ts
│   │   │   └── 📄 user.ts
│   │   └── 📁 utils/
│   │       ├── 📄 constants.ts
│   │       ├── 📄 exportFields.ts
│   │       ├── 📄 formatters.ts
│   │       ├── 📄 tokenStore.ts
│   │       └── 📄 validators.ts
│   ├── 📁 public/
│   │   ├── 📄 logo-1024.png
│   │   └── 📄 logo.png
│   ├── 📄 build_log.txt
│   ├── 📄 build_log_2.txt
│   ├── 📄 build_log_3.txt
│   ├── 📄 eslint.config.mjs
│   ├── 📄 lint_output.txt
│   ├── 📄 next-env.d.ts
│   ├── 📄 next.config.js
│   ├── 📄 package.json
│   ├── 📄 postcss.config.js
│   ├── 📄 postcss.config.mjs
│   ├── 📄 tailwind.config.ts
│   └── 📄 tsconfig.json
├── 📄 .eslintrc.js
├── 📄 .gitignore
├── 📄 .hintrc
├── 📄 .prettierrc
├── 📄 README.md
├── 📄 STRUCTURE.md
├── 📄 structure.json
└── 📄 tsconfig.base.json
