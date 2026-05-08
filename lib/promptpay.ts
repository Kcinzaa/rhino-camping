function crc16ccitt(payload: string) {
  let crc = 0xffff;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;

    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }

      crc &= 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function formatField(id: string, value: string) {
  return `${id}${value.length.toString().padStart(2, "0")}${value}`;
}

function normalizePromptPayId(promptPayId: string) {
  const clean = promptPayId.replace(/[^0-9]/g, "");

  if (clean.length === 10) {
    return `0066${clean.substring(1)}`;
  }

  if (clean.length === 13) {
    return clean;
  }

  return clean;
}

export function generatePromptPayPayload(promptPayId: string, amount: number) {
  const target = normalizePromptPayId(promptPayId);
  const amountText = Number(amount).toFixed(2);

  const merchantAccountInfo =
    formatField("00", "A000000677010111") + formatField("01", target);

  const payloadWithoutCrc =
    formatField("00", "01") +
    formatField("01", "12") +
    formatField("29", merchantAccountInfo) +
    formatField("53", "764") +
    formatField("54", amountText) +
    formatField("58", "TH") +
    formatField("63", "");

  const crc = crc16ccitt(payloadWithoutCrc);

  return `${payloadWithoutCrc}${crc}`;
}