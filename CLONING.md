# Шинэ брэнд болгож хувилах заавар

Энэ repo-г шинэ eSIM сайт болгох алхмууд. Нэг сайтад ойролцоогоор 1–2 цаг
зарцуулна. Алхам бүрийг дарааллаар нь хий. Ихэнх занга нь дараалал алгассанаас
болж гардаг.

> Энэ бол ажлын заавар. Кодын дэлгэрэнгүй тайлбар `CLAUDE.md`-д байгаа.

---

## 0. Юу бэлэн байх ёстой вэ

| Юу | Хаанаас | Тэмдэглэл |
|---|---|---|
| Брэндийн тусдаа Gmail | Google | Доорх бүх бүртгэлийг энэ имэйлээр нээнэ. Хүлээлгэн өгөхөд ганц имэйл шилжүүлнэ |
| Домэйн | Namecheap, Spaceship гэх мэт | |
| **Өөрийн QPay мерчант** | QPay | Банкны аппад мерчантын нэр харагдана. Бусад сайттай хуваалцаж болохгүй |
| **Airalo API эрх** (client id + secret) | Airalo | Сайт бүр тусдаа эрхтэй байх ёстой |
| OpenAI API түлхүүр | platform.openai.com | Чатын туслахад хэрэгтэй |
| Зургууд | ChatGPT | Доорх 3-р алхамыг үз |

---

## 1. Кодыг хуулах (түүхгүйгээр)

GitHub дээр шинэ **хоосон, private** repo нээ. Тэгээд:

```bash
git clone https://github.com/Zulzaga0428/Travel.git travel-src
git clone https://github.com/<эзэмшигч>/<шинэ-repo>.git new-site
cd travel-src && git archive HEAD | tar -x -C ../new-site && cd ../new-site
git add -A && git commit -m "Start <Брэнд> from GoTravel" && git push -u origin main
```

`git archive` нь **түүхгүй** хуулна. Энэ нь зориуд тийм: хуучин түүхэнд нөгөө
сайтын тохиргоо үлдсэн байж болно.

---

## 2. `brand.json` засах — гол алхам

Repo-гийн үндсэн хавтсан дахь **`brand.json`** бол брэндийг солих **цорын ганц**
файл. Сайт, сервер, хуваалцах зураг бүгд эндээс уншдаг.

| Талбар | Юу вэ | Жишээ |
|---|---|---|
| `name` | Брэндийн нэр: толгой, хөл, чат, QPay нэхэмжлэл | `GoTravel` |
| `tagline` | Логоны доорх жижиг бичиг | `eSIM for a bigger world` |
| `siteTitle` | Браузерын табын гарчиг | |
| `shareTitle` | Facebook, Messenger-т холбоос явуулахад гарах гарчиг | |
| `description` | Google болон хуваалцахад гарах тайлбар | |
| `invoicePrefix` | QPay нэхэмжлэлийн дугаарын угтвар, 2–4 том үсэг | `GT` |
| `qpayBranchCode` | QPay-д илгээх салбарын код, том үсэг | `GOTRAVEL` |
| `shareCard` | Хуваалцах зураг дээрх бичвэрүүд | |
| `colors` | Брэндийн өнгөнүүд, доор тайлбарлав | |

**Өнгө сонгох:**
- `brand`: гол өнгө, товч болон тэмдэг
- `brandHover`: хулгана очиход гарах өнгө, `brand`-аас жаахан бараан
- `brandBorder`, `brandSoft`, `brandTint`: тухайн өнгөний маш цайвар хувилбарууд, мэдэгдлийн хайрцаг, хүрээнд хэрэглэнэ. Цагаан дээр бараг л харагдах хэмжээнд цайвар байх ёстой.
- `brandInk`: цайвар дэвсгэр дээр уншигдахуйц **бараан** хувилбар. «Unlimited» тэмдэгт хэрэглэгдэнэ.
- `onBrand`: `brand` өнгөн дээрх бичгийн өнгө. Цайвар брэнд бол, жишээ нь шар, `#111111`. Бараан брэнд бол, жишээ нь цэнхэр, `#FFFFFF`.

Шалгах арга: сайтыг локал дээр асаагаад товч, «Unlimited» тэмдэг, доод хэсгийн
өнгөт самбар дээрх бичиг уншигдаж байгаа эсэхийг хар.

---

## 3. Зураг солих

