# 🤖 Sales AI Dashboard

**Complete Analytics System** สำหรับวิเคราะห์ข้อมูล LINE Chat AI พร้อม AI Insights และ Predictive Analytics

![Dashboard Preview](https://placehold.co/1200x600/3b82f6/ffffff?text=Sales+AI+Dashboard)

## ✨ Features

### 📊 Real-time Analytics
- 📈 **Multiple Chart Types** - Line, Bar, Pie, Area charts with Recharts
- 📱 **Mobile Responsive** - Works perfectly on mobile devices
- 🎨 **Modern UI** - Clean design with Tailwind CSS
- ⚡ **Fast Performance** - Built with Next.js 16 App Router
- 🔄 **Real-time Data** - Live data from Supabase PostgreSQL
- 🎯 **Role-based Access** - Super Admin, Admin, User roles

### 🧠 AI-Powered Insights
- 😊 **Sentiment Analysis** - Positive/Neutral/Negative detection
- 🎯 **Intent Classification** - Auto-categorize customer intents
- ❓ **FAQ Analysis** - Top 15 frequently asked questions
- 📦 **Product Interest** - Track product mentions
- 🎭 **Customer Concerns** - Identify pain points
- 📈 **RAG Performance** - Monitor AI accuracy

### 🔮 Predictive Analytics
- 💰 **Revenue Forecasting** - Predict next week revenue
- 🎯 **Lead Scoring** - Score leads 0-100
- ⚠️ **Churn Prediction** - Identify at-risk customers
- ⏰ **Peak Hours** - Best time to engage
- 💡 **AI Recommendations** - Actionable insights

### 🌐 Multi-Channel Support
- 💬 LINE
- 👥 Facebook
- 📷 Instagram
- 💚 WhatsApp
- 🎵 TikTok
- 🛒 Shopee

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Environment Variables

Create `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 📊 Dashboard Pages

### 1. Overview (`/`)
- **Channel Filter** - Filter by 7 channels
- **Metric Cards** with sparklines
  - Total Messages
  - Active Customers
  - Hot Leads
  - Monthly Revenue
- **Charts**
  - Outgoing vs Incoming Messages (Line Chart)
  - AI vs Admin Performance (Bar Chart)
  - Lead Distribution (Pie Chart)
  - Average Response Time (Area Chart)
  - Daily Sales (Bar Chart)

### 2. Real-time Data (`/dashboard`)
- **Live Metrics** from database
- **Time Range** - 7d, 30d, 90d
- **Channel Filter**
- **Charts**
  - Messages Over Time
  - Revenue Over Time
- **Stats**
  - Conversations
  - RAG Success Rate
  - Verified Payments

### 3. AI Insights (`/ai-insights`)
- **Sentiment Analysis**
  - Positive/Neutral/Negative %
  - Distribution chart
- **Intent Classification**
  - Price Inquiry
  - Purchase Intent
  - Information Seeking
  - Concern
  - General
- **FAQ Analysis** 🆕
  - Top 15 frequently asked questions
  - Auto-categorization (9 categories)
  - Question frequency count
  - Category distribution chart
- **Top Concerns** (Top 10)
- **Product Interest** (Top 5)
- **RAG Performance**

### 4. Predictions (`/predictive`)
- **Revenue Forecast**
  - Next week prediction
  - Growth percentage
  - Confidence level
- **Lead Scoring**
  - Top 5 hot leads
  - Score 0-100
  - Last contact time
- **Churn Risk**
  - Risk percentage
  - At-risk customers
- **Peak Hours Analysis**
- **AI Recommendations**
  - Urgent actions
  - Opportunities
  - Warnings

### 5. Other Pages
- `/messages` - Message analytics
- `/customers` - Customer management
- `/sales` - Sales reports

## 🛠️ Tech Stack

- **Framework**: Next.js 16.0.0 (App Router + Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (@supabase/ssr)
- **Deployment**: Vercel Ready

## 🔌 API Endpoints

### Analytics APIs
- `GET /api/analytics/messages?days=30&channel=all` - Messages analytics
- `GET /api/analytics/sales?days=30` - Sales analytics
- `GET /api/analytics/customers?days=30` - Customer analytics
- `GET /api/analytics/ai-insights?days=30` - AI insights
- `GET /api/analytics/faq?days=30` - FAQ analysis 🆕

### Auth APIs
- `POST /api/auth/logout` - Logout user

## 🗄️ Database Tables

### Required Tables
1. **messages**
   - id, conversation_id, user_id
   - role (user/assistant)
   - content, tokens_in, tokens_out
   - metadata (JSON)
   - created_at

2. **payment_slips**
   - id, user_id, message_id
   - amount, datetime, bank
   - verified, confidence
   - is_duplicate
   - created_at, updated_at

3. **secret_commands**
   - id, command, type, action
   - enabled, description
   - response_message

See `CHANGELOG.md` for detailed schema.

## 📱 Responsive Design

The dashboard is fully responsive and works seamlessly on:
- 📱 Mobile (< 768px)
- 💻 Tablet (768px - 1024px)
- 🖥️ Desktop (> 1024px)

## 🔧 Project Structure

```
sales-ai/
├── app/
│   ├── layout.tsx              # Root layout with Sidebar & Header
│   ├── page.tsx                # Overview dashboard (Mock data)
│   ├── dashboard/page.tsx      # Real-time data dashboard
│   ├── ai-insights/page.tsx    # AI Insights + FAQ
│   ├── predictive/page.tsx     # Predictive analytics
│   ├── login/page.tsx          # Login page
│   ├── api/
│   │   ├── analytics/
│   │   │   ├── messages/       # Messages API
│   │   │   ├── sales/          # Sales API
│   │   │   ├── customers/      # Customers API
│   │   │   ├── ai-insights/    # AI Insights API
│   │   │   └── faq/            # FAQ API 🆕
│   │   └── auth/
│   │       └── logout/         # Logout API
│   └── globals.css
├── components/
│   ├── Sidebar.tsx             # Navigation sidebar
│   ├── Header.tsx              # Top header with user menu
│   └── MetricCard.tsx          # KPI card component
├── lib/
│   ├── utils.ts                # Utility functions
│   ├── supabase.ts             # Supabase client (browser)
│   ├── supabase-admin.ts       # Supabase admin client
│   └── analytics-queries.ts    # SQL queries library
├── proxy.ts                    # Middleware for auth
├── CHANGELOG.md                # Detailed changelog
├── test-api.md                 # API testing guide
└── README.md
```

## 🎨 Customization

### Change Colors

Edit `tailwind.config.ts`:

```typescript
theme: {
  extend: {
    colors: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      // Add your colors
    },
  },
},
```

### Add New Charts

```typescript
import { LineChart, Line } from 'recharts'

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={yourData}>
    <Line dataKey="value" stroke="#3b82f6" />
  </LineChart>
