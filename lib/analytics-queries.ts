// SQL Queries สำหรับวิเคราะห์ข้อมูล

export const analyticsQueries = {
  // 1. Messages Overview
  messagesOverview: `
    SELECT 
      COUNT(*) as total_messages,
      COUNT(DISTINCT user_id) as unique_users,
      COUNT(DISTINCT conversation_id) as unique_conversations,
      COUNT(CASE WHEN role = 'user' THEN 1 END) as user_messages,
      COUNT(CASE WHEN role = 'assistant' THEN 1 END) as assistant_messages,
      COUNT(CASE WHEN metadata->>'ragFound' = 'true' THEN 1 END) as rag_found,
      COUNT(CASE WHEN metadata->>'isFallback' = 'true' THEN 1 END) as fallback_count
    FROM messages
    WHERE created_at >= NOW() - INTERVAL '$1 days'
  `,

  // 2. Messages by Day
  messagesByDay: `
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as total,
      COUNT(CASE WHEN role = 'user' THEN 1 END) as incoming,
      COUNT(CASE WHEN role = 'assistant' THEN 1 END) as outgoing
    FROM messages
    WHERE created_at >= NOW() - INTERVAL '$1 days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `,

  // 3. Response Time Analysis
  responseTime: `
    WITH message_pairs AS (
      SELECT 
        m1.conversation_id,
        m1.created_at as user_time,
        m2.created_at as assistant_time,
        EXTRACT(EPOCH FROM (m2.created_at - m1.created_at)) as response_seconds
      FROM messages m1
      JOIN messages m2 ON m1.conversation_id = m2.conversation_id
      WHERE m1.role = 'user' 
        AND m2.role = 'assistant'
        AND m2.created_at > m1.created_at
        AND m1.created_at >= NOW() - INTERVAL '$1 days'
    )
    SELECT 
      AVG(response_seconds) as avg_response_time,
      MIN(response_seconds) as min_response_time,
      MAX(response_seconds) as max_response_time,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY response_seconds) as median_response_time
    FROM message_pairs
    WHERE response_seconds < 300
  `,

  // 4. Product Interest
  productInterest: `
    SELECT 
      metadata->>'product_id' as product_id,
      COUNT(*) as mentions,
      COUNT(DISTINCT user_id) as unique_users,
      AVG((metadata->>'topSim')::float) as avg_similarity
    FROM messages
    WHERE metadata->>'product_id' IS NOT NULL
      AND created_at >= NOW() - INTERVAL '$1 days'
    GROUP BY metadata->>'product_id'
    ORDER BY mentions DESC
    LIMIT 10
  `,

  // 5. Sales Overview
  salesOverview: `
    SELECT 
      COUNT(*) as total_slips,
      COUNT(CASE WHEN verified = true THEN 1 END) as verified_slips,
      COUNT(CASE WHEN is_duplicate = true THEN 1 END) as duplicate_slips,
      SUM(CASE WHEN verified = true AND is_duplicate = false THEN amount ELSE 0 END) as total_revenue,
      AVG(CASE WHEN verified = true AND is_duplicate = false THEN amount END) as avg_order_value,
      COUNT(DISTINCT user_id) as unique_customers
    FROM payment_slips
    WHERE created_at >= NOW() - INTERVAL '$1 days'
  `,

  // 6. Revenue by Day
  revenueByDay: `
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as orders,
      SUM(amount) as revenue
    FROM payment_slips
    WHERE verified = true 
      AND is_duplicate = false
      AND created_at >= NOW() - INTERVAL '$1 days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `,

  // 7. Bank Distribution
  bankDistribution: `
    SELECT 
      bank,
      COUNT(*) as count,
      SUM(amount) as total_amount
    FROM payment_slips
    WHERE verified = true 
      AND is_duplicate = false
      AND created_at >= NOW() - INTERVAL '$1 days'
    GROUP BY bank
    ORDER BY count DESC
  `,

  // 8. Customer Journey
  customerJourney: `
    WITH customer_timeline AS (
      SELECT 
        m.user_id,
        MIN(m.created_at) as first_message,
        MAX(m.created_at) as last_message,
        COUNT(DISTINCT m.conversation_id) as conversations,
        COUNT(*) as total_messages,
        p.created_at as payment_date,
        p.amount as payment_amount
      FROM messages m
      LEFT JOIN payment_slips p ON m.user_id = p.user_id AND p.verified = true
      WHERE m.created_at >= NOW() - INTERVAL '$1 days'
      GROUP BY m.user_id, p.created_at, p.amount
    )
    SELECT 
      user_id,
      first_message,
      last_message,
      conversations,
      total_messages,
      payment_date,
      payment_amount,
      EXTRACT(EPOCH FROM (payment_date - first_message))/86400 as days_to_purchase
    FROM customer_timeline
    WHERE payment_date IS NOT NULL
    ORDER BY payment_date DESC
  `,

  // 9. Hot Leads (High Intent, No Purchase)
  hotLeads: `
    SELECT 
      m.user_id,
      COUNT(DISTINCT m.conversation_id) as conversations,
      COUNT(*) as messages,
      MAX(m.created_at) as last_contact,
      COUNT(CASE WHEN m.metadata->>'product_id' IS NOT NULL THEN 1 END) as product_inquiries,
      CASE 
        WHEN COUNT(*) > 10 THEN 'hot'
        WHEN COUNT(*) > 5 THEN 'warm'
        ELSE 'cold'
      END as lead_temperature
    FROM messages m
    LEFT JOIN payment_slips p ON m.user_id = p.user_id AND p.verified = true
    WHERE m.created_at >= NOW() - INTERVAL '$1 days'
      AND p.id IS NULL
    GROUP BY m.user_id
    HAVING COUNT(*) >= 3
    ORDER BY messages DESC, last_contact DESC
    LIMIT 50
  `,

  // 10. Sentiment Analysis (Basic)
  sentimentAnalysis: `
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as total,
      COUNT(CASE WHEN content ILIKE '%ดี%' OR content ILIKE '%ชอบ%' OR content ILIKE '%สนใจ%' THEN 1 END) as positive,
      COUNT(CASE WHEN content ILIKE '%กลัว%' OR content ILIKE '%กังวล%' OR content ILIKE '%แพง%' THEN 1 END) as negative
    FROM messages
    WHERE role = 'user'
      AND created_at >= NOW() - INTERVAL '$1 days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `,

  // 11. Conversion Funnel
  conversionFunnel: `
    WITH funnel AS (
      SELECT 
        COUNT(DISTINCT m.user_id) as total_users,
        COUNT(DISTINCT CASE WHEN m.metadata->>'product_id' IS NOT NULL THEN m.user_id END) as product_interest,
        COUNT(DISTINCT p.user_id) as paid_users
      FROM messages m
      LEFT JOIN payment_slips p ON m.user_id = p.user_id AND p.verified = true
      WHERE m.created_at >= NOW() - INTERVAL '$1 days'
    )
    SELECT 
      total_users,
      product_interest,
      paid_users,
      ROUND((product_interest::float / total_users * 100), 2) as interest_rate,
      ROUND((paid_users::float / total_users * 100), 2) as conversion_rate
    FROM funnel
  `,

  // 12. Peak Hours
  peakHours: `
    SELECT 
      EXTRACT(HOUR FROM created_at) as hour,
      COUNT(*) as message_count,
      COUNT(DISTINCT user_id) as active_users
    FROM messages
    WHERE created_at >= NOW() - INTERVAL '$1 days'
    GROUP BY EXTRACT(HOUR FROM created_at)
    ORDER BY hour
  `
}