Зургууд `artifacts/esim-store/public/images/brand/` хавтсанд байгаа. **Нэрийг нь
яг хэвээр** үлдээгээд файлыг сольж тавь. WebP хэлбэр, том хэмжээтэй байвал сайн.

| Файл | Хаана гарах | Хэмжээ (дор хаяж) |
|---|---|---|
| `hero-desktop.webp` | Нүүр хуудасны дэвсгэр, компьютер | 1920×1080, баруун талд нь гол зүйл, зүүн тал нь хоосон тэнгэр |
| `hero-mobile.webp` | Нүүр хуудасны дэвсгэр, утас | 1080×1920 |
| `plane.webp` | Нисч буй онгоц, **дэвсгэргүй** | 1200 өргөн |
| `footer-wing.webp` | Доод самбарын ард | 1920×800 |
| `dest-japan.webp` … `dest-france.webp` | Алдартай 6 чиглэлийн карт | 800×600 |

Бусад сайтуудтай **ижил зураг бүү ашигла**. Google хуулбар гэж үзнэ.

---

## 4. Бичвэрийг өөрчлөх

`brand.json` нь нэр, өнгийг солино, **бичвэрийг солихгүй**. 8 сайт ижил бичвэртэй
байвал Google бүгдийг нь хуулбар гэж үзээд ихэнхийг нь хайлтаас хасна. Эдгээр
файл доторх `COPY` хэсгийн **монгол, англи** бичвэрийг өөрийнхөөрөө бич:

- `artifacts/esim-store/src/pages/home.tsx`: гарчиг, тайлбар, давуу талууд
- `artifacts/esim-store/src/pages/about.tsx`
- `artifacts/esim-store/src/pages/help.tsx`: асуултуудыг өөрөөр томьёол
- `artifacts/esim-store/src/pages/how-it-works.tsx`

Утгыг нь өөрчлөх хэрэггүй, өөр үгээр бичихэд л хангалттай.

---

## 5. Хуваалцах зураг, favicon үүсгэх

```bash
# Montserrat фонтыг нэг удаа татна
curl -L -o scripts/Montserrat.ttf "https://github.com/google/fonts/raw/main/ofl/montserrat/Montserrat%5Bwght%5D.ttf"
pip install pillow
python scripts/og-image.py
```

`og-image.jpg`, `favicon.svg`, `apple-touch-icon.png` гурвыг `brand.json` болон
шинэ зургуудаас үүсгэнэ. `og-image.jpg`-ийг нээж харж шалга.

Commit + push хий.

---

## 6. Neon өгөгдлийн сан

1. neon.tech → брэндийн Gmail-ээр нэвтэр → **New Project** (бүс: Singapore эсвэл Tokyo).
2. Connection string-ийг хуул (`postgresql://...`). Дараагийн алхамд хэрэгтэй.

Бусад сайтын DB-г **хэзээ ч бүү хуваалц**. Захиалга, хэрэглэгчид холилдоно.

---

## 7. Railway

### 7.1 Сервисүүд
1. Railway → **New Project** → **Deploy from GitHub repo** → шинэ repo.
2. Railway monorepo гэж таниад **6 сервис** үүсгэнэ. Дөрвийг нь **устга**:
   `@workspace/db`, `@workspace/api-zod`, `@workspace/api-spec`, `@workspace/api-client-react`.
   Зөвхөн `@workspace/api-server` ба `@workspace/esim-store` үлдэнэ.

### 7.2 Build командууд (заавал)
Railway `railway.toml`-ыг уншдаггүй тул хоёр сервист хувьсагчаар өгнө:

| Сервис | `RAILPACK_BUILD_CMD` | `RAILPACK_START_CMD` |
|---|---|---|
| api-server | `pnpm install --no-frozen-lockfile && pnpm run build` | `node artifacts/api-server/dist/index.cjs` |
| esim-store | `pnpm install --no-frozen-lockfile && pnpm run build` | `npx serve@14 artifacts/esim-store/dist/public -s -l $PORT` |

Эдгээргүйгээр build «No start command detected» гэж унана.

### 7.3 Домэйн (түр)
Хоёр сервист Settings → Networking → **Generate Domain**.

### 7.4 api-server хувьсагчид

