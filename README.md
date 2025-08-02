# Modern React Dashboard

This is a modern React dashboard application built with Next.js, Tailwind CSS, and shadcn/ui. It includes authentication powered by NextAuth.js and a mock API key management system.

## Getting Started

1.  **Clone the repository:**
    \`\`\`bash
    git clone <repository-url>
    cd modern-react-dashboard
    \`\`\`
2.  **Install dependencies:**
    \`\`\`bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    \`\`\`
3.  **Set up environment variables:**
    Create a `.env.local` file in the root of your project and add the following:
    \`\`\`
    AUTH_SECRET="YOUR_SECRET_HERE"
    NODE_ENV=development
    \`\`\`
    Replace `YOUR_SECRET_HERE` with a strong, random string. You can generate one using `openssl rand -base64 32`.

4.  **Run the development server:**
    \`\`\`bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    \`\`\`
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

*   **Authentication:** User login, signup, and email verification (mocked).
*   **API Key Management:** Create, view, regenerate, enable/disable, and delete API keys (mocked).
*   **Responsive Design:** Built with Tailwind CSS for a mobile-first approach.
*   **shadcn/ui:** Beautiful and accessible UI components.
*   **Next.js App Router:** Modern routing and data fetching.

## Project Structure

\`\`\`
.
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts
│   │   │   ├── resend-verification/route.ts
│   │   │   ├── signup/route.ts
│   │   │   └── verify-email/route.ts
│   │   └── keys/
│   │       ├── [id]/
│   │       │   ├── regenerate/route.ts
│   │       │   └── route.ts
│   │       └── route.ts
│   ├── auth/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── verify-email/page.tsx
│   ├── dashboard/page.tsx
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── auth/
│   │   ├── login-form.tsx
│   │   ├── signup-form.tsx
│   │   └── verify-email-form.tsx
│   ├── dashboard/
│   │   ├── api-key-manager.tsx
│   │   ├── api-key-table.tsx
│   │   ├── create-api-key-dialog.tsx
│   │   └── dashboard-header.tsx
│   ├── providers/
│   │   ├── auth-provider.tsx
│   │   └── query-provider.tsx
│   └── ui/
│       └── ... (shadcn/ui components)
├── hooks/
│   ├── use-mobile.tsx
│   └── use-toast.ts
├── lib/
│   ├── auth.ts
│   ├── mock-db.ts
│   ├── types.ts
│   └── utils.ts
├── public/
│   └── ... (images, svgs)
├── styles/
│   └── globals.css
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── tailwind.config.js
└── tsconfig.json
