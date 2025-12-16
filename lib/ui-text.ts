/**
 * UI Text Dictionary v0.1
 * 
 * Simple translation function for UI strings
 * One active language per session
 */

import { UILang } from "./lang";

type UITextKey =
  | "findStep"
  | "send"
  | "cancel"
  | "thinking"
  | "doIt"
  | "notNow"
  | "change"
  | "sayOneLine"
  | "placeholder"
  | "ask"
  | "whatDoYouNeed"
  | "done"
  | "generating"
  | "globalViewOnly"
  | "silence";

const dict: Record<UILang, Record<UITextKey, string>> = {
  en: {
    findStep: "Find next step",
    send: "Send",
    cancel: "Cancel",
    thinking: "Thinking…",
    doIt: "Do it",
    notNow: "Not now",
    change: "Change",
    sayOneLine: "Say it in one line.",
    placeholder: "What do you need now?",
    ask: "Ask",
    whatDoYouNeed: "What do you need?",
    done: "Done",
    generating: "Generating...",
    globalViewOnly: "Global is view-only",
    silence: "Silence.",
  },
  he: {
    findStep: "מצא צעד הבא",
    send: "שלח",
    cancel: "ביטול",
    thinking: "חושב…",
    doIt: "לעשות",
    notNow: "לא עכשיו",
    change: "לשנות",
    sayOneLine: "כתוב את זה בשורה אחת",
    placeholder: "מה אתה צריך עכשיו?",
    ask: "שאל",
    whatDoYouNeed: "מה אתה צריך?",
    done: "סיים",
    generating: "מייצר...",
    globalViewOnly: "גלובלי הוא צפייה בלבד",
    silence: "שקט.",
  },
  ar: {
    findStep: "الخطوة التالية",
    send: "إرسال",
    cancel: "إلغاء",
    thinking: "أفكر…",
    doIt: "نفّذ",
    notNow: "ليس الآن",
    change: "غيّر",
    sayOneLine: "اكتبها بجملة واحدة",
    placeholder: "ماذا تحتاج الآن؟",
    ask: "اسأل",
    whatDoYouNeed: "ماذا تحتاج؟",
    done: "تم",
    generating: "جارٍ التوليد...",
    globalViewOnly: "العالمي للعرض فقط",
    silence: "صمت.",
  },
  es: {
    findStep: "Encuentra el siguiente paso",
    send: "Enviar",
    cancel: "Cancelar",
    thinking: "Pensando…",
    doIt: "Hazlo",
    notNow: "Ahora no",
    change: "Cambiar",
    sayOneLine: "Dilo en una línea.",
    placeholder: "¿Qué necesitas ahora?",
    ask: "Preguntar",
    whatDoYouNeed: "¿Qué necesitas?",
    done: "Hecho",
    generating: "Generando...",
    globalViewOnly: "Global es solo visualización",
    silence: "Silencio.",
  },
  fr: {
    findStep: "Trouve la prochaine étape",
    send: "Envoyer",
    cancel: "Annuler",
    thinking: "Réflexion…",
    doIt: "Fais-le",
    notNow: "Pas maintenant",
    change: "Changer",
    sayOneLine: "Dis-le en une ligne.",
    placeholder: "De quoi as-tu besoin maintenant ?",
    ask: "Demander",
    whatDoYouNeed: "De quoi as-tu besoin ?",
    done: "Terminé",
    generating: "Génération...",
    globalViewOnly: "Global est en lecture seule",
    silence: "Silence.",
  },
  auto: {
    // Auto falls back to English
    findStep: "Find next step",
    send: "Send",
    cancel: "Cancel",
    thinking: "Thinking…",
    doIt: "Do it",
    notNow: "Not now",
    change: "Change",
    sayOneLine: "Say it in one line.",
    placeholder: "What do you need now?",
    ask: "Ask",
    whatDoYouNeed: "What do you need?",
    done: "Done",
    generating: "Generating...",
    globalViewOnly: "Global is view-only",
    silence: "Silence.",
  },
};

/**
 * Get translated UI text
 * Falls back to English if key or language not found
 */
export function t(lang: UILang, key: UITextKey): string {
  const langDict = dict[lang] || dict.en;
  return langDict[key] || dict.en[key] || key;
}