| Хувьсагч | Утга |
|---|---|
| `NEON_DATABASE_URL` | 6-р алхмын connection string |
| `JWT_SECRET` | **Шинэ** санамсаргүй, 64 тэмдэгт. Жишээ нь `python -c "import secrets;print(secrets.token_hex(32))"`. Бусад сайтынхыг бүү хуул |
| `ADMIN_SECRET` | **Шинэ** урт нууц үг, админ самбарт нэвтрэхэд хэрэглэнэ |
| `AIRALO_CLIENT_ID`, `AIRALO_CLIENT_SECRET` | Энэ сайтын Airalo эрх |
| `QPAY_USERNAME`, `QPAY_PASSWORD`, `QPAY_INVOICE_CODE` | Энэ сайтын QPay мерчант |
| `OPENAI_API_KEY` | |
| `PUBLIC_API_URL` | api-server-ийн домэйн (`https://...up.railway.app`). QPay төлбөрийн мэдэгдэл энд ирнэ |
| `FRONTEND_URL` | Сайтын домэйн. Эхлээд Railway-ийнх, 9-р алхмын дараа жинхэнэ домэйн |

### 7.5 esim-store хувьсагчид

| Хувьсагч | Утга |
|---|---|
| `VITE_API_URL` | api-server-ийн домэйн |
| `VITE_SITE_URL` | Сайтын домэйн. Хуваалцах зурагт хэрэглэнэ, 9-р алхмын дараа жинхэнэ домэйн болгоно |

---

## 8. Хүснэгтүүд үүсгэх (migration)

Railway CLI суулгаад (`npm i -g @railway/cli`, `railway login`), repo дотроос:

```bash
railway link            # төсөл, орчноо сонго
railway run --service @workspace/api-server -- pnpm --filter @workspace/db run push
```

«Changes applied» гэж гарвал болсон. Railway энэ алхмыг **автоматаар хийдэггүй**.

---

## 9. Жинхэнэ домэйн холбох

1. Railway → esim-store → Settings → Networking → **Custom Domain** → домэйнээ нэм.
2. Railway-ийн өгсөн 2 бичлэгийг домэйн бүртгэгчийн DNS-д нэм:
   - `CNAME` (эсвэл `ALIAS`/`ANAME`) `@` → `xxxx.up.railway.app`
   - `TXT` `_railway-verify` → `railway-verify=...`
3. Railway дээр «Verified» болж, гэрчилгээ гартал хүлээ. Хэдэн минутаас хэдэн цаг.
4. Дараа нь: esim-store `VITE_SITE_URL` = `https://домэйн`, api-server `FRONTEND_URL` = `https://домэйн`.

`VITE_SITE_URL`-ийг домэйн ажиллахаас **өмнө** бүү соль. Хуваалцах зураг эвдэрнэ.

---

## 10. Шалгах — нээхээс өмнө бүгдийг

- [ ] `https://<api>/api/healthz` → `{"status":"ok"}`
- [ ] Сайт нээгдэж, нэр, өнгө, зураг шинэ брэндийнх байна
- [ ] «Улсууд» хуудсанд 200 гаруй улс гарч, үнэ харагдана (Airalo эрх ажиллаж байна)
- [ ] Шинэ дугаараар бүртгүүлэх, гарах, дахин нэвтрэх
- [ ] Админ: `https://домэйн/admin` → `ADMIN_SECRET` оруулна → захиалгууд харагдана
- [ ] Чат асуултад хариулж, өөрийгөө шинэ брэндийн нэрээр танилцуулна
- [ ] Холбоосыг Messenger-т явуулахад шинэ зураг, гарчиг гарна
- [ ] **Жинхэнэ худалдан авалт:** хамгийн хямд багцыг аваад QPay-ээр төл → QR Профайл дээр гарна. Банкны апп дээр нэхэмжлэл **шинэ брэндийн нэрээр** гарч байгааг шалга

---

## Мэдэгдэж буй занга

- **Windows дээр `pnpm install`:** «Cannot find native binding» гэвэл код эвдэрсэн биш. `CLAUDE.md` → «Building on Windows».
- **3000 порт завгүй:** өөр төсөл эзэлсэн байж болно. `--port 3055 --strictPort` хэрэглэ.
- **Нууц үгийг git-д хэзээ ч бүү хий.** Зөвхөн Railway-ийн хувьсагчид.
- **Raw Editor-оор хувьсагч буулгахдаа** `RAILPACK_*` хоёрыг устгачихав уу гэдгээ шалга.

## GoTravel дээр засвар гарахад

`FIXES.md`-г хар. Тэнд засвар бүр аль commit-д байгаа, аль файлд хүрсэн,
юуг шалгах вэ гэдэг бичигдсэн байна. Өөрийн сайт руугаа тэр засварыг дамжуул.
