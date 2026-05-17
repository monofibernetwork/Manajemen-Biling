/**
 * Utility to convert Static QRIS string to Dynamic QRIS string with amount
 */

// CRC16 CCITT
export function crc16(data: string): string {
  let crc = 0xFFFF;
  for (let c = 0; c < data.length; c++) {
    crc ^= data.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  let hex = (crc & 0xFFFF).toString(16).toUpperCase();
  return hex.padStart(4, '0');
}

export function generateDynamicQris(staticQris: string, amount: number): string {
  if (!staticQris) return '';
  
  staticQris = staticQris.trim();
  
  // 1. Remove the old CRC (last 4 chars)
  let qrisWithoutCrc = staticQris.slice(0, -4);
  
  // 2. We should also remove the old tag 63 entirely to be safe, which is '6304' + the 4 CRC chars (8 chars total)
  if (staticQris.endsWith('6304', staticQris.length - 4)) {
     qrisWithoutCrc = staticQris.slice(0, -8);
  }

  // 3. Ensure Method of Initialization (Tag 01) is set to 12 (Dynamic)
  // Tag 01 always comes early, usually "010211" for static. We replace it with "010212".
  let modifiedQris = qrisWithoutCrc.replace('010211', '010212');

  // 4. Add the Amount Tag (Tag 54)
  const amountStr = amount.toString();
  const amountLength = amountStr.length.toString().padStart(2, '0');
  const amountTag = `54${amountLength}${amountStr}`;
  
  modifiedQris += amountTag;
  
  // 5. Append Tag 63 (CRC) and calculate payload
  modifiedQris += '6304';
  const calculatedCrc = crc16(modifiedQris);
  
  return modifiedQris + calculatedCrc;
}
