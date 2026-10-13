# Railway Deployment Guide — GoTravel

> ⚠️ Энэ заавар AVA-гаас ирсэн. GoTravel-ийн бодит тохиргоо CLAUDE.md-ийн
> «Deployment» хэсэгт байна (RAILPACK_* хувьсагчууд).

Railway дээр **2 тусдаа service** байна: API Server + Frontend.
Хоёулаа нэг GitHub repo-оос гардаг.

---

## АЛХАМ 1 — API Server deploy

Railway dashboard → **New Project** → **Deploy from GitHub repo** → repo сонго.

**Service settings:**
| Тохиргоо | Утга |
|---|---|
| Root Directory | `artifacts/api-server` |
| Build Command | *(railway.toml-аас автоматаар авна)* |
| Start Command | *(railway.toml-аас автоматаар авна)* |

**Environment Variables нэм:**
```
PORT=8080
NEON_DATABASE_URL=<Neon connection string>
AIRALO_CLIENT_ID=<Airalo client ID>
AIRALO_CLIENT_SECRET=<Airalo client secret>
QPAY_USERNAME=<QPay username>
QPAY_PASSWORD=<QPay password>
QPAY_INVOICE_CODE=<QPay invoice code>
CLOUDFLARE_ACCOUNT_ID=<Cloudflare account ID>
CLOUDFLARE_IMAGES_TOKEN=<Cloudflare images token>
OPENAI_API_KEY=<OpenAI API key>
FRONTEND_URL=https://<frontend-service>.up.railway.app
ADMIN_SECRET=<урт санамсаргүй нууц үг — admin панелд нэвтрэхэд ашиглана>
PUBLIC_API_URL=https://<api-service>.up.railway.app
```

> 🔐 **Нууц утгуудыг энэ файлд болон git-д ХЭЗЭЭ Ч бүү бичээрэй** — зөвхөн Railway-ийн
> Environment Variables хэсэгт оруулна. (Өмнө нь энд байсан QPay нууц үг git түүхэнд
> үлдсэн тул QPay дээрх нууц үгээ солиулахаа мартуузай!)
>
> `ADMIN_SECRET` — admin хуудас нээгээд энэ түлхүүрийг нэг удаа оруулна.
> `PUBLIC_API_URL` — QPay callback-ийг API сервер рүү чиглүүлэхэд ашиглана.

Deploy дуусаад API URL авна → жишээ: `https://api-server-production-xxxx.up.railway.app`

---

## АЛХАМ 2 — Frontend deploy

Мөн нэг project дотор → **New Service** → **GitHub repo** → дахин сонго.

**Service settings:**
| Тохиргоо | Утга |
|---|---|
| Root Directory | `artifacts/esim-store` |
| Build Command | *(railway.toml-аас автоматаар авна)* |
| Start Command | *(railway.toml-аас автоматаар авна)* |

**Environment Variables нэм:**
```
PORT=3000
VITE_API_URL=https://<api-service>.up.railway.app
```

> ⚠️ `VITE_API_URL` дээр АЛХАМ 1-ийн API URL-г оруулах!  
> Жишээ: `https://api-server-production-xxxx.up.railway.app`

---

## АЛХАМ 3 — CORS тохируулах

API service-д нэмэлт env var нэм:
```
FRONTEND_URL=https://<frontend-service>.up.railway.app
```

---

## Шалгах

- API: `https://<api>.up.railway.app/api/healthz` → `{"status":"ok"}` харагдах ёстой
- Frontend: `https://<frontend>.up.railway.app` → сайт нээгдэх ёстой

---

## Нийт Environment Variables жагсаалт

### API Service
| Key | Value |
|-----|-------|
| PORT | 8080 |
| NEON_DATABASE_URL | postgresql://... |
| AIRALO_CLIENT_ID | AVA credentials |
| AIRALO_CLIENT_SECRET | AVA credentials |
| QPAY_USERNAME | (QPay merchant username) |
| QPAY_PASSWORD | (QPay merchant password) |
| QPAY_INVOICE_CODE | (QPay invoice code) |
| CLOUDFLARE_ACCOUNT_ID | ... |
| CLOUDFLARE_IMAGES_TOKEN | ... |
| OPENAI_API_KEY | ... |
| FRONTEND_URL | https://\<frontend\>.up.railway.app |
| ADMIN_SECRET | (урт санамсаргүй нууц — admin панелийн түлхүүр) |
| PUBLIC_API_URL | https://\<api\>.up.railway.app |

### Frontend Service
| Key | Value |
|-----|-------|
| PORT | 3000 |
| VITE_API_URL | https://\<api\>.up.railway.app |
