# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview
OSAngular is an Angular 17 enterprise application for managing clients, deals, and business workflows. The application uses Firebase for file storage, Socket.IO for real-time notifications, and Angular Material + Tailwind CSS for UI components.

## Development Commands

### Start Development Server
```bash
npm start
# or
ng serve
```
Development server runs at `http://localhost:4200/` with hot reload.

### Build
```bash
# Production build
npm run build
# or
ng build

# Development build with watch mode
npm run watch
# or
ng build --watch --configuration development
```
Build artifacts are stored in `./build/` directory (configured in angular.json).

### Testing
```bash
# Run all unit tests via Karma
npm test
# or
ng test
```

### Code Generation
```bash
# Generate a new component
ng generate component component-name

# Other scaffolding options
ng generate directive|pipe|service|class|guard|interface|enum|module
```

## Architecture

### Core Structure
- **app.config.ts** - Application-wide configuration with Firebase, routing, HTTP client, and authentication interceptor setup
- **app.routes.ts** - Route definitions with role-based guards and permission checks
- **environments/** - Environment-specific configuration (SERVER_URL, Firebase config)

### Authentication & Authorization
The application uses JWT-based authentication with cookies:

1. **Token Management**: TokenService handles JWT storage in cookies and validation
2. **User Management**: UserService manages user state, permissions in localStorage, and provides `can(permission)` and `hasEntityAccess(entityType, entityId)` methods
3. **Auth Guard**: Functional `authGuard` protects routes, validates tokens, and redirects to login with returnUrl
4. **Auth Interceptor**: Global HTTP interceptor checks token validity and handles 401/403 responses
5. **Permission Checks**: Routes use inline guards with UserService.can() for granular permission control

**Admin Access**: Hardcoded check for unit.id === 19 && position.id === 44 in routes (see app.routes.ts line 40)

### Services Architecture
All services use `providedIn: 'root'` for singleton behavior.

**RestService** - Central API communication hub:
- Base URL from environment.SERVER_URL
- Automatic JWT bearer token injection via headers()
- Socket ID header (`x-socket-id`) for real-time correlation
- Comprehensive CRUD operations for all entities
- Error handling delegated to callers

**Key Domain Services**:
- **UserService** - Current user, permissions, entity access checks
- **ClientsService** - Client CRUD and relationship management
- **DealService** - Deal/Project workflow management
- **DocumentService** - Document upload, download, versioning
- **ApprovalService** - Multi-step approval workflow management
- **CdcmService** - CDCM (Cost/Deal Calculation Model) operations
- **NotificationSocketService** - Socket.IO connection, real-time event handling
- **DialogService** - Centralized Material Dialog management
- **ThemeService** - Dark/light mode theme switching

### Data Models
Located in `src/app/models/`, key models include:
- **UserModel** - User entity with position, unit, department hierarchy
- **ClientModel** - Client/company information
- **ServiceModel** / **SubserviceModel** - Service catalog structure
- **ProjectModel** / **DealModel** - Business deal/project entities
- **LegalEntityModel** - Legal entity management

Models typically include static factory methods like `createUserFromLocalStorage()` for deserialization.

### Real-Time Features
**NotificationSocketService** implements Socket.IO client:
- Auto-connects on user login with userID authentication
- Reconnection logic with user validation
- Browser notifications via Notification API
- Global event streams: `dealCreated$`, `dealStatusUpdated$`
- Automatic disconnection on logout

Socket connection is managed by UserService lifecycle (setUser/deleteUser).

### Component Organization

**Feature Modules** (lazy-loadable structure):
- **login/** - Authentication UI
- **clients/** - Client list and management
- **deals/** - Deal list and detail views
- **deal/** - Individual deal workflows with sub-components
- **projects/** - Project management (promoted deals)
- **admin/** - Admin panel with child routes (users, services, approvals, documents)
- **profile/** - User profile and settings
- **navbar/** - Top navigation bar

**Shared Components**:
- **dialogComponents/** - Reusable Material Dialogs (msg-dialog, choose-dialog, multi-option-dialog, loader)
- **flow-parts/** - Deal workflow step components (approvals, document status, comments)
- **shared/components/ui/** - Design system components (button, card, input, select, table, badge, alert)
- **customComponents/** - Application-specific reusable components

### Styling Architecture
- **Tailwind CSS** with custom theme system (primary, secondary, accent, destructive colors)
- **Material Angular** with deep purple-amber theme
- **CSS Custom Properties** for theming (see styles.css :root and .dark)
- **Dark Mode**: Class-based (`.dark`) with system preference fallback
- **Design System**: HSL color tokens with semantic naming (--background, --foreground, etc.)
- **Font**: Montserrat (Google Fonts) used globally
- **Caret Behavior**: Disabled globally except in input/textarea/select/contenteditable

### Routing Patterns
- **Named Outlets**: Admin uses `outlet: 'admin'` for child routes
- **Route Guards**: Composable - authGuard + inline permission guards
- **Entity-Level Permissions**: Async guards check both global permissions and entity-specific access
- **Redirect Strategy**: Login redirect preserves returnUrl query parameter

### Firebase Integration
- **Firebase Storage**: File upload/download via @angular/fire
- **Configuration**: environment.firebaseConfig with apiKey, authDomain, projectId, etc.
- **Providers**: Set up in app.config.ts with provideFirebaseApp and provideStorage

### HTTP Communication
- **Base URL**: Environment-based (localhost:3000 or https://mpapp.rs:3000)
- **Headers**: JWT bearer token + Content-Type + x-socket-id
- **File Uploads**: Multipart/form-data via saveFile/saveFileSys endpoints
- **File Downloads**: Blob response type with downloadFile endpoint
- **Error Patterns**: Services return Observable<any>, components handle errors with DialogService

### State Management
- **User State**: localStorage ('user', 'permissions')
- **Notifications**: NotificationStoreService with in-memory store
- **No NgRx**: Direct service injection and RxJS Subjects for event streams

## Important Patterns

### Permission Checking
```typescript
// Global permission check
if (userService.can('view_all_clients')) { }

// Entity-level access check
const hasAccess = await userService.hasEntityAccess('deal', dealId, 'edit');
```

### Dialog Usage
Always use DialogService for consistent dialog management:
```typescript
dialogService.showMsgDialog('Message text');
dialogService.openLoader(); // Show loading spinner
dialogService.closeLoader();
```

### API Calls
Always use RestService methods instead of direct HttpClient:
```typescript
this.rest.getClients(data).subscribe({
  next: res => { /* handle success */ },
  error: err => {
    this.dialogService.showMsgDialog('Status: ' + err.status + ' msg: ' + err.error.message);
  }
});
```

### File Operations
For file uploads, use FormData and appropriate service methods:
```typescript
const formData = new FormData();
formData.append('file', file);
this.rest.saveFile(formData).subscribe(/* ... */);
```

### Real-Time Updates
Subscribe to socket event streams in components:
```typescript
this.notificationSocketService.dealCreated$.subscribe(data => {
  // Refresh deals list
});
```

## Code Style
- **Indentation**: 2 spaces (configured in .editorconfig)
- **Quotes**: Single quotes for TypeScript files
- **TypeScript**: Strict mode disabled, but uses noImplicitReturns and noFallthroughCasesInSwitch
- **Decorators**: Experimental decorators enabled
- **Target**: ES2022 with DOM libs

## Environment Configuration
Switch between development and production by modifying SERVER_URL in:
- `src/environments/environment.ts` (production)
- `src/environments/environment.development.ts` (development)

File replacements are configured in angular.json build configurations.

## Firebase Deployment
Project is configured for Firebase Hosting:
- Public directory: `dist/osangular/browser`
- All routes rewrite to `/index.html` for SPA routing
- Deploy with Firebase CLI after building

## Material Components
Custom styling overrides for:
- Autocomplete panels - themed with CSS custom properties
- Options - hover, active, selected states
- Dark mode support with media query fallback

## Key Dependencies
- **Angular 17** - Framework
- **Angular Material 17** - UI components
- **Tailwind CSS 3.4** - Utility-first CSS
- **Bootstrap 5.3** - Additional utilities
- **Firebase 10** - File storage
- **Socket.IO Client 4.7** - Real-time communication
- **ngx-cookie-service** - Cookie management
- **ngx-extended-pdf-viewer** - PDF rendering
- **RxJS 7.8** - Reactive programming

## Testing Framework
- **Jasmine 5.1** - Test framework
- **Karma 6.4** - Test runner
- No E2E testing configured yet

## Notes
- Build output changed from default `dist/` to `./build/` (see angular.json)
- Firebase hosting expects `dist/osangular/browser` - ensure build output path compatibility
- Analytics disabled in Angular CLI (angular.json)
- TypeScript strict mode is OFF - be careful with type safety
- Socket connections require valid user data - check UserService.getUser() returns valid user before connecting
