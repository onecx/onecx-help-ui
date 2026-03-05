# Angular 18→19 Migration Progress — onecx-help-ui

## Phase 1: Pre-Migration (OneCX-specific, before Angular upgrade)

- [x] 1.1 Remove @onecx/keycloak-auth
- [ ] 1.2 Update component imports (some imports could not be moved)
- [x] 1.3 Replace removed components
- [x] 1.4 Update FilterType values
- [x] 1.5 Update ConfigurationService usage
- [x] 1.6 Adjust packages in webpack config
- [x] 1.7 Adjust standalone mode
- [x] 1.8 Remove MenuService
- [x] 1.9 Update translations
- [x] 1.10 Pre-migration build validation

## Phase 2: Angular Upgrade (Developer action)

- [ ] 2.1 Upgrade Angular 18→19 (ng update)
- [ ] 2.2 Install OneCX libs ^6.x
- [ ] 2.3 Confirm upgrade complete

## Phase 3: Post-Migration (OneCX-specific, after Angular upgrade)

- [ ] 3.1 Required package updates
- [ ] 3.2 Update Portal API Configuration
- [ ] 3.3 Remove @onecx/portal-layout-styles
- [ ] 3.4 Remove addInitializeModuleGuard()
- [ ] 3.5 Remove PortalCoreModule
- [ ] 3.6 Replace BASE_URL injection token
- [ ] 3.7 Update Theme Service usage
- [ ] 3.8 Add Webpack Plugin for PrimeNG
- [ ] 3.9 Add Webpack Plugin for Angular Material/CDK
- [ ] 3.10 Provide ThemeConfig

## Phase 4: Verification

- [ ] 4.1 Build passes
- [ ] 4.2 Tests pass
- [ ] 4.3 No legacy imports remaining
