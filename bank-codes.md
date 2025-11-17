# รหัสธนาคารไทย (Bank Codes)

## 📋 Bank Mapping

| ชื่อไทย | ชื่ออังกฤษ | รหัส | Swift Code |
|---------|------------|------|------------|
| กสิกรไทย | Kasikornbank | **KBANK** | KASITHBK |
| ไทยพาณิชย์ | Siam Commercial Bank | **SCB** | SICOTHBK |
| กรุงเทพ | Bangkok Bank | **BBL** | BKKBTHBK |
| กรุงไทย | Krungthai Bank | **KTB** | KRTHTHBK |
| กรุงศรีอยุธยา | Bank of Ayudhya (Krungsri) | **BAY** | AYUDTHBK |
| ทหารไทยธนชาต | TMBThanachart Bank | **TTB** | TMBKTHBK |
| ธนชาต | Thanachart Bank | **TBANK** | THBKTHBK |
| ออมสิน | Government Savings Bank | **GSB** | GSBATHBK |
| อาคารสงเคราะห์ | Government Housing Bank | **GHBANK** | GHBATHBK |
| ธกส | Bank for Agriculture and Agricultural Cooperatives | **BAAC** | BAABTHBK |
| เกียรตินาคิน | Kiatnakin Phatra Bank | **KKP** | KIATTHBK |
| ซีไอเอ็มบี | CIMB Thai Bank | **CIMB** | CIMBTHBK |
| ยูโอบี | United Overseas Bank (Thai) | **UOB** | UOVBTHBK |
| ทิสโก้ | Tisco Bank | **TISCO** | TFPCTHBK |
| แลนด์แอนด์เฮ้าส์ | Land and Houses Bank | **LHBANK** | LAHRTHB1 |
| ไอซีบีซี | Industrial and Commercial Bank of China (Thai) | **ICBC** | ICBKTHBK |

---

## 🔢 รหัสธนาคารสำหรับ KBank API

| ธนาคาร | รหัส 3 หลัก |
|--------|-------------|
| กสิกรไทย (KBANK) | **004** |
| ไทยพาณิชย์ (SCB) | **014** |
| กรุงเทพ (BBL) | **002** |
| กรุงไทย (KTB) | **006** |
| กรุงศรีอยุธยา (BAY) | **025** |
| ทหารไทยธนชาต (TTB) | **011** |
| ออมสิน (GSB) | **030** |
| อาคารสงเคราะห์ (GHBANK) | **033** |
| ธกส (BAAC) | **034** |
| เกียรตินาคิน (KKP) | **069** |
| ซีไอเอ็มบี (CIMB) | **022** |
| ยูโอบี (UOB) | **024** |
| ทิสโก้ (TISCO) | **067** |

---

## 💡 การใช้งานใน Code

### JavaScript Mapping

```javascript
const bankMapping = {
  // กสิกรไทย
  'กสิกรไทย': 'KBANK',
  'กสิกร': 'KBANK',
  'KBank': 'KBANK',
  'KBANK': 'KBANK',
  
  // ไทยพาณิชย์
  'ไทยพาณิชย์': 'SCB',
  'SCB': 'SCB',
  
  // กรุงเทพ
  'กรุงเทพ': 'BBL',
  'BBL': 'BBL',
  
  // กรุงไทย
  'กรุงไทย': 'KTB',
  'KTB': 'KTB',
  
  // ... (ดูเพิ่มใน kbankverify.json)
};

// Normalize
const normalizedBank = bankMapping[slipData.bank] || slipData.bank;
```

### Bank Code Mapping (สำหรับ KBank API)

```javascript
const bankCodeMapping = {
  'KBANK': '004',
  'SCB': '014',
  'BBL': '002',
  'KTB': '006',
  'BAY': '025',
  'TTB': '011',
  'GSB': '030',
  'GHBANK': '033',
  'BAAC': '034',
  'KKP': '069',
  'CIMB': '022',
  'UOB': '024',
  'TISCO': '067'
};

// Get bank code
const bankCode = bankCodeMapping[normalizedBank] || '999';
```

---

## 🎯 ตัวอย่างการใช้งาน

### Input (จาก OpenAI)

```json
{
  "bank": "กสิกรไทย",
  "bankDestination": "ไทยพาณิชย์"
}
```

### After Normalization

```json
{
  "bank": "KBANK",
  "bankDestination": "SCB"
}
```

### For KBank API

```json
{
  "sendingBank": "004",
  "receivingBank": "014"
}
```

---

## 📝 หมายเหตุ

1. **Case Insensitive:** ควรใช้ `.toLowerCase()` หรือ `.toUpperCase()` ก่อน mapping
2. **Fallback:** ถ้าไม่เจอใน mapping ให้ใช้ค่าเดิม
3. **Logging:** ควร log การแปลงเพื่อ debug
4. **Update:** เพิ่มธนาคารใหม่ได้ตามต้องการ

---

**Updated:** 2025-10-30  
**Source:** Bank of Thailand, KBank API Documentation
