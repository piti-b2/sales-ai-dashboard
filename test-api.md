# 🧪 ทดสอบ API Endpoints

## 1. Messages Analytics
```bash
# ทดสอบ API Messages
curl http://localhost:3000/api/analytics/messages?days=30&channel=all
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "totalMessages": 1234,
    "userMessages": 617,
    "assistantMessages": 617,
    "uniqueUsers": 45,
    "uniqueConversations": 89,
    "messagesByDay": {
      "2025-10-20": 120,
      "2025-10-21": 135
    },
    "ragRate": "85.5",
    "productMentions": {
      "prod_phonics_chart_th": 25
    },
    "period": "30 days"
  }
}
```

---

## 2. Sales Analytics
```bash
# ทดสอบ API Sales
curl http://localhost:3000/api/analytics/sales?days=30
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "totalPayments": 15,
    "verifiedPayments": 12,
    "totalRevenue": 165600,
    "avgOrderValue": 13800,
    "duplicates": 2,
    "paidCustomers": 10,
    "revenueByDay": {
      "2025-10-16": 41400,
      "2025-10-17": 27600
    },
    "bankDistribution": {
      "ธนาคาร ซีไอเอ็มบี ไทย": 8,
      "ธนาคาร กสิกรไทย": 4
    },
    "confidenceDistribution": {
      "high": 10,
      "medium": 2
    },
    "period": "30 days"
  }
}
```

---

## 3. Customer Analytics
```bash
# ทดสอบ API Customers
curl http://localhost:3000/api/analytics/customers?days=30
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "totalCustomers": 45,
    "paidCustomers": 10,
    "unpaidCustomers": 35,
    "conversionRate": "22.2",
    "activeConversations": 89,
    "newCustomersByDay": {
      "2025-10-20": 5,
      "2025-10-21": 8
    },
    "engagementLevels": {
      "high": 12,
      "medium": 18,
      "low": 15
    },
    "period": "30 days"
  }
}
```

---

## 4. AI Insights
```bash
# ทดสอบ API AI Insights
curl http://localhost:3000/api/analytics/ai-insights?days=30
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "sentiments": {
      "positive": 450,
      "neutral": 120,
      "negative": 47
    },
    "sentimentPercentage": {
      "positive": "72.9",
      "neutral": "19.4",
      "negative": "7.6"
    },
    "intents": {
      "price_inquiry": 85,
      "purchase_intent": 120,
      "information_seeking": 200,
      "concern": 47,
      "general": 165
    },
    "topConcerns": [
      "ไม่กล้าซื้อกลัวเป็นมิจฉาชีพ",
      "กลัวไม่คุ้มค่า"
    ],
    "ragPerformance": {
      "success": 528,
      "failed": 89,
      "rate": "85.6"
    },
    "productInterest": [
      {
        "product": "prod_phonics_chart_th",
        "count": 25
      }
    ],
    "totalAnalyzed": 617,
    "period": "30 days"
  }
}
```

---

## 🧪 ทดสอบใน Browser

### 1. เปิด Browser Console (F12)
```javascript
// Test Messages API
fetch('/api/analytics/messages?days=30')
  .then(r => r.json())
  .then(d => console.log('Messages:', d))

// Test Sales API
fetch('/api/analytics/sales?days=30')
  .then(r => r.json())
  .then(d => console.log('Sales:', d))

// Test Customers API
fetch('/api/analytics/customers?days=30')
  .then(r => r.json())
  .then(d => console.log('Customers:', d))

// Test AI Insights API
fetch('/api/analytics/ai-insights?days=30')
  .then(r => r.json())
  .then(d => console.log('AI Insights:', d))
```

---

## 📊 ทดสอบหน้า Dashboard

1. **Overview** - http://localhost:3000/
   - แสดง Mock Data + Channel Filter

2. **Real-time Data** - http://localhost:3000/dashboard
   - ดึงข้อมูลจริงจาก API
   - แสดง Metrics, Charts

3. **AI Insights** - http://localhost:3000/ai-insights
   - Sentiment Analysis
   - Intent Classification
   - Top Concerns
   - Product Interest

4. **Predictions** - http://localhost:3000/predictive
   - Revenue Forecast
   - Lead Scoring
   - AI Recommendations
   - Peak Hours

---

## ✅ Checklist

- [ ] API Messages ทำงานได้
- [ ] API Sales ทำงานได้
- [ ] API Customers ทำงานได้
- [ ] API AI Insights ทำงานได้
- [ ] Dashboard แสดงข้อมูลจริง
- [ ] AI Insights แสดงผล
- [ ] Predictive Analytics แสดงผล
- [ ] Sidebar มีเมนูครบ
- [ ] Mobile responsive

---

## 🐛 Troubleshooting

### ถ้า API Error 500
1. เช็ค Supabase connection
2. เช็ค `.env.local` มี credentials ครบ
3. เช็ค database มีตาราง `messages`, `payment_slips`

### ถ้าไม่มีข้อมูล
1. เช็คว่ามีข้อมูลในฐานข้อมูลหรือไม่
2. ลองเปลี่ยน `days` parameter (7, 30, 90)
3. เช็ค Console log มี error หรือไม่
