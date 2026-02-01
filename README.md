# Mail Scheduler

A full-stack application for scheduling and sending daily Gmail newsletters to subscribers.

## Features

- **Gmail OAuth2 Integration** - Secure email sending via Gmail API
- **Subscriber Management** - Add, remove, and manage email subscribers
- **Email Templates** - Create HTML templates with placeholders
- **Scheduled Sending** - Configure daily email schedules with cron
- **Manual Sending** - Send emails immediately when needed
- **Email Logs** - Track sent/failed emails

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, Prisma, PostgreSQL
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Email**: Nodemailer with Gmail OAuth2
- **Scheduling**: node-cron

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Google Cloud Project with Gmail API enabled

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

Create a PostgreSQL database and update the connection string in `.env`.

```bash
cd backend
cp .env.example .env
# Edit .env with your database URL
npx prisma db push
npx prisma generate
```

### 3. Gmail OAuth2 Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Gmail API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Select **Web application**
6. Add authorized redirect URI: `http://localhost:3001/api/gmail/callback`
7. Copy **Client ID** and **Client Secret** to your `.env` file

### 4. Get Gmail Refresh Token

1. Start the backend server: `npm run dev:backend`
2. Open http://localhost:3001/api/gmail/auth-url in your browser
3. Copy the `authUrl` and open it
4. Authorize with your Google account
5. Copy the `refresh_token` from the response to your `.env` file

### 5. Environment Variables

Create `backend/.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mailscheduler?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this"

# Server
PORT=3001

# Gmail OAuth2
GMAIL_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GMAIL_CLIENT_SECRET="your-client-secret"
GMAIL_REDIRECT_URI="http://localhost:3001/api/gmail/callback"
GMAIL_REFRESH_TOKEN="your-refresh-token"

# Email sender
EMAIL_FROM="your-email@gmail.com"
```

### 6. Run the Application

```bash
# Run both frontend and backend
npm run dev

# Or run separately
npm run dev:backend  # Backend on http://localhost:3001
npm run dev:frontend # Frontend on http://localhost:5173
```

### 7. Create Admin Account

1. Open http://localhost:5173
2. Click "Sign up" to create an account
3. Log in and start configuring your email scheduler

## Usage

### Adding Subscribers

1. Go to **Subscribers** page
2. Click **Add Subscriber**
3. Enter name and email

### Creating Email Templates

1. Go to **Templates** page
2. Click **New Template**
3. Enter template name, subject, and HTML body
4. Use placeholders: `{{name}}`, `{{email}}`, `{{date}}`

Example template:
```html
<h1>Hello {{name}}!</h1>
<p>Here's your daily update for {{date}}.</p>
<p>Thank you for subscribing!</p>
```

### Configuring Schedule

1. Go to **Schedule** page
2. Set cron expression or use quick select
3. Choose timezone
4. Enable/disable scheduled emails

### Manual Send

1. Go to **Schedule** page
2. Select a template
3. Click **Send Now**

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Subscribers
- `GET /api/subscribers` - List all subscribers
- `POST /api/subscribers` - Create subscriber
- `PUT /api/subscribers/:id` - Update subscriber
- `DELETE /api/subscribers/:id` - Delete subscriber
- `PATCH /api/subscribers/:id/toggle` - Toggle active status

### Templates
- `GET /api/templates` - List all templates
- `POST /api/templates` - Create template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template
- `POST /api/templates/:id/preview` - Preview template

### Schedule
- `GET /api/schedule` - Get schedule config
- `PUT /api/schedule` - Update schedule config
- `POST /api/schedule/send` - Send emails manually
- `GET /api/schedule/logs` - Get email logs
- `GET /api/schedule/stats` - Get email stats

### Gmail
- `GET /api/gmail/auth-url` - Get OAuth2 authorization URL
- `GET /api/gmail/callback` - OAuth2 callback
- `GET /api/gmail/test` - Test Gmail connection

## Project Structure

```
MailScheduler/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── index.ts
│   │   ├── lib/
│   │   │   ├── gmail.ts
│   │   │   └── prisma.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   └── error.middleware.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── gmail.routes.ts
│   │   │   ├── schedule.routes.ts
│   │   │   ├── subscriber.routes.ts
│   │   │   └── template.routes.ts
│   │   └── services/
│   │       ├── email.service.ts
│   │       └── scheduler.service.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── components/
│   │   │   └── Layout.tsx
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── lib/
│   │   │   └── api.ts
│   │   └── pages/
│   │       ├── Dashboard.tsx
│   │       ├── Login.tsx
│   │       ├── Register.tsx
│   │       ├── Schedule.tsx
│   │       ├── Settings.tsx
│   │       ├── Subscribers.tsx
│   │       └── Templates.tsx
│   └── package.json
└── package.json
```

## License

MIT
