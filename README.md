# API Key Dashboard

This is a Next.js application demonstrating an API Key Dashboard with user authentication and API key management.

## Features

-   User Authentication (Sign up, Login, Email Verification)
-   API Key Generation and Management
-   API Key Regeneration and Deletion
-   Responsive Design
-   Mock Database for demonstration purposes

## Getting Started

Follow these steps to set up and run the project locally.

### 1. Clone the repository

\`\`\`bash
git clone <repository-url>
cd api-key-dashboard
\`\`\`

### 2. Install dependencies

\`\`\`bash
npm install
# or
yarn install
# or
pnpm install
\`\`\`

### 3. Set up Environment Variables

Create a `.env.local` file in the root of your project and add the following:

\`\`\`
AUTH_SECRET="YOUR_AUTH_SECRET" # Generate a strong secret, e.g., using `openssl rand -base64 32`
NODE_ENV=development
\`\`\`

### 4. Run the Development Server

\`\`\`bash
npm run dev
# or
yarn dev
# or
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

-   `app/`: Next.js App Router pages and API routes.
-   `components/`: Reusable React components, including UI components from `shadcn/ui`.
-   `lib/`: Utility functions, authentication logic, and mock database.
-   `public/`: Static assets.
-   `styles/`: Global CSS.

## API Endpoints

-   `/api/auth/...`: NextAuth.js authentication endpoints.
-   `/api/keys`: GET to fetch all API keys for the authenticated user, POST to create a new API key.
-   `/api/keys/[id]`: DELETE to delete a specific API key.
-   `/api/keys/[id]/regenerate`: POST to regenerate a specific API key.

## Customization

-   **Styling**: This project uses Tailwind CSS and `shadcn/ui`. You can customize the theme in `tailwind.config.js` and `app/globals.css`.
-   **Authentication**: The authentication is handled by NextAuth.js. You can extend `lib/auth.ts` to integrate with different providers or databases.
-   **Database**: The current implementation uses a mock in-memory database (`lib/mock-db.ts`). For a production application, you should replace this with a real database (e.g., PostgreSQL, MongoDB, Supabase).

## Deployment

This project can be easily deployed to Vercel.

\`\`\`bash
vercel deploy
