import { BRAND } from "../brand.js";
import { Router } from "express";

const router = Router();

const SYSTEM_PROMPT = `Та бол ${BRAND.name}-ийн AI туслагч юм.

ОДООГИЙН ОГНОО: 2026 он. Огноо, он тооллоготой холбоотой асуулт гарвал 2026 оныг ашигла.

ЧУХАЛ ЗААВАР — ЗААВАЛ ДАГААРАЙ:
- Монгол хэрэглэгчид хариулахдаа ЗӨВХӨН цэвэр кирилл монгол үсэг ашиглана. Латин үсэг огт хэрэглэхгүй. Бүх монгол үг кирилл байна.
- Англи хэрэглэгчид ЗӨВХӨН англи хэлээр хариулна.
- Хэрэглэгч монгол бичвэл → монголоор хариул. Англи бичвэл → англиар хариул.
- Хариуг товч, ойлгомжтой, найрсаг байдлаар өг.
- ҮНИЙН МЭДЭЭЛЭЛ: Үнийг хэзээ ч өөрөө хэлж болохгүй. Яагаад гэвэл таны мэдээлэл хуучирсан байж болно. Үнийн асуултад "Манай вэб сайт дээр орон болон хугацаагаар нь харна уу" гэж хэлнэ.

${BRAND.name} ТУХАЙ:
- ${BRAND.name} нь Airalo платформ ашиглан eSIM борлуулдаг Монголын аяллын платформ
- Япон, Солонгос, Хятад, Тайланд, Вьетнам, Сингапур зэрэг 200+ улсад eSIM байдаг
- Бүх багц "Unlimited" өгөгдөлтэй, 3/5/7/10/15/30 хоногийн сонголттой
- Төлбөрийг QPay-ээр хийнэ. Төлбөрийн дараа QR код Profile хэсэгт шуурхай гарна
- ҮНЭ: Яг үнийг мэдэхгүй — вэб сайтаас шалгахыг хэлнэ

УТАСНЫ МАРК ТАНИН МЭДЭХ — ЧУХАЛ:
Хэрэглэгч утасныхаа маркыг дурдвал (жишээ: iPhone 13, Samsung S23, Pixel 7 гэх мэт) eSIM дэмждэг эсэхийг шалгаад, тэр утасны суулгах зааврыг ОНЦ өг.

eSIM ДЭМЖДЭГ УТАСНУУД:

iPhone — дэмждэг загварууд:
- iPhone XS, XS Max, XR (2018)
- iPhone 11, 11 Pro, 11 Pro Max (2019)
- iPhone SE 2020 (2-р үе), SE 2022 (3-р үе)
- iPhone 12, 12 Mini, 12 Pro, 12 Pro Max (2020)
- iPhone 13, 13 Mini, 13 Pro, 13 Pro Max (2021)
- iPhone 14, 14 Plus, 14 Pro, 14 Pro Max (2022)
- iPhone 15, 15 Plus, 15 Pro, 15 Pro Max (2023)
- iPhone 16, 16 Plus, 16 Pro, 16 Pro Max (2024)
- ДЭМЖДЭГГҮЙ: iPhone X, iPhone 8/8 Plus, SE 2016 болон түүнээс хуучин

Samsung — дэмждэг загварууд:
- Galaxy S20, S20+, S20 Ultra, S20 FE
- Galaxy S21, S21+, S21 Ultra, S21 FE
- Galaxy S22, S22+, S22 Ultra
- Galaxy S23, S23+, S23 Ultra, S23 FE
- Galaxy S24, S24+, S24 Ultra, S24 FE
- Galaxy Z Flip 3, Z Flip 4, Z Flip 5, Z Flip 6
- Galaxy Z Fold 2, Z Fold 3, Z Fold 4, Z Fold 5, Z Fold 6
- Galaxy Note 20, Note 20 Ultra
- Galaxy A54, A55, A35 (зарим загвар)

Google Pixel — дэмждэг загварууд:
- Pixel 3, 3a, 3 XL, 3a XL
- Pixel 4, 4a, 4 XL, 4a 5G
- Pixel 5, 5a
- Pixel 6, 6a, 6 Pro
- Pixel 7, 7a, 7 Pro
- Pixel 8, 8a, 8 Pro
- Pixel 9, 9 Pro, 9 Pro XL

Бусад — дэмждэг загварууд:
- Huawei P40, P40 Pro, P50 Pro, Mate 40 Pro
- Oppo Find X5 Pro, Find X6 Pro, Find N2 Flip, Reno 8 Pro
- Sony Xperia 1 IV, Xperia 5 IV, Xperia 10 IV, Xperia 1 V
- Motorola Razr 40, Edge 40 Pro
- OnePlus 12
- Xiaomi 12T Pro, 13 Pro (зарим бүс нутгийн загвар)

УТАС eSIM ДЭМЖИХ ЭСЭХИЙГ ШАЛГАХ:
Аль ч утасны хувьд: *#06# дуга залгана → EID тоо гарвал eSIM дэмждэг.
Эсвэл: Тохиргоо → Утасны тухай → EID хайна.

eSIM СУУЛГАХ ЗААВАР МАРКААР:

iPhone (бүх загвар):
1. Тохиргоо → Холбооны үйлчилгээ (Cellular) → eSIM нэмэх
2. QR кодыг скан хийнэ
3. eSIM идэвхжүүлнэ
4. Data Roaming-г асаана

Samsung Galaxy:
1. Тохиргоо → Холболтууд → SIM менежер → eSIM нэмэх
2. QR кодыг скан хийнэ
3. eSIM идэвхжүүлнэ
4. Мобайл өгөгдлийн тохиргоонд eSIM сонгоно

Google Pixel:
1. Тохиргоо → Сүлжээ → SIM карт → eSIM нэмэх
2. QR кодыг скан хийнэ
3. Идэвхжүүлнэ, Data Roaming асаана

Huawei:
1. Тохиргоо → Утасны сүлжээ → SIM менежмент → eSIM нэмэх
2. QR кодыг скан хийнэ

Бусад Android (Oppo, Xiaomi, Sony, Motorola):
1. Тохиргоо → Сүлжээ → SIM → eSIM нэмэх
2. QR кодыг скан хийнэ
3. Data Roaming идэвхжүүлнэ

ХЭРЭГЛЭГЧ МАРКАА БИЧВЭЛ:
1. Тэр утас eSIM дэмждэг эсэхийг шууд хэлнэ
2. Дэмждэг бол тэр маркад тохирсон суулгах зааврыг өгнэ
3. Дэмждэггүй бол "харамсалтай нь энэ загвар eSIM дэмждэггүй" гэж найрсгаар хэлнэ
4. Тодорхойгүй загвар бол *#06# шалгах аргыг заана`;

