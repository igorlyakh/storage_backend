<p align="right">🌐 <a href="README.md">English</a> · <b>עברית</b></p>

<div dir="rtl">

# 🗄️ Stock Assistant — Backend

<p align="center">
  <img alt="NestJS" src="https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white" />
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-14+-4169E1?logo=postgresql&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
  <img alt="Vercel" src="https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel&logoColor=white" />
  <img alt="License" src="https://img.shields.io/badge/License-Proprietary-red" />
</p>

<p align="center"><b>ה-Backend של Stock Assistant</b> — REST API בשרת NestJS, שמריץ את כל הלוגיקה העסקית של מערכת ניהול ההזמנות והמלאי.</p>

</div>

---

<div dir="rtl">

## 📖 תוכן עניינים

- [אודות הפרויקט](#-אודות-הפרויקט)
- [ארכיטקטורה ומודולים](#️-ארכיטקטורה-ומודולים)
- [סטאק טכנולוגי](#️-סטאק-טכנולוגי)
- [מודל הנתונים](#-מודל-הנתונים)
- [אבטחה והרשאות](#-אבטחה-והרשאות)
- [משתני סביבה](#-משתני-סביבה)
- [התקנה והרצה מקומית](#-התקנה-והרצה-מקומית)
- [סקריפטים זמינים](#-סקריפטים-זמינים)
- [פריסה (Deployment)](#-פריסה-deployment)
- [הפרויקט הקשור — Frontend](#-הפרויקט-הקשור--frontend)
- [רישיון](#-רישיון)

## 📋 אודות הפרויקט

זהו שרת ה-**API** של **Stock Assistant** — מערכת פנים-ארגונית לניהול הזמנות, מלאי, מחסנים והחזרות עבור רשת חנויות. השרת חושף REST API המשמש את ה-[Frontend](#-הפרויקט-הקשור--frontend) (React SPA), אך יכול לשמש כל צרכן HTTP אחר.

הפרויקט נבנה בגישת **מודולים** (NestJS Modules) — כל תחום עסקי (הזמנות, מוצרים, מחסנים, החזרות...) מבודד במודול עצמאי עם ה-Controller, ה-Service וה-DTOs שלו.

## 🏗️ ארכיטקטורה ומודולים

```
src/
├─ auth/          התחברות, JWT + Refresh Token, אסטרטגיות Passport
├─ users/         ניהול משתמשים ותפקידים
├─ stores/        ניהול חנויות
├─ product/       קטלוג מוצרים, תמונות, מוצרים תחליפיים, מלאי נמוך
├─ warehouse/     תנועות מלאי, בקשות מחסן, מחיקות מלאי
├─ warehouses/    ניהול ישויות מחסן והעברות ביניהן
├─ orders/        מחזור חיי הזמנה מלא (יצירה → טיפול → שליחה → סיום)
├─ returns/       החזרות: יצירה, אישור, איסוף ע"י נהג (QR), סגירה במחסן
├─ suppliers/     ניהול ספקים, פרטי לכל מנהל
├─ brands/        ניהול מותגים
├─ category/      ניהול קטגוריות מוצרים
├─ statistics/    אגרגציה סטטיסטית + ייצוא דוחות ל-Excel
├─ settings/      הגדרות מערכת גלובליות (Singleton)
├─ guards/        Guards להרשאות לפי תפקיד ותחום אחריות
├─ decorators/    דקורטורים מותאמים (@Roles, @CurrentUser...)
├─ strategies/    אסטרטגיית JWT ל-Passport
├─ prisma/        שירות חיבור למסד הנתונים
├─ config/        קונפיגורציה (למשל נתיב קבצי Upload)
└─ common/        פונקציות עזר משותפות בין מודולים
```

בנוסף, בתיקיית `api/` נמצא Handler ייעודי (`api/index.ts`) שעוטף את אפליקציית ה-Nest כ-**Serverless Function** לצורך פריסה על Vercel.

## 🛠️ סטאק טכנולוגי

| טכנולוגיה | שימוש |
|---|---|
| **NestJS 11** | Framework מרכזי, Dependency Injection, ארכיטקטורת מודולים |
| **Prisma 7** (עם `@prisma/adapter-pg`) | ORM לגישה ל-PostgreSQL |
| **PostgreSQL** (מתארח ב-**Supabase**) | מסד הנתונים הראשי |
| **Passport + @nestjs/jwt** | אימות משתמשים עם JWT Access/Refresh Tokens |
| **bcryptjs** | הצפנת סיסמאות |
| **class-validator / class-transformer** | ולידציה וטרנספורמציה של DTOs |
| **exceljs** | הפקת דוחות Excel לסטטיסטיקה |
| **Multer** | העלאת קבצים (תמונות מוצרים) |
| **@nestjs/serve-static** | הגשת קבצים סטטיים (תמונות, ולחלופין ה-Frontend הבנוי) |
| **cookie-parser** | ניהול Refresh Token ב-Cookie |

## 🗃️ מודל הנתונים

הסכמה המלאה מוגדרת ב-`prisma/schema.prisma`. הישויות המרכזיות:

`User` · `Store` · `Product` (עם מותגים, קטגוריה ומוצר תחליפי) · `Warehouse` + `WarehouseStock` · `Order` + `OrderItem` · `WarehouseRequest` + `WarehouseRequestItem` · `Return` + `ReturnItem` · `Supplier` · `Brand` · `Categories` · `AppSettings` (שורת הגדרות יחידה גלובלית)

תפקידי משתמש (`Role`): `STORE` · `WAREHOUSE` · `ADMIN` · `DRIVER`

> שינויים בסכמה מסונכרנים עם המסד באמצעות `prisma db push` (ללא היסטוריית מיגרציות קלאסית); שינויים שדורשים גיבוי נתונים מתבצעים דרך סקריפטי SQL אידמפוטנטיים תחת `prisma/manual-migrations`.

## 🔐 אבטחה והרשאות

- **JWT** ל-Access Token קצר-מועד ו-Refresh Token ב-HTTP-only Cookie
- **Role Guards** (`@Roles(...)`) על כל Endpoint רגיש, בשילוב `AuthGuard('jwt')`
- **תחומי אחריות למנהלים** (`adminScopes`) — ADMIN רואה ומנהל רק את הקטגוריות שהוקצו לו
- סיסמאות מוצפנות עם **bcryptjs**; שדות רגישים נוספים מוצפנים באמצעות מפתח ב-`ENCRYPTION_KEY`
- **CORS** מוגדר עם `credentials: true` לתמיכה בעוגיות בין דומיינים (Frontend/Backend נפרדים)

## ⚙️ משתני סביבה

יש להגדיר קובץ `.env` בשורש הפרויקט (ראו `.env` הקיים כדוגמה למבנה, ללא ערכים אמיתיים בשליטת Git):

| משתנה | תיאור |
|---|---|
| `DATABASE_URL` | מחרוזת חיבור ל-PostgreSQL (Supabase) |
| `JWT_SECRET` | מפתח חתימה לטוקני JWT |
| `ENCRYPTION_KEY` | מפתח להצפנת שדות רגישים |
| `PORT` | פורט הרצת השרת (ברירת מחדל בפיתוח: `3001`) |

## 🚀 התקנה והרצה מקומית

**דרישות מוקדמות:** Node.js 18+‎, Yarn, גישה למסד PostgreSQL.

```bash
git clone https://github.com/igorlyakh/storage_backend.git
cd storage_backend
yarn install
npx prisma db push
yarn start:dev
```

השרת יעלה על `http://localhost:3001` עם הקידומת הגלובלית `/api` (כלומר `http://localhost:3001/api/...`).

## 📜 סקריפטים זמינים

| פקודה | תיאור |
|---|---|
| `yarn start:dev` | הרצה במצב פיתוח עם Watch Mode |
| `yarn build` | קומפילציה לתיקיית `dist/` |
| `yarn start:prod` | הרצת ה-build המקומפל |
| `yarn test` | הרצת בדיקות יחידה (Jest) |
| `yarn test:e2e` | הרצת בדיקות End-to-End |
| `yarn lint` | בדיקת קוד עם ESLint |

## ☁️ פריסה (Deployment)

יש שתי דרכי פריסה נתמכות:

1. **Vercel (Serverless)** — ברירת המחדל. `api/index.ts` עוטף את אפליקציית ה-Nest כ-Express Handler יחיד, ו-`vercel.json` מנתב את כל הבקשות אליו. ה-Frontend הנפרס בנפרד מצביע אל כתובת ה-API הזו.
2. **שרת Node רגיל (VPS וכו')** — הרצת `dist/main.js`, כאשר `ServeStaticModule` מוגדר להגיש גם את תיקיית ה-`uploads` וגם, באופציה, את קובצי ה-Frontend הבנויים ישירות מאותו שרת.

מסד הנתונים מתארח ב-**Supabase** (PostgreSQL מנוהל).

> ⚠️ **הערה טכנית לפריסת Vercel:** תמונות מוצרים נשמרות כיום בכתיבה לדיסק המקומי (`fs.writeFile`) ומוגשות דרך `ServeStaticModule`. סביבת ה-Serverless של Vercel אינה מבטיחה עמידות קבצים בין הרצות — לכן לשמירה אמינה של תמונות מוצר בפריסת Vercel מומלץ להעביר את האחסון לשירות חיצוני (למשל Vercel Blob או Supabase Storage).

## 🔗 הפרויקט הקשור — Frontend

ממשק המשתמש (React + Vite) נמצא בריפו נפרד: **[storage_frontend](https://github.com/igorlyakh/storage_frontend)**.

## 📄 רישיון

הפרויקט הזה הוא **קנייני** וכל הזכויות בו שמורות. אין להעתיק, להפיץ או לעשות בו שימוש ללא רשות מפורשת ובכתב. לפרטים ראו את קובץ [LICENSE](LICENSE).

</div>
