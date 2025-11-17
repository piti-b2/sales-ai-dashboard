#!/usr/bin/env node

/**
 * ============================================
 * Export Chat History from Supabase
 * ============================================
 * 
 * ดึงประวัติแชทจาก messages table
 * (ไม่สามารถดึงจาก LINE API ได้)
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase Client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * ดึงประวัติแชทของ user
 */
async function getChatHistory(userId) {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      id,
      user_id,
      role,
      content,
      message_type,
      created_at,
      metadata
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * ดึงประวัติแชททั้งหมด
 */
async function getAllChatHistory() {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      id,
      user_id,
      role,
      content,
      message_type,
      created_at,
      metadata
    `)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Export เป็น JSON
 */
async function exportToJSON(userId = null) {
  console.log('🚀 Exporting chat history...\n');

  const data = userId 
    ? await getChatHistory(userId)
    : await getAllChatHistory();

  const filename = userId 
    ? `chat-history-${userId}-${Date.now()}.json`
    : `chat-history-all-${Date.now()}.json`;

  fs.writeFileSync(filename, JSON.stringify(data, null, 2));

  console.log(`✅ Exported ${data.length} messages to ${filename}`);
  return filename;
}

/**
 * Export เป็น CSV
 */
async function exportToCSV(userId = null) {
  console.log('🚀 Exporting chat history to CSV...\n');

  const data = userId 
    ? await getChatHistory(userId)
    : await getAllChatHistory();

  // สร้าง CSV header
  const headers = ['created_at', 'user_id', 'role', 'message_type', 'content', 'display_name'];
  
  // สร้าง CSV rows
  const rows = data.map(msg => [
    msg.created_at,
    msg.user_id,
    msg.role,
    msg.message_type,
    `"${(msg.content || '').replace(/"/g, '""')}"`, // Escape quotes
    msg.metadata?.displayName || ''
  ]);

  // รวมเป็น CSV
  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const filename = userId 
    ? `chat-history-${userId}-${Date.now()}.csv`
    : `chat-history-all-${Date.now()}.csv`;

  fs.writeFileSync(filename, csv, 'utf8');

  console.log(`✅ Exported ${data.length} messages to ${filename}`);
  return filename;
}

/**
 * แสดงสถิติ
 */
async function showStats() {
  console.log('📊 Chat History Statistics\n');

  // นับจำนวนข้อความ
  const { count: totalMessages } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true });

  // นับจำนวน users
  const { data: users } = await supabase
    .from('messages')
    .select('user_id')
    .not('user_id', 'is', null);

  const uniqueUsers = [...new Set(users.map(u => u.user_id))];

  // นับตาม role
  const { data: roleStats } = await supabase
    .from('messages')
    .select('role');

  const roleCounts = roleStats.reduce((acc, msg) => {
    acc[msg.role] = (acc[msg.role] || 0) + 1;
    return acc;
  }, {});

  console.log(`Total Messages: ${totalMessages}`);
  console.log(`Unique Users: ${uniqueUsers.length}`);
  console.log('\nMessages by Role:');
  Object.entries(roleCounts).forEach(([role, count]) => {
    console.log(`  ${role}: ${count}`);
  });
}

// CLI
const args = process.argv.slice(2);
const command = args[0];
const userId = args[1];

async function main() {
  try {
    switch (command) {
      case 'json':
        await exportToJSON(userId);
        break;
      
      case 'csv':
        await exportToCSV(userId);
        break;
      
      case 'stats':
        await showStats();
        break;
      
      default:
        console.log(`
📚 Usage:

  Export to JSON:
    node export-chat-history.js json [userId]
    
  Export to CSV:
    node export-chat-history.js csv [userId]
    
  Show statistics:
    node export-chat-history.js stats

Examples:
  node export-chat-history.js json Ua717abfa700124404c783316b2fb3e09
  node export-chat-history.js csv
  node export-chat-history.js stats
        `);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { getChatHistory, getAllChatHistory, exportToJSON, exportToCSV };
