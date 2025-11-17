// ========================================
// Page: Operating Hours Management
// ========================================

'use client';

import React, { useState, useEffect } from 'react';
import {
  getOperatingHours,
  updateSchedule,
  toggleSystem,
  updateOfflineMessage,
  checkSystemStatus,
  createEmptySchedule,
  type OperatingHours,
  type SystemStatus,
} from '@/lib/api/operating-hours';
import OperatingHoursGrid from '@/components/settings/OperatingHoursGrid';

export default function OperatingHoursPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<OperatingHours | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [offlineMessage, setOfflineMessage] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // โหลดข้อมูล
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    const [configData, statusData] = await Promise.all([
      getOperatingHours(),
      checkSystemStatus(),
    ]);

    if (configData) {
      setConfig(configData);
      setOfflineMessage(configData.offline_message);
    }

    setSystemStatus(statusData);
    setLoading(false);
  };

  // บันทึกตาราง
  const handleSaveSchedule = async () => {
    if (!config) return;

    setSaving(true);

    const success = await updateSchedule(config.id, config.schedule);

    if (success) {
      alert('✅ บันทึกตารางเวลาสำเร็จ');
      setHasChanges(false);
      await loadData(); // รีโหลดสถานะ
    } else {
      alert('❌ บันทึกไม่สำเร็จ กรุณาลองใหม่');
    }

    setSaving(false);
  };

  // บันทึกข้อความ Offline
  const handleSaveOfflineMessage = async () => {
    if (!config) return;

    setSaving(true);

    const success = await updateOfflineMessage(config.id, offlineMessage);

    if (success) {
      alert('✅ บันทึกข้อความสำเร็จ');
      setConfig({ ...config, offline_message: offlineMessage });
    } else {
      alert('❌ บันทึกไม่สำเร็จ กรุณาลองใหม่');
    }

    setSaving(false);
  };

  // เปิด/ปิดระบบ
  const handleToggleSystem = async () => {
    if (!config) return;

    const newStatus = !config.is_enabled;
    const confirmed = confirm(
      newStatus
        ? '✅ คุณต้องการเปิดระบบ AI ใช่หรือไม่?'
        : '⚠️ คุณต้องการปิดระบบ AI ใช่หรือไม่?\n\nระบบจะส่งข้อความอัตโนมัติให้ลูกค้า'
    );

    if (!confirmed) return;

    setSaving(true);

    const success = await toggleSystem(config.id, newStatus);

    if (success) {
      alert(newStatus ? '✅ เปิดระบบสำเร็จ' : '⚠️ ปิดระบบสำเร็จ');
      setConfig({ ...config, is_enabled: newStatus });
      await loadData(); // รีโหลดสถานะ
    } else {
      alert('❌ เปลี่ยนสถานะไม่สำเร็จ กรุณาลองใหม่');
    }

    setSaving(false);
  };

  // ตั้งค่าตารางทั้งหมด
  const handleSetAll = (value: 0 | 1) => {
    if (!config) return;

    const confirmed = confirm(
      value === 1
        ? '✅ เปิดทุกวันทุกเวลา?'
        : '⚠️ ปิดทุกวันทุกเวลา?'
    );

    if (!confirmed) return;

    setConfig({
      ...config,
      schedule: createEmptySchedule(value),
    });
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">❌ ไม่พบข้อมูลตารางเวลา</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ⏰ จัดการเวลาทำงานของระบบ
        </h1>
        <p className="text-gray-600">
          กำหนดเวลาที่ระบบ AI จะตอบลูกค้าอัตโนมัติ
        </p>
      </div>

      {/* สถานะระบบปัจจุบัน */}
      {systemStatus && (
        <div
          className={`mb-6 p-4 rounded-lg border-2 ${
            systemStatus.is_online
              ? 'bg-green-50 border-green-500'
              : 'bg-red-50 border-red-500'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1 text-gray-900">
                {systemStatus.is_online ? '🟢 ระบบเปิดทำงาน' : '🔴 ระบบปิดทำงาน'}
              </h3>
              <p className="text-sm text-gray-600">
                ขณะนี้: {systemStatus.current_day} เวลา {systemStatus.current_hour}:00 น.
              </p>
              {systemStatus.message && (
                <p className="text-sm text-gray-600 mt-1">
                  ข้อความ: {systemStatus.message}
                </p>
              )}
            </div>
            <button
              onClick={handleToggleSystem}
              disabled={saving}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                config.is_enabled
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              } disabled:opacity-50`}
            >
              {config.is_enabled ? '⚠️ ปิดระบบทั้งหมด' : '✅ เปิดระบบทั้งหมด'}
            </button>
          </div>
        </div>
      )}

      {/* ตารางเวลา */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            📅 ตารางเวลาทำงาน
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => handleSetAll(1)}
              disabled={saving}
              className="px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
            >
              ✓ เปิดทั้งหมด
            </button>
            <button
              onClick={() => handleSetAll(0)}
              disabled={saving}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              ✕ ปิดทั้งหมด
            </button>
          </div>
        </div>

        <OperatingHoursGrid
          schedule={config.schedule}
          onChange={(newSchedule) => {
            setConfig({ ...config, schedule: newSchedule });
            setHasChanges(true);
          }}
          disabled={saving}
        />

        {hasChanges && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              ⚠️ มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={loadData}
            disabled={saving}
            className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSaveSchedule}
            disabled={saving || !hasChanges}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'กำลังบันทึก...' : '💾 บันทึกตาราง'}
          </button>
        </div>
      </div>

      {/* ข้อความตอบกลับเมื่อปิด - ซ่อนไว้ */}
      {/* <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          💬 ข้อความตอบกลับเมื่อระบบปิด
        </h2>

        <textarea
          value={offlineMessage}
          onChange={(e) => setOfflineMessage(e.target.value)}
          disabled={saving}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-gray-900"
          rows={4}
          placeholder="กรอกข้อความที่จะส่งให้ลูกค้าเมื่อระบบปิด..."
        />

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSaveOfflineMessage}
            disabled={saving || offlineMessage === config.offline_message}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'กำลังบันทึก...' : '💾 บันทึกข้อความ'}
          </button>
        </div>
      </div> */}

      {/* ข้อมูลเพิ่มเติม */}
      <div className="mt-6 text-sm text-gray-500">
        <p>
          อัพเดตล่าสุด:{' '}
          {new Date(config.updated_at).toLocaleString('th-TH')}
        </p>
        {config.last_updated_by && (
          <p>โดย: {config.last_updated_by}</p>
        )}
      </div>
    </div>
  );
}