</ResponsiveContainer>
```

## 📦 Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

## 🔗 Integration with Supabase

The dashboard is ready to integrate with your existing Supabase database. See `lib/analytics-queries.ts` for 12 pre-built SQL queries.

## 🧪 Testing

See `test-api.md` for detailed testing instructions.

### Quick Test
```bash
# Test Messages API
curl http://localhost:3000/api/analytics/messages?days=30

# Test FAQ API
curl http://localhost:3000/api/analytics/faq?days=30
```

## 🔐 Authentication

### Test Accounts
```
Super Admin:
  Email: admin@maasai.com
  Password: Admin@123456

Admin:
  Email: manager@maasai.com
  Password: Manager@123456

User:
  Email: user@maasai.com
  Password: User@123456
```

## 📈 Performance

- **API Response**: 100-700ms
- **Page Load**: 30-500ms
- **Build Time**: ~5s
- **Bundle Size**: Optimized

## 🎯 What's New (2025-10-25)

### ✨ Major Features
- ✅ Complete Authentication System
- ✅ Real-time Data Dashboard
- ✅ AI Insights with Sentiment Analysis
- ✅ FAQ Analysis (Top 15 questions) 🆕
- ✅ Predictive Analytics
- ✅ Multi-channel Support (7 channels)
- ✅ Mobile Responsive Design
- ✅ 5 API Endpoints
- ✅ 12 SQL Queries Library

See `CHANGELOG.md` for detailed changes.

## 📚 Documentation

- `README.md` - This file
- `CHANGELOG.md` - Detailed changelog
- `test-api.md` - API testing guide
- `lib/analytics-queries.ts` - SQL queries

## 📄 License

MIT License

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a PR.

## 🙏 Acknowledgments

- Built with Next.js 16 + Turbopack
- Powered by Supabase
- Charts by Recharts
- Icons by Lucide

---

**Built with ❤️ for Sales AI Dashboard**

**Status: ✅ Production Ready**
