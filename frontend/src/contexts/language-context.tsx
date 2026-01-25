"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type LanguageCode = 'en' | 'hi' | 'te' | 'mr' | 'ta' | 'kn' | 'bn';

interface LanguageContextType {
    language: LanguageCode;
    setLanguage: (lang: LanguageCode) => void;

    getLabel: (lang: LanguageCode) => string;
    t: (key: keyof typeof TRANSLATIONS.en) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LANGUAGES: { code: LanguageCode; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'hi', label: 'Hindi', flag: '🇮🇳' },
    { code: 'te', label: 'Telugu', flag: '🇮🇳' },
    { code: 'mr', label: 'Marathi', flag: '🇮🇳' },
    { code: 'ta', label: 'Tamil', flag: '🇮🇳' },
    { code: 'kn', label: 'Kannada', flag: '🇮🇳' },

    { code: 'bn', label: 'Bengali', flag: '🇮🇳' }
];

const TRANSLATIONS = {
    en: {
        home: "Home",
        dashboard: "Dashboard",
        overview: "Overview",
        msme_owner: "MSME Owner",
        online: "Online",
        analyzing: "Analyzing...",
        thinking: "Thinking...",
        type_message: "Type a message...",
        ask_anything: "Ask me anything about your credit score...",
        voice_message: "🎤 Voice Message...",
        report_ready: "Report Ready",
        download_pdf: "Download PDF Report",
        powered_by: "Powered by CreditSetu AI • Results are indicative only",
        notifications: "Notifications",
        language: "Language",
        log_out: "Log out"
    },
    hi: {
        home: "होम",
        dashboard: "डैशबोर्ड",
        overview: "अवलोकन",
        msme_owner: "MSME मालिक",
        online: "ऑनलाइन",
        analyzing: "विश्लेषण कर रहा है...",
        thinking: "सोच रहा है...",
        type_message: "संदेश टाइप करें...",
        ask_anything: "अपने क्रेडिट स्कोर के बारे में कुछ भी पूछें...",
        voice_message: "🎤 वॉयस संदेश...",
        report_ready: "रिपोर्ट तैयार है",
        download_pdf: "पीडीएफ रिपोर्ट डाउनलोड करें",
        powered_by: "क्रेडिटसेतु एआई द्वारा संचालित • परिणाम केवल संकेत हैं",
        notifications: "सूचनाएं",
        language: "भाषा",
        log_out: "लॉग आउट"
    },
    te: {
        home: "హోమ్",
        dashboard: "డాష్‌బోర్డ్",
        overview: "అవలోకనం",
        msme_owner: "MSME యజమాని",
        online: "ఆన్‌లైన్",
        analyzing: "విశ్లేషించడం...",
        thinking: "ఆలోచిస్తోంది...",
        type_message: "సందేశాన్ని టైప్ చేయండి...",
        ask_anything: "మీ క్రెడిట్ స్కోర్ గురించి ఏదైనా అడగండి...",
        voice_message: "🎤 వాయిస్ సందేశం...",
        report_ready: "నివేదిక సిద్ధంగా ఉంది",
        download_pdf: "PDF నివేదికను డౌన్‌లోడ్ చేయండి",
        powered_by: "క్రెడిట్‌సేతు AI ద్వారా ఆధారితం • ఫలితాలు సూచిక మాత్రమే",
        notifications: "నోటిఫికేషన్లు",
        language: "భాష",
        log_out: "లాగ్ అవుట్"
    },
    mr: {
        home: "होम",
        dashboard: "डॅशबोर्ड",
        overview: "आढावा",
        msme_owner: "MSME मालक",
        online: "ऑनलाईन",
        analyzing: "विश्लेषण करत आहे...",
        thinking: "विचार करत आहे...",
        type_message: "संदेश टाइप करा...",
        ask_anything: "आपल्या क्रेडिट स्कोरबद्दल काहीही विचारा...",
        voice_message: "🎤 व्हॉइस संदेश...",
        report_ready: "अहवाल तयार आहे",
        download_pdf: "पीडीएफ अहवाल डाउनलोड करा",
        powered_by: "क्रेडिटसेतु एआय द्वारे समर्थित • परिणाम फक्त सूचक आहेत",
        notifications: "सूचना",
        language: "भाषा",
        log_out: "लॉग आउट"
    },
    ta: {
        home: "முகப்பு",
        dashboard: "டாஷ்போர்டு",
        overview: "கண்ணோட்டம்",
        msme_owner: "MSME உரிமையாளர்",
        online: "ஆன்லைன்",
        analyzing: "பகுப்பாய்வு...",
        thinking: "யோசிக்கிறது...",
        type_message: "செய்தியை தட்டச்சு செய்யவும்...",
        ask_anything: "உங்கள் கிரெடிட் ஸ்கோர் பற்றி எதையும் கேட்கலாம்...",
        voice_message: "🎤 குரல் செய்தி...",
        report_ready: "அறிக்கை தயார்",
        download_pdf: "PDF அறிக்கையைப் பதிவிறக்கவும்",
        powered_by: "க्रेडिटசேது AI ஆல் இயக்கப்படுகிறது • முடிவுகள் குறிப்பானவை மட்டுமே",
        notifications: "அறிவிப்புகள்",
        language: "மொழி",
        log_out: "வெளியேறு"
    },
    kn: {
        home: "ಮನೆ",
        dashboard: " ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
        overview: "ಅವಲೋಕನ",
        msme_owner: "MSME ಮಾಲೀಕ",
        online: "ಆನ್‌ಲೈನ್",
        analyzing: "ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...",
        thinking: "ಯೋಚಿಸುತ್ತಿದೆ...",
        type_message: "ಸಂದೇಶವನ್ನು ಟೈಪ್ ಮಾಡಿ...",
        ask_anything: "ನಿಮ್ಮ ಕ್ರೆಡಿಟ್ ಸ್ಕೋರ್ ಬಗ್ಗೆ ಏನೆಲ್ಲಾ ಕೇಳಿ...",
        voice_message: "🎤 ಧ್ವನಿ ಸಂದೇಶ...",
        report_ready: "ವರದಿ ಸಿದ್ಧವಾಗಿದೆ",
        download_pdf: "PDF ವರದಿಯನ್ನು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
        powered_by: "ಕ್ರೆಡಿಟ್‍ಸೇತು AI ನಿಂದ ಚಾಲಿತ • ಫಲಿತಾಂಶಗಳು ಸೂಚಕ ಮಾತ್ರ",
        notifications: "ಸೂಚನೆಗಳು",
        language: "ಭಾಷೆ",
        log_out: "ಲಾಗ್ ಔಟ್"
    },
    bn: {
        home: "হোম",
        dashboard: "ড্যাশবোর্ড",
        overview: "সংক্ষিপ্ত বিবরণ",
        msme_owner: "MSME মালিক",
        online: "অনলাইন",
        analyzing: "বিশ্লেষণ করা হচ্ছে...",
        thinking: "ভাবছে...",
        type_message: "একটি বার্তা টাইপ করুন...",
        ask_anything: "আপনার ক্রেডিট স্কোর সম্পর্কে যা খুশি জিজ্ঞাসা করুন...",
        voice_message: "🎤 ভয়েস বার্তা...",
        report_ready: "রিপোর্ট তৈরি",
        download_pdf: "PDF রিপোর্ট ডাউনলোড করুন",
        powered_by: "ক্রেডিটসেতু এআই দ্বারা চালিত • ফলাফল শুধুমাত্র নির্দেশক",
        notifications: "বিজ্ঞপ্তি",
        language: "ভাষা",
        log_out: "লগ আউট"
    }
};

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<LanguageCode>('en');

    const getLabel = (code: LanguageCode) => {
        return LANGUAGES.find(l => l.code === code)?.label || 'English';
    };

    const t = (key: keyof typeof TRANSLATIONS.en) => {
        const translation = TRANSLATIONS[language][key];
        return translation || TRANSLATIONS['en'][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, getLabel, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
