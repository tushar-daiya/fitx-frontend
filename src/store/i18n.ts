import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import * as auth from "@/src/i18n/auth";
import * as main from "@/src/i18n/main";
import * as more from "@/src/i18n/more";

export type Lang = "en" | "hi";

// Legacy keys live below; per-screen-group dictionaries in src/i18n/ are merged
// on top (group keys are prefixed so they can't collide).
const BASE: Record<Lang, Record<string, string>> = {
  en: {
    "app.tagline": "Elevate Your Fitness Journey",
    "auth.welcome": "Welcome back",
    "auth.signin": "Sign in to continue your journey",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.signin_btn": "SIGN IN",
    "auth.create_account": "Create account",
    "auth.new_here": "New here?",
    "auth.signup_title": "Create your account",
    "auth.trial_note": "7-day free trial included",
    "auth.name": "Full name",
    "auth.start_trial": "START FREE TRIAL",
    "auth.have_account": "Have an account?",
    "auth.signout": "Sign Out",
    "tab.home": "Home",
    "tab.plans": "Plans",
    "tab.scan": "Scan",
    "tab.coach": "Coach",
    "tab.profile": "Profile",
    "home.hi": "Hello,",
    "home.progress": "YOUR PROGRESS",
    "home.nutrition": "TODAY'S NUTRITION",
    "home.protein": "PROTEIN",
    "home.carbs": "CARBS",
    "home.fats": "FATS",
    "home.water": "WATER GLASSES",
    "home.steps": "STEPS",
    "home.scan_meal": "SCAN MEAL",
    "home.recipes": "RECIPES",
    "home.gen_plan": "Generate Your AI Plan",
    "home.gen_plan_sub": "Personalized workout + diet built for your goal",
    "home.gen_plan_btn": "GENERATE NOW →",
    "plans.title": "AI Plans",
    "plans.regen": "REGENERATE",
    "plans.no_plan": "No plan yet",
    "plans.no_plan_sub": "Generate a personalized workout + diet plan powered by GPT-4o",
    "plans.gen_btn": "GENERATE PLAN",
    "plans.workout": "WORKOUT",
    "plans.diet": "DIET",
    "scan.title": "Scan Meal",
    "scan.sub": "Snap your meal · AI estimates calories & macros",
    "scan.no_image": "No image selected",
    "scan.camera": "CAMERA",
    "scan.gallery": "GALLERY",
    "scan.analyze": "ANALYZE WITH AI",
    "scan.log": "LOG THIS MEAL",
    "chat.title": "FitX Coach",
    "chat.sub": "AI assistant · fitness & nutrition only",
    "chat.hello": "Hey! I'm your FitX Coach 💪 Ask me anything about workouts, nutrition, recipes, or recovery.",
    "chat.placeholder": "Ask FitX Coach anything...",
    "profile.subscription": "SUBSCRIPTION",
    "profile.your_profile": "YOUR PROFILE",
    "profile.gender": "Gender",
    "profile.age": "Age",
    "profile.height": "Height",
    "profile.weight": "Weight",
    "profile.target": "Target",
    "profile.goal": "Goal",
    "profile.level": "Level",
    "profile.diet": "Diet",
    "profile.settings": "Settings & Preferences",
    "profile.sub_plans": "Subscription Plans",
    "profile.recipe_library": "Recipe Library",
    "profile.form_corrector": "Form Corrector",
    "profile.language": "Language",
    "profile.admin": "Admin Panel",
    "settings.title": "Settings",
    "settings.save": "SAVE CHANGES",
    "settings.body_metrics": "BODY METRICS",
    "form.title": "Form Corrector",
    "form.sub": "Upload a video · MediaPipe AI analyzes your technique",
    "form.choose_exercise": "Choose Exercise",
    "form.upload_video": "UPLOAD VIDEO",
    "form.analyzing": "Analyzing form... (~30s)",
    "form.score": "Form Score",
    "lang.label": "LANGUAGE / भाषा",
    "lang.english": "English",
    "lang.hindi": "हिन्दी",
  },
  hi: {
    "app.tagline": "अपनी फिटनेस यात्रा को ऊँचा उठाएँ",
    "auth.welcome": "वापस स्वागत है",
    "auth.signin": "अपनी यात्रा जारी रखने के लिए साइन इन करें",
    "auth.email": "ईमेल",
    "auth.password": "पासवर्ड",
    "auth.signin_btn": "साइन इन करें",
    "auth.create_account": "खाता बनाएँ",
    "auth.new_here": "यहाँ नए हैं?",
    "auth.signup_title": "अपना खाता बनाएँ",
    "auth.trial_note": "7-दिन का मुफ्त ट्रायल शामिल",
    "auth.name": "पूरा नाम",
    "auth.start_trial": "मुफ्त ट्रायल शुरू करें",
    "auth.have_account": "खाता है?",
    "auth.signout": "साइन आउट",
    "tab.home": "होम",
    "tab.plans": "योजनाएँ",
    "tab.scan": "स्कैन",
    "tab.coach": "कोच",
    "tab.profile": "प्रोफ़ाइल",
    "home.hi": "नमस्ते,",
    "home.progress": "आपकी प्रगति",
    "home.nutrition": "आज का पोषण",
    "home.protein": "प्रोटीन",
    "home.carbs": "कार्ब्स",
    "home.fats": "फैट्स",
    "home.water": "पानी के गिलास",
    "home.steps": "कदम",
    "home.scan_meal": "भोजन स्कैन करें",
    "home.recipes": "रेसिपी",
    "home.gen_plan": "अपनी AI योजना बनाएँ",
    "home.gen_plan_sub": "आपके लक्ष्य के लिए वर्कआउट + डाइट",
    "home.gen_plan_btn": "अभी बनाएँ →",
    "plans.title": "AI योजनाएँ",
    "plans.regen": "फिर से बनाएँ",
    "plans.no_plan": "अभी कोई योजना नहीं",
    "plans.no_plan_sub": "GPT-4o से व्यक्तिगत वर्कआउट + डाइट योजना बनाएँ",
    "plans.gen_btn": "योजना बनाएँ",
    "plans.workout": "वर्कआउट",
    "plans.diet": "डाइट",
    "scan.title": "भोजन स्कैन",
    "scan.sub": "अपना भोजन स्नैप करें · AI कैलोरी और मैक्रोज़ का अनुमान",
    "scan.no_image": "कोई छवि नहीं चुनी गई",
    "scan.camera": "कैमरा",
    "scan.gallery": "गैलरी",
    "scan.analyze": "AI से विश्लेषण करें",
    "scan.log": "यह भोजन लॉग करें",
    "chat.title": "FitX कोच",
    "chat.sub": "AI सहायक · केवल फिटनेस और पोषण",
    "chat.hello": "नमस्ते! मैं आपका FitX कोच हूँ 💪 वर्कआउट, पोषण, या रिकवरी के बारे में कुछ भी पूछें।",
    "chat.placeholder": "FitX कोच से कुछ भी पूछें...",
    "profile.subscription": "सदस्यता",
    "profile.your_profile": "आपकी प्रोफ़ाइल",
    "profile.gender": "लिंग",
    "profile.age": "उम्र",
    "profile.height": "ऊँचाई",
    "profile.weight": "वज़न",
    "profile.target": "लक्ष्य",
    "profile.goal": "लक्ष्य",
    "profile.level": "स्तर",
    "profile.diet": "आहार",
    "profile.settings": "सेटिंग्स और प्राथमिकताएँ",
    "profile.sub_plans": "सदस्यता योजनाएँ",
    "profile.recipe_library": "रेसिपी लाइब्रेरी",
    "profile.form_corrector": "फॉर्म करेक्टर",
    "profile.language": "भाषा",
    "profile.admin": "एडमिन पैनल",
    "settings.title": "सेटिंग्स",
    "settings.save": "बदलाव सहेजें",
    "settings.body_metrics": "शारीरिक मापदंड",
    "form.title": "फॉर्म करेक्टर",
    "form.sub": "वीडियो अपलोड करें · MediaPipe AI तकनीक का विश्लेषण",
    "form.choose_exercise": "व्यायाम चुनें",
    "form.upload_video": "वीडियो अपलोड करें",
    "form.analyzing": "फॉर्म का विश्लेषण हो रहा है... (~30सेकंड)",
    "form.score": "फॉर्म स्कोर",
    "lang.label": "LANGUAGE / भाषा",
    "lang.english": "English",
    "lang.hindi": "हिन्दी",
  },
};

const DICT: Record<Lang, Record<string, string>> = {
  en: { ...BASE.en, ...auth.en, ...main.en, ...more.en },
  hi: { ...BASE.hi, ...auth.hi, ...main.hi, ...more.hi },
};

type I18nState = {
  lang: Lang;
  t: (key: string) => string;
  setLang: (lang: Lang) => void;
};

export const useI18nStore = create<I18nState>()(
  persist(
    (set, get) => ({
      lang: "en",
      t: (key) => DICT[get().lang][key] ?? DICT.en[key] ?? key,
      setLang: (lang) => set({ lang }),
    }),
    { name: "fitx-lang", storage: createJSONStorage(() => AsyncStorage) }
  )
);

/**
 * Translate hook for components. Subscribing to `lang` makes the component
 * re-render when the language changes (the `t` function itself is stable, so
 * selecting only `s.t` would not).
 */
export const useT = () => {
  useI18nStore((s) => s.lang);
  return useI18nStore.getState().t;
};
