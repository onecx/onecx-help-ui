# Angular 18→19 Migration Progress — onecx-help-ui

## Phase 1: Pre-Migration (OneCX-specific, before Angular upgrade)

- [x] 1.1 Remove @onecx/keycloak-auth
- [x] 1.2 Update component imports
- [x] 1.3 Replace removed components
- [x] 1.4 Update FilterType values
- [x] 1.5 Update ConfigurationService usage
- [x] 1.6 Adjust packages in webpack config
- [x] 1.7 Adjust standalone mode
- [x] 1.8 Remove MenuService
- [x] 1.9 Update translations
- [x] 1.10 Pre-migration build validation

## Phase 2: Angular Upgrade (Developer action)

- [x] 2.1 Upgrade Angular 18→19 (ng update)
- [x] 2.2 Install OneCX libs ^6.x
- [x] 2.3 Confirm upgrade complete

## Phase 3: Post-Migration (OneCX-specific, after Angular upgrade)

- [x] 3.0 Perform actions from Phase 1 that could not be completed initially
- [x] 3.1 Required package updates
- [x] 3.2 Update Portal API Configuration
- [x] 3.3 Remove @onecx/portal-layout-styles
- [x] 3.4 Remove addInitializeModuleGuard()
- [x] 3.5 Remove PortalCoreModule
- [x] 3.6 Replace BASE_URL injection token
- [x] 3.7 Update Theme Service usage
- [x] 3.8 Add Webpack Plugin for PrimeNG
- [x] 3.9 Add Webpack Plugin for Angular Material/CDK
- [x] 3.10 Provide ThemeConfig

## Phase 4: Verification

- [ ] 4.1 Build passes — **FAILED** (critical compilation errors)
- [ ] 4.2 Tests pass — **BLOCKED** (pending build fix)
- [x] 4.3 No legacy imports remaining — **PASS**

## Outstanding Issues (Critical)

### 1. Missing Exports from @onecx/angular-accelerator v6

Files affected:

- [src/app/app.module.ts](src/app/app.module.ts): `translateServiceInitializer`, `PortalMissingTranslationHandler`
- [src/app/onecx-help-remote.module.ts](src/app/onecx-help-remote.module.ts): `PortalMissingTranslationHandler`
- [src/app/help/help-search/help-search.component.ts](src/app/help/help-search/help-search.component.ts): `Column`, `DataViewControlTranslations`
- [src/app/help/help-search/help-search.component.spec.ts](src/app/help/help-search/help-search.component.spec.ts): `Column`, `DataViewControlTranslations`
- [src/app/remotes/help-item-editor/help-item-editor.component.ts](src/app/remotes/help-item-editor/help-item-editor.component.ts): `createRemoteComponentTranslateLoader`
- [src/app/remotes/show-help/show-help.component.ts](src/app/remotes/show-help/show-help.component.ts): `createRemoteComponentTranslateLoader`

**Action**: Consult OneCX v6 documentation to determine replacements

### 2. PrimeNG Module Import Error

File: [src/app/shared/shared.module.ts](src/app/shared/shared.module.ts#L17)
**Error**: `InputTextareaModule` not exported
**Fix**: Change to import `InputTextarea` component directly (PrimeNG 19 changed from NgModule-based to component-based)

### 3. PrimeNG CSS Resource Path

File: [src/styles.scss](src/styles.scss)
**Error**: Cannot resolve `node_modules/primeng/resources/primeng.min.css`
**Fix**: Verify correct path for PrimeNG v19 CSS resources

### 4. Missing @onecx/angular-accelerator Component

File: [src/app/app.component.html](src/app/app.component.html#L1)
**Error**: `ocx-portal-viewport` is not recognized
**Action**: Determine replacement component/element in OneCX v6

### 5. Type Mismatch in Providers

File: [src/app/remotes/help-item-editor/help-item-editor.component.ts](src/app/remotes/help-item-editor/help-item-editor.component.ts#L66)
**Error**: `provideAppInitializer` returns `EnvironmentProviders` but component expects `Provider`
**Fix**: Adjust type or provider structure

### 6. Test Mock Signature Errors

Files:

- [src/app/remotes/help-item-editor/help-item-editor.component.spec.ts](src/app/remotes/help-item-editor/help-item-editor.component.spec.ts#L44)
- [src/app/remotes/show-help/show-help.component.spec.ts](src/app/remotes/show-help/show-help.component.spec.ts#L37)
  **Error**: `hasPermission` mock returns `boolean` but should return `Promise<boolean>`
