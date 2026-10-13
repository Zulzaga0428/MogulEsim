import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'mn' | 'en';

interface TranslationDict {
  [key: string]: string;
}

const translations: Record<Language, TranslationDict> = {
  en: {
    "buy_esim": "Buy eSIM",
    "countries": "Countries",
    "unlimited_data": "Unlimited Data",
    "days": "days",
    "buy_now": "Buy Now",
    "select_country": "Select Country",
    "login": "Login",
    "register": "Register",
    "home": "Home",
    "search_countries": "Search countries...",
    "valid_for": "Valid for",
    "speed": "Speed",
    "price": "Price",
    "order_status": "Order Status",
    "payment": "Payment",
    "scan_qr_to_pay": "Scan QR to pay",
    "your_esim": "Your eSIM",
    "scan_to_install": "Scan to install",
    "hero_title": "Stay Connected Everywhere...",
    "hero_subtitle": "Unlimited eSIM plans for travelers around the world.",
    "packages_for": "Packages for",
    "name": "Full Name",
    "email": "Email Address",
    "checkout": "Checkout",
    "complete_order": "Complete Order",
    "order_id": "Order ID",
    "status_pending": "Pending Payment",
    "status_paid": "Paid",
    "status_completed": "Completed",
    "status_failed": "Failed",
    "creating_order": "Creating Order...",
    "no_countries": "No countries found.",
    "no_packages": "No packages available for this country.",
    "network": "Network",
    "logout": "Logout",
    "password": "Password"
  },
  mn: {
    "buy_esim": "eSIM авах",
    "countries": "Орнууд",
    "unlimited_data": "Хязгааргүй дата",
    "days": "хоног",
    "buy_now": "Одоо авах",
    "select_country": "Улс сонгох",
    "login": "Нэвтрэх",
    "register": "Бүртгэл",
    "home": "Нүүр",
    "search_countries": "Улс хайх...",
    "valid_for": "Хугацаа",
    "speed": "Хурд",
    "price": "Үнэ",
    "order_status": "Захиалгын байдал",
    "payment": "Төлбөр",
    "scan_qr_to_pay": "QR уншуулж төлнө үү",
    "your_esim": "Таны eSIM",
    "scan_to_install": "QR уншуулж суулгана уу",
    "hero_title": "Дэлхийн хаана ч холбоотой...",
    "hero_subtitle": "Аялагчдад зориулсан хязгааргүй eSIM багцууд.",
    "packages_for": "Багцууд: ",
    "name": "Овог нэр",
    "email": "И-мэйл хаяг",
    "checkout": "Төлбөр төлөх",
    "complete_order": "Захиалга баталгаажуулах",
    "order_id": "Захиалгын дугаар",
    "status_pending": "Төлбөр хүлээгдэж байна",
    "status_paid": "Төлөгдсөн",
    "status_completed": "Амжилттай",
    "status_failed": "Амжилтгүй",
    "creating_order": "Захиалга үүсгэж байна...",
    "no_countries": "Улс олдсонгүй.",
    "no_packages": "Энэ улсад багц олдсонгүй.",
    "network": "Сүлжээ",
    "logout": "Гарах",
    "password": "Нууц үг"
  }
};

interface LanguageState {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

export const useLanguage = create<LanguageState>()(
  persist(
    (set, get) => ({
      lang: 'mn',
      setLang: (lang) => set({ lang }),
      t: (key) => {
        const lang = get().lang;
        return translations[lang][key] || key;
      },
    }),
    {
      name: 'gotravel-language-storage',
    }
  )
);
