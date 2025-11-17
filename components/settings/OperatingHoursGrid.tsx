// ========================================
// Component: Operating Hours Grid
// ========================================

'use client';

import React, { useState } from 'react';
import { OperatingHoursSchedule } from '@/lib/api/operating-hours';

interface OperatingHoursGridProps {
  schedule: OperatingHoursSchedule;
  onChange: (schedule: OperatingHoursSchedule) => void;
  disabled?: boolean;
}

const DAYS = [
  { key: 'monday', label: 'จันทร์' },
  { key: 'tuesday', label: 'อังคาร' },
  { key: 'wednesday', label: 'พุธ' },
  { key: 'thursday', label: 'พฤหัสบดี' },
  { key: 'friday', label: 'ศุกร์' },
  { key: 'saturday', label: 'เสาร์' },
  { key: 'sunday', label: 'อาทิตย์' },
] as const;

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function OperatingHoursGrid({
  schedule,
  onChange,
  disabled = false,
}: OperatingHoursGridProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState<0 | 1>(1);

  // Toggle ช่องเดียว
  const toggleCell = (day: keyof OperatingHoursSchedule, hour: number) => {
    if (disabled) return;

    const newSchedule = { ...schedule };
    const currentValue = newSchedule[day][hour];
    newSchedule[day][hour] = currentValue === 1 ? 0 : 1;
    onChange(newSchedule);
  };

  // เริ่ม Drag
  const handleMouseDown = (day: keyof OperatingHoursSchedule, hour: number) => {
    if (disabled) return;

    setIsDragging(true);
    const currentValue = schedule[day][hour];
    const newValue = currentValue === 1 ? 0 : 1;
    setDragValue(newValue);

    // Toggle ช่องแรก
    toggleCell(day, hour);
  };

  // Drag ผ่านช่อง
  const handleMouseEnter = (day: keyof OperatingHoursSchedule, hour: number) => {
    if (!isDragging || disabled) return;

    const newSchedule = { ...schedule };
    newSchedule[day][hour] = dragValue;
    onChange(newSchedule);
  };

  // จบ Drag
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // ตั้งค่าทั้งวัน
  const setAllDay = (day: keyof OperatingHoursSchedule, value: 0 | 1) => {
    if (disabled) return;

    const newSchedule = { ...schedule };
    newSchedule[day] = Array(24).fill(value);
    onChange(newSchedule);
  };

  // ตั้งค่าทั้งชั่วโมง (ทุกวัน)
  const setAllHour = (hour: number, value: 0 | 1) => {
    if (disabled) return;

    const newSchedule = { ...schedule };
    DAYS.forEach(({ key }) => {
      newSchedule[key][hour] = value;
    });
    onChange(newSchedule);
  };

  // คัดลอกจากวันอื่น
  const copyFromDay = (
    fromDay: keyof OperatingHoursSchedule,
    toDay: keyof OperatingHoursSchedule
  ) => {
    if (disabled) return;

    const newSchedule = { ...schedule };
    newSchedule[toDay] = [...newSchedule[fromDay]];
    onChange(newSchedule);
  };

  return (
    <div className="space-y-4" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {/* Header: ชั่วโมง */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="flex">
            {/* คอลัมน์วัน */}
            <div className="w-32 flex-shrink-0" />

            {/* คอลัมน์ชั่วโมง */}
            <div className="flex">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="w-12 flex-shrink-0 text-center text-xs font-medium text-gray-600 pb-2"
                >
                  {hour.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>
          </div>

          {/* Rows: แต่ละวัน */}
          {DAYS.map(({ key, label }) => (
            <div key={key} className="flex items-center mb-1">
              {/* ชื่อวัน + ปุ่มควบคุม */}
              <div className="w-32 flex-shrink-0 pr-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setAllDay(key, 1)}
                      disabled={disabled}
                      className="px-1 py-0.5 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                      title="เปิดทั้งวัน"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setAllDay(key, 0)}
                      disabled={disabled}
                      className="px-1 py-0.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                      title="ปิดทั้งวัน"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>

              {/* ช่องชั่วโมง */}
              <div className="flex">
                {HOURS.map((hour) => {
                  const isActive = schedule[key][hour] === 1;

                  return (
                    <div
                      key={hour}
                      onMouseDown={() => handleMouseDown(key, hour)}
                      onMouseEnter={() => handleMouseEnter(key, hour)}
                      className={`
                        w-12 h-8 flex-shrink-0 border border-gray-200 cursor-pointer
                        transition-colors duration-150
                        ${isActive ? 'bg-green-400 hover:bg-green-500' : 'bg-white hover:bg-gray-100'}
                        ${disabled ? 'cursor-not-allowed opacity-50' : ''}
                      `}
                      title={`${label} ${hour}:00 - ${isActive ? 'เปิด' : 'ปิด'}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Footer: ปุ่มควบคุมชั่วโมง */}
          <div className="flex mt-2">
            <div className="w-32 flex-shrink-0" />
            <div className="flex">
              {HOURS.map((hour) => (
                <div key={hour} className="w-12 flex-shrink-0 flex flex-col gap-0.5">
                  <button
                    onClick={() => setAllHour(hour, 1)}
                    disabled={disabled}
                    className="text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 disabled:opacity-50"
                    title={`เปิดทุกวัน ${hour}:00`}
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => setAllHour(hour, 0)}
                    disabled={disabled}
                    className="text-xs bg-gray-50 text-gray-700 rounded hover:bg-gray-100 disabled:opacity-50"
                    title={`ปิดทุกวัน ${hour}:00`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* คำแนะนำ */}
      <div className="text-sm text-gray-600 space-y-1">
        <p>💡 <strong>วิธีใช้:</strong></p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>🟢 <strong>สีเขียว</strong> = ระบบเปิด AI ตอบลูกค้า</li>
          <li>⚪ <strong>สีขาว</strong> = ระบบปิด AI (เอไอไม่ทำงาน)</li>
          <li>🖱️ <strong>คลิก</strong> = เปลี่ยนสถานะช่องเดียว</li>
          <li>🖱️ <strong>คลิกค้าง + ลาก</strong> = เปลี่ยนหลายช่อง</li>
          <li>✓ / ✕ = เปิด/ปิดทั้งวันหรือทั้งชั่วโมง</li>
        </ul>
      </div>
    </div>
  );
}
