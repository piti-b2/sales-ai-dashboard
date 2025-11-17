/**
 * ============================================
 * Sync LINE User Profiles to Supabase
 * ============================================
 * 
 * Script นี้จะ:
 * 1. ดึงรายการ user_id จาก chat_rooms
 * 2. เรียก LINE Messaging API เพื่อดึง profile
 * 3. อัปเดตข้อมูลใน chat_rooms และ customers
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Configuration
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase Client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * ดึง LINE Profile จาก LINE API
 */
async function getLineProfile(userId) {
  try {
    const response = await axios.get(
      `https://api.line.me/v2/bot/profile/${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
        }
      }
    );
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error(`❌ Error fetching profile for ${userId}:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * อัปเดตข้อมูลลูกค้าใน Supabase
 */
async function updateCustomerProfile(userId, profile) {
  try {
    // อัปเดต chat_rooms
    const { error: roomError } = await supabase
      .from('chat_rooms')
      .update({
        customer_name: profile.displayName,
        customer_avatar: profile.pictureUrl
      })
      .eq('customer_user_id', userId);

    if (roomError) throw roomError;

    // อัปเดต customers table
    const { error: customerError } = await supabase
      .from('customers')
      .upsert({
        line_user_id: userId,
        full_name: profile.displayName,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'line_user_id'
      });

    if (customerError) throw customerError;

    return { success: true };
  } catch (error) {
    console.error(`❌ Error updating profile for ${userId}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Main function
 */
async function syncLineProfiles() {
  console.log('🚀 Starting LINE Profile Sync...\n');

  // 1. ดึงรายการ user_id จาก chat_rooms
  const { data: rooms, error } = await supabase
    .from('chat_rooms')
    .select('customer_user_id, customer_name')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching chat rooms:', error);
    return;
  }

  console.log(`📋 Found ${rooms.length} chat rooms\n`);

  // 2. ดึง profile และอัปเดต
  let successCount = 0;
  let errorCount = 0;

  for (const room of rooms) {
    const userId = room.customer_user_id;
    console.log(`🔄 Processing: ${userId}`);

    // ดึง LINE Profile
    const profileResult = await getLineProfile(userId);

    if (profileResult.success) {
      const profile = profileResult.data;
      console.log(`   ✅ Profile: ${profile.displayName}`);

      // อัปเดตใน Supabase
      const updateResult = await updateCustomerProfile(userId, profile);

      if (updateResult.success) {
        console.log(`   ✅ Updated in Supabase`);
        successCount++;
      } else {
        console.log(`   ❌ Failed to update: ${updateResult.error}`);
        errorCount++;
      }
    } else {
      console.log(`   ❌ Failed to fetch profile: ${profileResult.error}`);
      errorCount++;
    }

    // Delay เพื่อไม่ให้ถูก rate limit
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 3. สรุปผล
  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  console.log(`   📝 Total: ${rooms.length}`);
  console.log('='.repeat(50));
}

// Run
if (require.main === module) {
  syncLineProfiles()
    .then(() => {
      console.log('\n✅ Sync completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Sync failed:', error);
      process.exit(1);
    });
}

module.exports = { syncLineProfiles, getLineProfile, updateCustomerProfile };
