// ========================================
// API Functions: Operating Hours
// ========================================

import { supabase } from '@/lib/supabase';

export interface OperatingHoursSchedule {
  monday: number[];
  tuesday: number[];
  wednesday: number[];
  thursday: number[];
  friday: number[];
  saturday: number[];
  sunday: number[];
}

export interface OperatingHours {
  id: string;
  is_enabled: boolean;
  schedule: OperatingHoursSchedule;
  offline_message: string;
  timezone: string;
  note: string | null;
  last_updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SystemStatus {
  is_online: boolean;
  should_respond: boolean;
  message: string;
  reason: string;
  current_hour: number;
  current_day: string;
}

// ========================================
// ดึงข้อมูลตารางเวลา
// ========================================
export async function getOperatingHours(): Promise<OperatingHours | null> {
  const { data, error } = await supabase
    .from('system_operating_hours')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching operating hours:', error);
    return null;
  }

  return data;
}

// ========================================
// อัพเดตตารางเวลา
// ========================================
export async function updateOperatingHours(
  id: string,
  updates: Partial<OperatingHours>
): Promise<boolean> {
  const { error } = await supabase
    .from('system_operating_hours')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating operating hours:', error);
    return false;
  }

  return true;
}

// ========================================
// อัพเดต Schedule (เฉพาะตาราง)
// ========================================
export async function updateSchedule(
  id: string,
  schedule: OperatingHoursSchedule,
  updatedBy?: string
): Promise<boolean> {
  const { error } = await supabase
    .from('system_operating_hours')
    .update({
      schedule,
      last_updated_by: updatedBy || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating schedule:', error);
    return false;
  }

  return true;
}

// ========================================
// เปิด/ปิดระบบทั้งหมด
// ========================================
export async function toggleSystem(
  id: string,
  isEnabled: boolean,
  updatedBy?: string
): Promise<boolean> {
  const { error } = await supabase
    .from('system_operating_hours')
    .update({
      is_enabled: isEnabled,
      last_updated_by: updatedBy || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('Error toggling system:', error);
    return false;
  }

  return true;
}

// ========================================
// ตรวจสอบสถานะระบบปัจจุบัน
// ========================================
export async function checkSystemStatus(): Promise<SystemStatus | null> {
  const { data, error } = await supabase.rpc('check_system_status');

  if (error) {
    console.error('Error checking system status:', error);
    return null;
  }

  return data?.[0] || null;
}

// ========================================
// อัพเดตข้อความ Offline
// ========================================
export async function updateOfflineMessage(
  id: string,
  message: string,
  updatedBy?: string
): Promise<boolean> {
  const { error } = await supabase
    .from('system_operating_hours')
    .update({
      offline_message: message,
      last_updated_by: updatedBy || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating offline message:', error);
    return false;
  }

  return true;
}

// ========================================
// Helper: สร้างตารางว่าง (ทุกช่องเปิด)
// ========================================
export function createEmptySchedule(defaultValue: 0 | 1 = 1): OperatingHoursSchedule {
  const hours = Array(24).fill(defaultValue);
  
  return {
    monday: [...hours],
    tuesday: [...hours],
    wednesday: [...hours],
    thursday: [...hours],
    friday: [...hours],
    saturday: [...hours],
    sunday: [...hours],
  };
}

// ========================================
// Helper: คัดลอกตารางจากวันหนึ่งไปอีกวัน
// ========================================
export function copyDaySchedule(
  schedule: OperatingHoursSchedule,
  fromDay: keyof OperatingHoursSchedule,
  toDay: keyof OperatingHoursSchedule
): OperatingHoursSchedule {
  return {
    ...schedule,
    [toDay]: [...schedule[fromDay]],
  };
}

// ========================================
// Helper: ตั้งค่าทั้งวัน
// ========================================
export function setAllDay(
  schedule: OperatingHoursSchedule,
  day: keyof OperatingHoursSchedule,
  value: 0 | 1
): OperatingHoursSchedule {
  return {
    ...schedule,
    [day]: Array(24).fill(value),
  };
}
