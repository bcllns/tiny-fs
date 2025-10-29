# Email System Documentation

This directory contains the email templates and layout components for Tiny Box.

## Structure

- `email-layout.tsx` - Reusable layout component with header and footer
- `share-link-email.tsx` - Email template for sharing files
- `welcome-email.tsx` - Example welcome email template
- `index.ts` - Export file for easy imports

## Email Layout

The `EmailLayout` component provides a consistent header and footer for all emails:

### Features

- **Header**: Includes Tiny Box logo and tagline
- **Footer**: Company information, links, and support contact
- **Responsive**: Works well across email clients
- **Preview Text**: Optional preview text for email clients
- **Consistent Branding**: Purple theme matching the app

### Usage

```tsx
import EmailLayout from "./email-layout";

export const MyEmail = ({ content }: Props) => (
  <EmailLayout previewText="Optional preview text">
    <h1>Your email content here</h1>
    <p>Email body content...</p>
  </EmailLayout>
);
```

## Creating New Emails

1. Create a new `.tsx` file in the `emails` directory
2. Import and use the `EmailLayout` component
3. Add your email-specific content inside the layout
4. Export your component and add it to `index.ts`

### Example Template

```tsx
import * as React from "react";
import EmailLayout from "./email-layout";

type MyEmailProps = {
  userName: string;
  // other props...
};

export const MyEmail = ({ userName }: MyEmailProps) => (
  <EmailLayout previewText={`Hello ${userName}!`}>
    <h1 style={{ fontSize: "24px", margin: "0 0 20px" }}>Email Title</h1>
    <p style={{ color: "#6b21a8" }}>Email content here...</p>
  </EmailLayout>
);

export default MyEmail;
```

## Styling Guidelines

- Use inline styles for email compatibility
- Follow the purple color scheme:
  - Primary: `#4c1d95`
  - Secondary: `#6b21a8`
  - Accent: `#7c3aed`
  - Light: `#a855f7`
- Use the Inter font family
- Keep layout simple and responsive

## Email Client Testing

The layout is designed to work across major email clients including:

- Gmail
- Outlook
- Apple Mail
- Yahoo Mail
- Mobile clients

## Environment Variables

Make sure these environment variables are set:

- `NEXT_PUBLIC_APP_URL` - Base URL for the application
- `RESEND_API_KEY` - Resend API key for sending emails
- `RESEND_FROM_EMAIL` - From email address
