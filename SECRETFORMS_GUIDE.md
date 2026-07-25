# Secret Forms System - Complete Implementation

## Overview
A professional, type-specific secret management system with dedicated form components for each secret type. The system includes a dropdown button interface for selecting secret types before creating them.

## Directory Structure
```
components/secrets/forms/
├── types.ts                    # Shared types and interfaces
├── index.ts                    # Public exports
├── secret-form-dialog.tsx      # Main wrapper component with type selector
├── env-var-form.tsx            # Environment variables
├── password-form.tsx           # Passwords with strength indicator
├── api-token-form.tsx          # API tokens with metadata
├── ssh-keypair-form.tsx        # SSH key pairs
├── certificate-form.tsx        # SSL/TLS certificates
├── json-form.tsx               # JSON configuration files
├── file-form.tsx               # Binary files (base64 encoded)
└── note-form.tsx               # Secure text notes
```

## Features by Type

### 1. Environment Variables (env-var-form.tsx)
- **Auto-uppercase** key names for consistency
- Name validation (alphanumeric, dots, underscores, slashes, hyphens)
- Password-type value input with show/hide toggle
- Optional description
- Helpful hint about naming conventions

### 2. Password (password-form.tsx)
- **5-level strength indicator** (Too Weak → Strong)
- **Password generator** (20 chars, mixed character types)
- Copy button for generated passwords
- Visual strength meter
- Show/hide toggle
- Strength metadata stored

### 3. API Token (api-token-form.tsx)
- Long textarea for token input
- **Optional expiry date** (date picker, validates future date only)
- **Scopes field** (comma-separated list converted to array)
- Copy button for easy management
- Show/hide toggle for security
- Metadata includes expiry and scopes

### 4. SSH Keypair (ssh-keypair-form.tsx)
- Separate **private key** and **public key** fields
- **PEM format validation** (checks for BEGIN/END markers)
- Optional **passphrase** field for encrypted keys
- Show/hide toggles for security (default hidden for private key)
- Copy buttons for both keys
- Stores public key in metadata for reference

### 5. Certificate (certificate-form.tsx)
- **Certificate field** with PEM validation
- Optional **private key** field
- Optional **certificate chain** field
- Real-time PEM format validation with visual feedback
- Show/hide toggles
- Metadata tracks which components are present

### 6. JSON (json-form.tsx)
- Large textarea for JSON content
- **Real-time syntax validation** with status indicator
- **Format button** for pretty-printing JSON
- Displays key count when valid
- Error messages for malformed JSON
- Supports any JSON structure

### 7. File (file-form.tsx)
- **Drag-and-drop upload area** (or click to select)
- **Base64 encoding** of binary data
- **10MB size limit** with human-readable file size formatting
- File preview with name and size
- Metadata includes filename, size, and encoding type
- Clear button to remove selected file

### 8. Note (note-form.tsx)
- Large rich textarea (12 rows)
- **Character count** displayed
- Supports plain text and markdown formatting
- Optional description
- Ideal for recovery codes, setup instructions, documentation

## Core Types

### SecretType
```typescript
type SecretType = 
  | "env_var"
  | "password"
  | "api_token"
  | "ssh_keypair"
  | "certificate"
  | "json"
  | "file"
  | "note"
```

### SecretFormOutput
```typescript
type SecretFormOutput = {
  name: string
  value: string
  description?: string
  type: SecretType
  metadata?: Record<string, unknown>
}
```

### SecretFormProps
All form components accept these props:
```typescript
type SecretFormProps = {
  onSubmit: (data: SecretFormOutput) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  initialValues?: Partial<SecretFormOutput>
}
```

## Integration Points

### 1. SecretFormDialog (secret-form-dialog.tsx)
Main wrapper component that:
- Provides type selector dropdown
- Dynamically renders the appropriate form based on selected type
- Handles submission and dialog state
- Displays type-specific icons and descriptions

### 2. Secrets Page Integration
The secrets page at `app/dashboard/projects/[projectId]/environments/[environmentId]/page.tsx`:
- Uses a **dropdown button** instead of simple "Add Secret" button
- Shows all 8 secret types with icons and descriptions
- Pre-selects type before opening the dialog
- Passes `defaultType` to SecretFormDialog
- Handles the submission and refetches secrets

### 3. Updated Hook
`hooks/use-secrets.ts`:
- `createSecret()` now accepts `metadata` parameter
- Metadata is passed through to the API

## UX Highlights

### Professional Design
- Type-specific icons (Phosphor Icons)
- Color-coded hints (blue for info, amber for warnings, etc.)
- Responsive layouts
- Consistent styling with shadcn/ui components

### Input Validation
- Real-time validation feedback
- Clear error messages
- Format validators (PEM, JSON, etc.)
- Field-level error states

### Security
- Password/token fields default to hidden
- Show/hide toggles with proper labeling
- Warnings for sensitive data (SSH keys, certificates)
- Copy buttons for convenient access

### Accessibility
- Proper ARIA labels and descriptions
- Keyboard navigation support
- Screen reader friendly error messages
- Disabled state management during submission

## Component Reusability

Each form component can be used independently:
```tsx
import { PasswordForm, EnvVarForm } from "@/components/secrets/forms"

// Use individually
<PasswordForm
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  initialValues={{ name: "admin_pass" }}
/>
```

## Adding New Secret Types

To add a new secret type:
1. Create `new-type-form.tsx` in `components/secrets/forms/`
2. Implement `SecretFormProps` interface
3. Add type to `SecretType` union in `types.ts`
4. Export from `index.ts`
5. Add menu item and case to `SecretFormDialog`

## API Compatibility

All form submissions produce `SecretFormOutput` that matches the backend API expectations:
- `POST /api/v1/projects/{projectId}/environments/{environmentId}/secrets`
- Accepts: `name`, `value`, `description`, `type`, `metadata`
- Returns: Created `Secret` object