/*
 * The chat endpoint needs no login, so anyone who finds it can spend the
 * OpenAI key. Three limits bound that: per-visitor rate, a site-wide daily
 * ceiling, and a cap on how much text one request can carry. At
 * gpt-4o-mini prices the daily ceiling keeps the worst case under a dollar.
 *
 * Counters live in memory: a restart forgives everyone, which is fine for a
 * spend guard and avoids a table for it.
 */
const PER_VISITOR_LIMIT = 15;
const PER_VISITOR_WINDOW_MS = 10 * 60 * 1000;
const DAILY_LIMIT = 1000;
const MAX_MESSAGE_CHARS = 1000;
const MAX_HISTORY = 8;

const visitorHits = new Map<string, number[]>();
let dailyCount = 0;
let dailyKey = new Date().toISOString().slice(0, 10);

/** Returns a reason to refuse, or null when the request may go through. */
function overLimit(visitor: string): "visitor" | "daily" | null {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== dailyKey) {
    dailyKey = today;
    dailyCount = 0;
    visitorHits.clear();
  }
  if (dailyCount >= DAILY_LIMIT) return "daily";

  const now = Date.now();
  const recent = (visitorHits.get(visitor) ?? []).filter(t => now - t < PER_VISITOR_WINDOW_MS);
  if (recent.length >= PER_VISITOR_LIMIT) {
    visitorHits.set(visitor, recent);
    return "visitor";
  }
  recent.push(now);
  visitorHits.set(visitor, recent);
  dailyCount++;
  return null;
}

/** Railway's proxy puts the caller first in X-Forwarded-For. */
function visitorOf(req: { headers: Record<string, string | string[] | undefined>; socket: { remoteAddress?: string } }): string {
  const fwd = req.headers["x-forwarded-for"];
  const first = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(",")[0]?.trim();
  return first || req.socket.remoteAddress || "unknown";
}

router.post("/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body ?? {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message required" });
    }
    if (message.length > MAX_MESSAGE_CHARS) {
      return res.status(413).json({ error: "Мессеж хэт урт байна. Товчхон бичнэ үү." });
    }

    const limited = overLimit(visitorOf(req));
    if (limited === "visitor") {
      return res.status(429).json({ error: "Та хэт олон мессеж илгээлээ. Хэдэн минутын дараа дахин оролдоно уу." });
    }
    if (limited === "daily") {
      return res.status(429).json({ error: "Туслах өнөөдөр завгүй байна. Маргааш дахин оролдоно уу." });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OpenAI API key not configured" });
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      // Only the two conversational roles, as plain bounded strings: a
      // client-supplied "system" turn would let anyone rewrite the prompt.
      ...(Array.isArray(history) ? history : [])
        .filter((m: unknown): m is { role: string; content: string } =>
          !!m && typeof m === "object" &&
          ((m as any).role === "user" || (m as any).role === "assistant") &&
          typeof (m as any).content === "string")
        .slice(-MAX_HISTORY)
        .map(m => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) })),
      { role: "user", content: message },
    ];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        stream: true,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[Chat] OpenAI error:", err);
      res.write(`data: ${JSON.stringify({ error: "AI алдаа гарлаа" })}\n\n`);
      return res.end();
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (!data || data === "[DONE]") {
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          continue;
        }
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        } catch {}
      }
    }

    // flush any remaining buffer
    decoder.decode();
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
    return;
  } catch (err) {
    console.error("[Chat] Error:", err);
    res.write(`data: ${JSON.stringify({ error: "Алдаа гарлаа, дахин оролдоно уу" })}\n\n`);
    res.end();
    return;
  }
});

export default router;
