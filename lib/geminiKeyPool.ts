/**
 * คลังคีย์ Gemini แบบแบ่งตามบัญชี
 *
 * โควตารายวันของ Gemini คิดรวมทั้งบัญชี ไม่ได้คิดแยกรายคีย์
 * ดังนั้นถ้าคีย์ใดคีย์หนึ่งของบัญชีชนลิมิตรายวันแล้ว คีย์ที่เหลือของบัญชีนั้นก็ใช้ไม่ได้เช่นกัน
 * ระบบจึงข้ามทั้งบัญชีไปใช้บัญชีถัดไปทันที แทนที่จะไล่ยิงให้ครบทุกคีย์
 */

export type Account = { name: string; keys: string[] };

function splitKeys(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[,\s]+/)
    .map((key) => key.trim())
    .filter(Boolean);
}

export function loadAccounts(): Account[] {
  const accounts: Account[] = [];

  for (let index = 1; index <= 10; index += 1) {
    const keys = splitKeys(process.env[`GEMINI_API_KEYS_ACCOUNT_${index}`]);
    if (keys.length) accounts.push({ name: `account-${index}`, keys });
  }

  // รองรับการตั้งค่าแบบคีย์เดียวตามเดิม
  const single = splitKeys(process.env.GEMINI_API_KEY);
  if (single.length) accounts.push({ name: "account-default", keys: single });

  return accounts;
}

/** บัญชีที่เต็มโควตารายวัน จะถูกข้ามจนกว่าจะถึงเที่ยงคืนวันถัดไป */
const exhaustedUntil = new Map<string, number>();

function nextMidnight() {
  const date = new Date();
  date.setHours(24, 0, 0, 0);
  return date.getTime();
}

export function isExhausted(name: string) {
  const until = exhaustedUntil.get(name);
  if (!until) return false;
  if (Date.now() >= until) {
    exhaustedUntil.delete(name);
    return false;
  }
  return true;
}

export function markExhausted(name: string) {
  exhaustedUntil.set(name, nextMidnight());
}

/** แยกว่า error ที่ได้คือ "เต็มโควตา" (ข้ามทั้งบัญชี) หรือแค่คีย์นั้นใช้ไม่ได้ */
export function classifyFailure(status: number, body: string): "quota" | "bad-key" | "retry" {
  const text = body.toLowerCase();

  if (status === 429) return "quota";
  if (/resource_exhausted|quota|per day|perday|daily limit|billing/.test(text)) return "quota";
  if (status === 400 || status === 401 || status === 403) return "bad-key";

  return "retry";
}

export type AttemptResult<T> =
  | { ok: true; value: T }
  | { ok: false; status: number; body: string };

/**
 * ไล่ยิงคีย์ตามลำดับบัญชี: ภายในบัญชีเดียวกันจะลองคีย์ถัดไปเมื่อคีย์เสีย
 * แต่ถ้าเจอว่าเต็มโควตา จะข้ามคีย์ที่เหลือของบัญชีนั้นไปบัญชีถัดไปเลย
 */
export async function runWithKeyPool<T>(
  accounts: Account[],
  attempt: (key: string) => Promise<AttemptResult<T>>
): Promise<
  | { ok: true; value: T; account: string }
  | { ok: false; status: number; body: string; triedAll: true }
> {
  let lastStatus = 503;
  let lastBody = "ไม่มีคีย์ Gemini ที่ใช้งานได้";

  for (const account of accounts) {
    if (isExhausted(account.name)) continue;

    for (const key of account.keys) {
      const result = await attempt(key);
      if (result.ok) return { ok: true, value: result.value, account: account.name };

      lastStatus = result.status;
      lastBody = result.body;

      const reason = classifyFailure(result.status, result.body);
      if (reason === "quota") {
        // โควตารายวันของบัญชีนี้หมดแล้ว — ข้ามคีย์ที่เหลือไปบัญชีถัดไป
        markExhausted(account.name);
        break;
      }
      // "bad-key" กับ "retry" → ลองคีย์ถัดไปในบัญชีเดียวกัน
    }
  }

  return { ok: false, status: lastStatus, body: lastBody, triedAll: true };
}
