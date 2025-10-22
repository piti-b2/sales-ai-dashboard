# 📊 Sales AI Dashboard

Modern analytics dashboard for LINE Chat AI system with beautiful charts and responsive design.

![Dashboard Preview](https://placehold.co/1200x600/3b82f6/ffffff?text=Sales+AI+Dashboard)

## ✨ Features

- 📈 **Multiple Chart Types** - Line, Bar, Pie, Area charts with Recharts
- 📱 **Mobile Responsive** - Works perfectly on mobile devices
- 🎨 **Modern UI** - Clean design with Tailwind CSS
- ⚡ **Fast Performance** - Built with Next.js 14 App Router
- 🔄 **Real-time Updates** - Ready for Supabase integration
- 🎯 **Role-based Access** - Admin, Manager, Support roles

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

## 📊 Dashboard Features

### Overview Page (/)
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

### Other Pages
- `/messages` - Message analytics
- `/customers` - Customer management
- `/analytics` - Detailed analytics
- `/sales` - Sales reports
- `/ai` - AI performance metrics

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Deployment**: Vercel

## 📱 Responsive Design

The dashboard is fully responsive and works seamlessly on:
- 📱 Mobile (< 768px)
- 💻 Tablet (768px - 1024px)
- 🖥️ Desktop (> 1024px)

## 🔧 Project Structure

```
sales-ai/
├── app/
│   ├── layout.tsx       # Root layout with Sidebar & Header
│   ├── page.tsx         # Dashboard home page
│   └── globals.css      # Global styles
├── components/
│   ├── Sidebar.tsx      # Navigation sidebar
│   ├── Header.tsx       # Top header with search
│   └── MetricCard.tsx   # KPI card component
├── lib/
│   └── utils.ts         # Utility functions
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

The dashboard is ready to integrate with your existing Supabase database. See `DASHBOARD_SQL_QUERIES.md` for query examples.

## 📄 License

MIT License

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a PR.

---

**Built with ❤️ for Sales AI Dashboard**
