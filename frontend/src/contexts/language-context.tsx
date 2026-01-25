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
        // Navigation
        home: "Home",
        dashboard: "Dashboard",
        overview: "Overview",

        // User Info
        msme_owner: "MSME Owner",
        notifications: "Notifications",
        language: "Language",
        log_out: "Log out",

        // Chat States
        online: "Online",
        analyzing: "Analyzing your data...",
        thinking: "Thinking...",
        type_message: "Type a message...",
        ask_anything: "Ask me anything about your credit score...",
        voice_message: "🎤 Voice message sent",

        // Report
        report_ready: "Report Ready",
        download_pdf: "Download PDF Report",
        powered_by: "Powered by CreditSetu AI • Results are indicative only",

        // Chat Bot
        welcome_message: "Welcome to CreditSetu AI 👋",
        ai_intro: "I'm your AI loan consultant. Choose an option:",
        check_eligibility: "Check Loan Eligibility",
        improve_score: "Improve Credit Score",
        document_checklist: "Document Checklist",
        full_audit: "Full ₹5 Lakhs Audit",

        // Dashboard Panel
        loan_readiness: "Loan Readiness Score",
        health_score: "Health Score",
        readiness_factors: "Readiness Factors",
        summary: "Summary",
        areas_of_concern: "Areas of Concern",
        strengths: "Strengths",
        recommended_actions: "Recommended Actions",
        no_data_yet: "No Data Yet",
        complete_chat: "Complete the chat to see your results",

        // Voice
        voice_only_english: "Voice input is available in English only",
        recording: "Recording...",

        // General UI
        chat: "Chat",
        send: "Send",
        cancel: "Cancel",
        submit: "Submit",
        loading: "Loading...",
        error: "Something went wrong",
        try_again: "Please try again"
    },
    hi: {
        home: "होम",
        dashboard: "डैशबोर्ड",
        overview: "अवलोकन",
        msme_owner: "MSME मालिक",
        notifications: "सूचनाएं",
        language: "भाषा",
        log_out: "लॉग आउट",
        online: "ऑनलाइन",
        analyzing: "आपके डेटा का विश्लेषण...",
        thinking: "सोच रहा है...",
        type_message: "संदेश टाइप करें...",
        ask_anything: "अपने क्रेडिट स्कोर के बारे में कुछ भी पूछें...",
        voice_message: "🎤 वॉयस संदेश भेजा गया",
        report_ready: "रिपोर्ट तैयार है",
        download_pdf: "पीडीएफ रिपोर्ट डाउनलोड करें",
        powered_by: "क्रेडिटसेतु AI द्वारा संचालित • परिणाम केवल सांकेतिक हैं",
        welcome_message: "क्रेडिटसेतु AI में आपका स्वागत है 👋",
        ai_intro: "मैं आपका AI लोन सलाहकार हूं। एक विकल्प चुनें:",
        check_eligibility: "लोन पात्रता जांचें",
        improve_score: "क्रेडिट स्कोर सुधारें",
        document_checklist: "दस्तावेज़ चेकलिस्ट",
        full_audit: "पूर्ण ₹5 लाख ऑडिट",
        loan_readiness: "लोन तत्परता स्कोर",
        health_score: "स्वास्थ्य स्कोर",
        readiness_factors: "तत्परता कारक",
        summary: "सारांश",
        areas_of_concern: "चिंता के क्षेत्र",
        strengths: "ताकत",
        recommended_actions: "अनुशंसित कार्रवाई",
        no_data_yet: "अभी कोई डेटा नहीं",
        complete_chat: "अपने परिणाम देखने के लिए चैट पूरी करें",
        voice_only_english: "वॉयस इनपुट केवल अंग्रेजी में उपलब्ध है",
        recording: "रिकॉर्डिंग...",
        chat: "चैट",
        send: "भेजें",
        cancel: "रद्द करें",
        submit: "जमा करें",
        loading: "लोड हो रहा है...",
        error: "कुछ गलत हो गया",
        try_again: "कृपया पुनः प्रयास करें"
    },
    te: {
        home: "హోమ్",
        dashboard: "డాష్‌బోర్డ్",
        overview: "అవలోకనం",
        msme_owner: "MSME యజమాని",
        notifications: "నోటిఫికేషన్లు",
        language: "భాష",
        log_out: "లాగ్ అవుట్",
        online: "ఆన్‌లైన్",
        analyzing: "మీ డేటాను విశ్లేషిస్తోంది...",
        thinking: "ఆలోచిస్తోంది...",
        type_message: "సందేశాన్ని టైప్ చేయండి...",
        ask_anything: "మీ క్రెడిట్ స్కోర్ గురించి ఏదైనా అడగండి...",
        voice_message: "🎤 వాయిస్ సందేశం పంపబడింది",
        report_ready: "నివేదిక సిద్ధంగా ఉంది",
        download_pdf: "PDF నివేదికను డౌన్‌లోడ్ చేయండి",
        powered_by: "క్రెడిట్‌సేతు AI ద్వారా ఆధారితం • ఫలితాలు సూచిక మాత్రమే",
        welcome_message: "క్రెడిట్‌సేతు AI కి స్వాగతం 👋",
        ai_intro: "నేను మీ AI లోన్ సలహాదారుడిని. ఒక ఎంపికను ఎంచుకోండి:",
        check_eligibility: "లోన్ అర్హతను తనిఖీ చేయండి",
        improve_score: "క్రెడిట్ స్కోర్ మెరుగుపరచండి",
        document_checklist: "డాక్యుమెంట్ చెక్‌లిస్ట్",
        full_audit: "పూర్తి ₹5 లక్షల ఆడిట్",
        loan_readiness: "లోన్ సిద్ధత స్కోర్",
        health_score: "ఆరోగ్య స్కోర్",
        readiness_factors: "సిద్ధత కారకాలు",
        summary: "సారాంశం",
        areas_of_concern: "ఆందోళన ప్రాంతాలు",
        strengths: "బలాలు",
        recommended_actions: "సిఫార్సు చర్యలు",
        no_data_yet: "ఇంకా డేటా లేదు",
        complete_chat: "మీ ఫలితాలను చూడటానికి చాట్ పూర్తి చేయండి",
        voice_only_english: "వాయిస్ ఇన్‌పుట్ ఆంగ్లంలో మాత్రమే అందుబాటులో ఉంది",
        recording: "రికార్డింగ్...",
        chat: "చాట్",
        send: "పంపండి",
        cancel: "రద్దు చేయండి",
        submit: "సమర్పించండి",
        loading: "లోడ్ అవుతోంది...",
        error: "ఏదో తప్పు జరిగింది",
        try_again: "దయచేసి మళ్లీ ప్రయత్నించండి"
    },
    mr: {
        home: "होम",
        dashboard: "डॅशबोर्ड",
        overview: "आढावा",
        msme_owner: "MSME मालक",
        notifications: "सूचना",
        language: "भाषा",
        log_out: "लॉग आउट",
        online: "ऑनलाईन",
        analyzing: "तुमच्या डेटाचे विश्लेषण करत आहे...",
        thinking: "विचार करत आहे...",
        type_message: "संदेश टाइप करा...",
        ask_anything: "आपल्या क्रेडिट स्कोरबद्दल काहीही विचारा...",
        voice_message: "🎤 व्हॉइस संदेश पाठवला",
        report_ready: "अहवाल तयार आहे",
        download_pdf: "पीडीएफ अहवाल डाउनलोड करा",
        powered_by: "क्रेडिटसेतु AI द्वारे समर्थित • परिणाम फक्त सूचक आहेत",
        welcome_message: "क्रेडिटसेतु AI मध्ये आपले स्वागत आहे 👋",
        ai_intro: "मी तुमचा AI कर्ज सल्लागार आहे. एक पर्याय निवडा:",
        check_eligibility: "कर्ज पात्रता तपासा",
        improve_score: "क्रेडिट स्कोर सुधारा",
        document_checklist: "कागदपत्र चेकलिस्ट",
        full_audit: "पूर्ण ₹5 लाख ऑडिट",
        loan_readiness: "कर्ज तयारी स्कोर",
        health_score: "आरोग्य स्कोर",
        readiness_factors: "तयारी घटक",
        summary: "सारांश",
        areas_of_concern: "चिंतेचे क्षेत्र",
        strengths: "ताकद",
        recommended_actions: "शिफारस केलेल्या क्रिया",
        no_data_yet: "अद्याप डेटा नाही",
        complete_chat: "तुमचे निकाल पाहण्यासाठी चॅट पूर्ण करा",
        voice_only_english: "व्हॉइस इनपुट फक्त इंग्रजीमध्ये उपलब्ध आहे",
        recording: "रेकॉर्डिंग...",
        chat: "चॅट",
        send: "पाठवा",
        cancel: "रद्द करा",
        submit: "सबमिट करा",
        loading: "लोड होत आहे...",
        error: "काही चूक झाली",
        try_again: "कृपया पुन्हा प्रयत्न करा"
    },
    ta: {
        home: "முகப்பு",
        dashboard: "டாஷ்போர்டு",
        overview: "கண்ணோட்டம்",
        msme_owner: "MSME உரிமையாளர்",
        notifications: "அறிவிப்புகள்",
        language: "மொழி",
        log_out: "வெளியேறு",
        online: "ஆன்லைன்",
        analyzing: "உங்கள் தரவை பகுப்பாய்வு செய்கிறது...",
        thinking: "யோசிக்கிறது...",
        type_message: "செய்தியை தட்டச்சு செய்யவும்...",
        ask_anything: "உங்கள் கிரெடிட் ஸ்கோர் பற்றி எதையும் கேட்கலாம்...",
        voice_message: "🎤 குரல் செய்தி அனுப்பப்பட்டது",
        report_ready: "அறிக்கை தயார்",
        download_pdf: "PDF அறிக்கையைப் பதிவிறக்கவும்",
        powered_by: "கிரெடிட்சேது AI இயக்கம் • முடிவுகள் குறிப்பானவை மட்டுமே",
        welcome_message: "கிரெடிட்சேது AI க்கு வரவேற்கிறோம் 👋",
        ai_intro: "நான் உங்கள் AI கடன் ஆலோசகன். ஒரு விருப்பத்தைத் தேர்வு செய்யவும்:",
        check_eligibility: "கடன் தகுதியைச் சரிபார்க்கவும்",
        improve_score: "கிரெடிட் ஸ்கோரை மேம்படுத்தவும்",
        document_checklist: "ஆவண சரிபார்ப்புப் பட்டியல்",
        full_audit: "முழுமையான ₹5 லட்சம் தணிக்கை",
        loan_readiness: "கடன் தயார் நிலை ஸ்கோர்",
        health_score: "ஆரோக்கிய ஸ்கோர்",
        readiness_factors: "தயார் நிலை காரணிகள்",
        summary: "சுருக்கம்",
        areas_of_concern: "கவனிக்க வேண்டிய பகுதிகள்",
        strengths: "பலங்கள்",
        recommended_actions: "பரிந்துரைக்கப்பட்ட நடவடிக்கைகள்",
        no_data_yet: "இன்னும் தரவு இல்லை",
        complete_chat: "உங்கள் முடிவுகளைப் பார்க்க அரட்டையை முடிக்கவும்",
        voice_only_english: "குரல் உள்ளீடு ஆங்கிலத்தில் மட்டுமே கிடைக்கும்",
        recording: "பதிவு செய்கிறது...",
        chat: "அரட்டை",
        send: "அனுப்பு",
        cancel: "ரத்துசெய்",
        submit: "சமர்ப்பி",
        loading: "ஏற்றுகிறது...",
        error: "ஏதோ தவறு நடந்தது",
        try_again: "மீண்டும் முயற்சிக்கவும்"
    },
    kn: {
        home: "ಮನೆ",
        dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
        overview: "ಅವಲೋಕನ",
        msme_owner: "MSME ಮಾಲೀಕ",
        notifications: "ಸೂಚನೆಗಳು",
        language: "ಭಾಷೆ",
        log_out: "ಲಾಗ್ ಔಟ್",
        online: "ಆನ್‌ಲೈನ್",
        analyzing: "ನಿಮ್ಮ ಡೇಟಾವನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...",
        thinking: "ಯೋಚಿಸುತ್ತಿದೆ...",
        type_message: "ಸಂದೇಶವನ್ನು ಟೈಪ್ ಮಾಡಿ...",
        ask_anything: "ನಿಮ್ಮ ಕ್ರೆಡಿಟ್ ಸ್ಕೋರ್ ಬಗ್ಗೆ ಏನೆಲ್ಲಾ ಕೇಳಿ...",
        voice_message: "🎤 ಧ್ವನಿ ಸಂದೇಶ ಕಳುಹಿಸಲಾಗಿದೆ",
        report_ready: "ವರದಿ ಸಿದ್ಧವಾಗಿದೆ",
        download_pdf: "PDF ವರದಿಯನ್ನು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
        powered_by: "ಕ್ರೆಡಿಟ್‍ಸೇತು AI ನಿಂದ ಚಾಲಿತ • ಫಲಿತಾಂಶಗಳು ಸೂಚಕ ಮಾತ್ರ",
        welcome_message: "ಕ್ರೆಡಿಟ್‍ಸೇತು AI ಗೆ ಸ್ವಾಗತ 👋",
        ai_intro: "ನಾನು ನಿಮ್ಮ AI ಸಾಲ ಸಲಹೆಗಾರ. ಒಂದು ಆಯ್ಕೆಯನ್ನು ಆರಿಸಿ:",
        check_eligibility: "ಸಾಲ ಅರ್ಹತೆಯನ್ನು ಪರಿಶೀಲಿಸಿ",
        improve_score: "ಕ್ರೆಡಿಟ್ ಸ್ಕೋರ್ ಸುಧಾರಿಸಿ",
        document_checklist: "ದಾಖಲೆ ಪರಿಶೀಲನಾ ಪಟ್ಟಿ",
        full_audit: "ಸಂಪೂರ್ಣ ₹5 ಲಕ್ಷ ಆಡಿಟ್",
        loan_readiness: "ಸಾಲ ಸಿದ್ಧತೆ ಸ್ಕೋರ್",
        health_score: "ಆರೋಗ್ಯ ಸ್ಕೋರ್",
        readiness_factors: "ಸಿದ್ಧತೆ ಅಂಶಗಳು",
        summary: "ಸಾರಾಂಶ",
        areas_of_concern: "ಕಾಳಜಿಯ ಪ್ರದೇಶಗಳು",
        strengths: "ಶಕ್ತಿಗಳು",
        recommended_actions: "ಶಿಫಾರಸು ಮಾಡಿದ ಕ್ರಮಗಳು",
        no_data_yet: "ಇನ್ನೂ ಡೇಟಾ ಇಲ್ಲ",
        complete_chat: "ನಿಮ್ಮ ಫಲಿತಾಂಶಗಳನ್ನು ನೋಡಲು ಚಾಟ್ ಪೂರ್ಣಗೊಳಿಸಿ",
        voice_only_english: "ಧ್ವನಿ ಇನ್‌ಪುಟ್ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಮಾತ್ರ ಲಭ್ಯವಿದೆ",
        recording: "ರೆಕಾರ್ಡಿಂಗ್...",
        chat: "ಚಾಟ್",
        send: "ಕಳುಹಿಸಿ",
        cancel: "ರದ್ದುಮಾಡಿ",
        submit: "ಸಲ್ಲಿಸಿ",
        loading: "ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
        error: "ಏನೋ ತಪ್ಪಾಗಿದೆ",
        try_again: "ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ"
    },
    bn: {
        home: "হোম",
        dashboard: "ড্যাশবোর্ড",
        overview: "সংক্ষিপ্ত বিবরণ",
        msme_owner: "MSME মালিক",
        notifications: "বিজ্ঞপ্তি",
        language: "ভাষা",
        log_out: "লগ আউট",
        online: "অনলাইন",
        analyzing: "আপনার ডেটা বিশ্লেষণ করা হচ্ছে...",
        thinking: "ভাবছে...",
        type_message: "একটি বার্তা টাইপ করুন...",
        ask_anything: "আপনার ক্রেডিট স্কোর সম্পর্কে যা খুশি জিজ্ঞাসা করুন...",
        voice_message: "🎤 ভয়েস বার্তা পাঠানো হয়েছে",
        report_ready: "রিপোর্ট তৈরি",
        download_pdf: "PDF রিপোর্ট ডাউনলোড করুন",
        powered_by: "ক্রেডিটসেতু AI দ্বারা চালিত • ফলাফল শুধুমাত্র নির্দেশক",
        welcome_message: "ক্রেডিটসেতু AI তে স্বাগতম 👋",
        ai_intro: "আমি আপনার AI লোন উপদেষ্টা। একটি বিকল্প বেছে নিন:",
        check_eligibility: "লোন যোগ্যতা পরীক্ষা করুন",
        improve_score: "ক্রেডিট স্কোর উন্নত করুন",
        document_checklist: "নথি চেকলিস্ট",
        full_audit: "সম্পূর্ণ ₹5 লক্ষ অডিট",
        loan_readiness: "লোন প্রস্তুতি স্কোর",
        health_score: "স্বাস্থ্য স্কোর",
        readiness_factors: "প্রস্তুতি কারণ",
        summary: "সারসংক্ষেপ",
        areas_of_concern: "উদ্বেগের ক্ষেত্র",
        strengths: "শক্তি",
        recommended_actions: "প্রস্তাবিত পদক্ষেপ",
        no_data_yet: "এখনও কোন ডেটা নেই",
        complete_chat: "আপনার ফলাফল দেখতে চ্যাট সম্পূর্ণ করুন",
        voice_only_english: "ভয়েস ইনপুট শুধুমাত্র ইংরেজিতে উপলব্ধ",
        recording: "রেকর্ডিং...",
        chat: "চ্যাট",
        send: "পাঠান",
        cancel: "বাতিল",
        submit: "জমা দিন",
        loading: "লোড হচ্ছে...",
        error: "কিছু ভুল হয়েছে",
        try_again: "অনুগ্রহ করে আবার চেষ্টা করুন"
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
