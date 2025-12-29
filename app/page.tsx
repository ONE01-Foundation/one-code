"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import TopBar from "@/components/bubbles/TopBar";
import BottomBar from "@/components/bubbles/BottomBar";
import BubbleField from "@/components/bubbles/BubbleField";
import InputBar from "@/components/bubbles/InputBar";
import AIChat, { ChatMessage } from "@/components/bubbles/AIChat";
import CenterOrnament from "@/components/CenterOrnament";
import FaviconUpdater from "@/components/FaviconUpdater";
import PWAInstaller from "@/components/PWAInstaller";
import ThemeColorMeta from "@/components/ThemeColorMeta";

export type Bubble = {
  id: string;
  title: string;
  titleRTL?: string; // Hebrew title for RTL support
  icon: string;
  value: number;
  actionType: "open" | "view" | "edit" | "play" | "share";
  aiText: string;
  aiTextRTL?: string; // Hebrew AI text for RTL support
  subBubbles?: Bubble[]; // Sub-bubbles that appear horizontally when parent is centered
};

const MOCK_BUBBLES_DATA = [
  { 
    icon: "🏠", 
    title: "Home", 
    titleRTL: "בית",
    aiText: "Welcome home where everything begins",
    aiTextRTL: "ברוכים הבאים הביתה שם הכל מתחיל"
  },
  { 
    icon: "❤️", 
    title: "Health", 
    titleRTL: "בריאות",
    aiText: "Track your wellness and maintain a healthy lifestyle",
    aiTextRTL: "עקוב אחרי הרווחה שלך ושמור על אורח חיים בריא",
    subBubbles: [
      { icon: "🏋️", title: "Fitness", titleRTL: "כושר", aiText: "Track workouts and stay active", aiTextRTL: "עקוב אחרי אימונים והישאר פעיל", value: 0, actionType: "view" as const },
      { icon: "🥗", title: "Nutrition", titleRTL: "תזונה", aiText: "Monitor your diet and meal planning", aiTextRTL: "עקוב אחרי התזונה ותכנון ארוחות", value: 1, actionType: "view" as const },
      { icon: "🧘", title: "Mental Health", titleRTL: "בריאות נפשית", aiText: "Practice mindfulness and relaxation", aiTextRTL: "תרגל מיינדפולנס ורגיעה", value: 2, actionType: "view" as const },
      { icon: "😴", title: "Sleep", titleRTL: "שינה", aiText: "Monitor sleep patterns and quality", aiTextRTL: "עקוב אחרי דפוסי השינה ואיכותה", value: 3, actionType: "view" as const },
      { icon: "💊", title: "Medications", titleRTL: "תרופות", aiText: "Manage prescriptions and reminders", aiTextRTL: "נהל מרשמים ותזכורות", value: 4, actionType: "edit" as const },
    ]
  },
  { 
    icon: "💰", 
    title: "Money", 
    titleRTL: "כסף",
    aiText: "Manage your finances and track expenses",
    aiTextRTL: "נהל את הכספים שלך ועקוב אחרי הוצאות",
    subBubbles: [
      { icon: "📊", title: "Expenses", titleRTL: "הוצאות", aiText: "Track and categorize your spending", aiTextRTL: "עקוב וסווג את ההוצאות שלך", value: 0, actionType: "view" as const },
      { icon: "💵", title: "Income", titleRTL: "הכנסות", aiText: "Monitor earnings and revenue streams", aiTextRTL: "עקוב אחרי רווחים ותזרימי הכנסה", value: 1, actionType: "view" as const },
      { icon: "📈", title: "Investments", titleRTL: "השקעות", aiText: "Track portfolio and investment growth", aiTextRTL: "עקוב אחרי תיק ההשקעות והצמיחה", value: 2, actionType: "view" as const },
      { icon: "💳", title: "Budget", titleRTL: "תקציב", aiText: "Plan and stick to your financial goals", aiTextRTL: "תכנן והתחייב ליעדים הכספיים שלך", value: 3, actionType: "edit" as const },
      { icon: "🏦", title: "Accounts", titleRTL: "חשבונות", aiText: "Manage bank accounts and balances", aiTextRTL: "נהל חשבונות בנק ומאזנים", value: 4, actionType: "view" as const },
    ]
  },
  { 
    icon: "💼", 
    title: "Work", 
    titleRTL: "עבודה",
    aiText: "Organize projects and boost productivity",
    aiTextRTL: "ארגן פרויקטים והגבר פרודוקטיביות",
    subBubbles: [
      { icon: "📋", title: "Projects", titleRTL: "פרויקטים", aiText: "Manage and track your work projects", aiTextRTL: "נהל ועקוב אחרי פרויקטי העבודה שלך", value: 0, actionType: "view" as const },
      { icon: "✅", title: "Tasks", titleRTL: "משימות", aiText: "Organize your to-do list and deadlines", aiTextRTL: "ארגן את רשימת המטלות והתאריכים", value: 1, actionType: "edit" as const },
      { icon: "👥", title: "Team", titleRTL: "צוות", aiText: "Collaborate with colleagues and contacts", aiTextRTL: "שתף פעולה עם עמיתים ואנשי קשר", value: 2, actionType: "view" as const },
      { icon: "📅", title: "Schedule", titleRTL: "לוח זמנים", aiText: "Manage meetings and appointments", aiTextRTL: "נהל פגישות ותורים", value: 3, actionType: "view" as const },
      { icon: "📊", title: "Reports", titleRTL: "דוחות", aiText: "View work analytics and performance", aiTextRTL: "צפה באנליטיקה וביצועים בעבודה", value: 4, actionType: "view" as const },
    ]
  },
  { 
    icon: "🎓", 
    title: "Learning", 
    titleRTL: "למידה",
    aiText: "Expand knowledge and acquire new skills",
    aiTextRTL: "הרחב ידע ורכוש כישורים חדשים",
    subBubbles: [
      { icon: "📚", title: "Courses", titleRTL: "קורסים", aiText: "Enroll and track your learning progress", aiTextRTL: "הירשם ועקוב אחרי ההתקדמות בלימודים", value: 0, actionType: "view" as const },
      { icon: "📖", title: "Books", titleRTL: "ספרים", aiText: "Read and organize your library", aiTextRTL: "קרא וארגן את הספרייה שלך", value: 1, actionType: "view" as const },
      { icon: "✍️", title: "Notes", titleRTL: "הערות", aiText: "Capture insights and study materials", aiTextRTL: "תעד תובנות וחומרי לימוד", value: 2, actionType: "edit" as const },
      { icon: "🎯", title: "Goals", titleRTL: "מטרות", aiText: "Set learning objectives and milestones", aiTextRTL: "הגדר יעדי למידה ואבני דרך", value: 3, actionType: "edit" as const },
      { icon: "🏆", title: "Achievements", titleRTL: "הישגים", aiText: "Track your learning accomplishments", aiTextRTL: "עקוב אחרי ההישגים הלימודיים שלך", value: 4, actionType: "view" as const },
    ]
  },
  { 
    icon: "🎨", 
    title: "Creative", 
    titleRTL: "יצירתי",
    aiText: "Express yourself through art and creativity",
    aiTextRTL: "בטא את עצמך באמצעות אמנות ויצירתיות",
    subBubbles: [
      { icon: "🖼️", title: "Design", titleRTL: "עיצוב", aiText: "Create visual designs and graphics", aiTextRTL: "צור עיצובים חזותיים וגרפיקה", value: 0, actionType: "edit" as const },
      { icon: "📸", title: "Photos", titleRTL: "תמונות", aiText: "Browse and edit your photo collection", aiTextRTL: "עיין בערוך את אוסף התמונות שלך", value: 1, actionType: "view" as const },
      { icon: "🎬", title: "Videos", titleRTL: "וידאו", aiText: "Create and watch video content", aiTextRTL: "צור וצפה בתוכן וידאו", value: 2, actionType: "play" as const },
      { icon: "✏️", title: "Writing", titleRTL: "כתיבה", aiText: "Write stories, articles, and ideas", aiTextRTL: "כתוב סיפורים, מאמרים ורעיונות", value: 3, actionType: "edit" as const },
      { icon: "🎵", title: "Music", titleRTL: "מוזיקה", aiText: "Listen to songs and create playlists", aiTextRTL: "האזן לשירים וצור רשימות השמעה", value: 4, actionType: "play" as const },
    ]
  },
  { 
    icon: "🌍", 
    title: "Life", 
    titleRTL: "חיים",
    aiText: "Manage daily life and personal matters",
    aiTextRTL: "נהל את חיי היומיום ועניינים אישיים",
    subBubbles: [
      { icon: "📅", title: "Calendar", titleRTL: "יומן", aiText: "Plan your days and stay organized", aiTextRTL: "תכנן את הימים שלך והישאר מאורגן", value: 0, actionType: "view" as const },
      { icon: "✈️", title: "Travel", titleRTL: "נסיעות", aiText: "Plan trips and explore destinations", aiTextRTL: "תכנן טיולים וחקור יעדים", value: 1, actionType: "view" as const },
      { icon: "🍔", title: "Food", titleRTL: "אוכל", aiText: "Discover recipes and restaurants", aiTextRTL: "גלה מתכונים ומסעדות", value: 2, actionType: "view" as const },
      { icon: "🛒", title: "Shopping", titleRTL: "קניות", aiText: "Track purchases and wishlists", aiTextRTL: "עקוב אחרי רכישות ורשימות משאלות", value: 3, actionType: "view" as const },
      { icon: "🏠", title: "Home", titleRTL: "בית", aiText: "Manage household tasks and maintenance", aiTextRTL: "נהל משימות בית ואחזקה", value: 4, actionType: "view" as const },
    ]
  },
  { 
    icon: "⚙️", 
    title: "Settings", 
    titleRTL: "הגדרות",
    aiText: "Configure and customize preferences",
    aiTextRTL: "הגדר והתאם העדפות",
    subBubbles: [
      { icon: "🌙", title: "Theme", titleRTL: "ערכת נושא", aiText: "Toggle dark and light mode", aiTextRTL: "החלף בין מצב כהה ובהיר", value: 0, actionType: "open" as const },
      { icon: "🇺🇸", title: "Language", titleRTL: "שפה", aiText: "Change interface language", aiTextRTL: "שנה את שפת הממשק", value: 1, actionType: "open" as const },
    ]
  },
];

// Helper function to create bubble with sub-bubbles
const createBubble = (item: any, i: number): Bubble => {
  const bubble: Bubble = {
    id: `bubble-${i}`,
    title: item.title,
    titleRTL: item.titleRTL,
    icon: item.icon,
    value: i,
    actionType: item.actionType || (["open", "view", "edit", "play", "share"][i % 5] as Bubble["actionType"]),
    aiText: item.aiText,
    aiTextRTL: item.aiTextRTL,
  };

  // Add sub-bubbles if they exist
  if (item.subBubbles && item.subBubbles.length > 0) {
    bubble.subBubbles = item.subBubbles.map((sub: any, subIndex: number) => ({
      id: `bubble-${i}-sub-${subIndex}`,
      title: sub.title,
      titleRTL: sub.titleRTL,
      icon: sub.icon,
      value: sub.value,
      actionType: sub.actionType,
      aiText: sub.aiText,
      aiTextRTL: sub.aiTextRTL,
    }));
  }

  return bubble;
};

// Create bubbles with dynamic Settings sub-bubbles
const createBubblesWithDynamicSettings = (theme: "light" | "dark", isRTL: boolean, uiSize: "normal" | "large"): Bubble[] => {
  const bubblesData = [...MOCK_BUBBLES_DATA];
  
  // Find Settings bubble and update its sub-bubbles dynamically
  const settingsIndex = bubblesData.findIndex(item => item.title === "Settings");
  if (settingsIndex >= 0 && bubblesData[settingsIndex].subBubbles) {
    bubblesData[settingsIndex].subBubbles = [
      { 
        icon: theme === "dark" ? "🌙" : "☀️", 
        title: "Theme", 
        titleRTL: "ערכת נושא", 
        aiText: "Toggle dark and light mode", 
        aiTextRTL: "החלף בין מצב כהה ובהיר", 
        value: 0, 
        actionType: "open" as const 
      },
      { 
        icon: isRTL ? "🇮🇱" : "🇺🇸", 
        title: "Language", 
        titleRTL: "שפה", 
        aiText: "Change interface language", 
        aiTextRTL: "שנה את שפת הממשק", 
        value: 1, 
        actionType: "open" as const 
      },
      { 
        icon: uiSize === "large" ? "🔍" : "🔎", 
        title: "Size", 
        titleRTL: "גודל", 
        aiText: uiSize === "large" ? "Switch to normal size" : "Switch to larger size", 
        aiTextRTL: uiSize === "large" ? "עבור לגודל רגיל" : "עבור לגודל גדול יותר", 
        value: 2, 
        actionType: "open" as const 
      },
    ];
  }
  
  return bubblesData
  .map((item, i) => createBubble(item, i))
    .filter(bubble => bubble.title && bubble.icon && bubble.aiText);
};

export default function Home() {
  // Initialize with a safe default - will be updated on client-side mount
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [autoTheme, setAutoTheme] = useState(true);
  const [bubbles, setBubbles] = useState<Bubble[]>(() => createBubblesWithDynamicSettings("dark", false, "normal"));
  const [centeredBubble, setCenteredBubble] = useState<Bubble | null>(bubbles[0]);
  const [mode, setMode] = useState<"private" | "global">("private");
  const [targetBubble, setTargetBubble] = useState<Bubble | null>(null);
  const [isRTL, setIsRTL] = useState(false);
  const [uiSize, setUiSize] = useState<"normal" | "large">("normal"); // UI size state
  const [isThemeTransitioning, setIsThemeTransitioning] = useState(false);
  const [hoveredBubbleId, setHoveredBubbleId] = useState<string | null>(null);
  const [isDashboardMode, setIsDashboardMode] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({}); // Chat history per bubble ID
  const [currentAIText, setCurrentAIText] = useState<string | null>(null); // Current AI response for TopBar
  const messageIdCounterRef = useRef(0); // Counter to ensure unique message IDs


  // Dashboard bubbles with live metrics
  const dashboardBubbles: Bubble[] = [
    { id: "dashboard-active-users", title: isRTL ? "משתמשים פעילים" : "Active Users", icon: "👥", value: 0, actionType: "view", aiText: isRTL ? "מספר המשתמשים הפעילים בזמן אמת" : "Real-time active user count" },
    { id: "dashboard-revenue", title: isRTL ? "הכנסות" : "Revenue", icon: "💰", value: 1, actionType: "view", aiText: isRTL ? "הכנסות כוללות וצמיחה" : "Total revenue and growth" },
    { id: "dashboard-engagement", title: isRTL ? "השתתפות" : "Engagement", icon: "📈", value: 2, actionType: "view", aiText: isRTL ? "מדדי השתתפות ופעילות" : "Engagement and activity metrics" },
    { id: "dashboard-conversions", title: isRTL ? "המרות" : "Conversions", icon: "🎯", value: 3, actionType: "view", aiText: isRTL ? "שיעור המרות והצלחות" : "Conversion rates and successes" },
    { id: "dashboard-performance", title: isRTL ? "ביצועים" : "Performance", icon: "⚡", value: 4, actionType: "view", aiText: isRTL ? "מדדי ביצועים וזמן תגובה" : "Performance metrics and response times" },
    { id: "dashboard-traffic", title: isRTL ? "תנועה" : "Traffic", icon: "🌐", value: 5, actionType: "view", aiText: isRTL ? "נפח תנועה ומקורות" : "Traffic volume and sources" },
  ];

  // First bubble is the origin/home bubble
  const originBubble = bubbles[0];
  const isOriginBubbleCentered = centeredBubble?.id === originBubble.id;

  // Set data-theme attribute on html element for CSS variable updates
  useEffect(() => {
    // Use requestAnimationFrame to ensure smooth transition
    requestAnimationFrame(() => {
      document.documentElement.setAttribute("data-theme", theme);
      // Also directly set background color for safe areas
      const bgColor = theme === "dark" ? "#000000" : "#FFFFFF";
      document.documentElement.style.setProperty("background-color", bgColor);
      
      // Update safe area pseudo-elements via CSS custom property
      document.documentElement.style.setProperty("--safe-area-bg", bgColor);
      
      // Also update body background for smooth transition
      document.body.style.setProperty("background-color", bgColor);
    });
  }, [theme]);

  // Auto theme by time - always calculated on client-side (after mount) to use correct timezone
  useEffect(() => {
    if (!autoTheme) return;

    const updateTheme = () => {
      // Always use client-side Date (correct timezone)
      const hour = new Date().getHours();
      const newTheme: "light" | "dark" = (hour >= 6 && hour < 18) ? "light" : "dark";
      
      // Update theme if it changed
      setTheme((currentTheme) => {
        if (currentTheme !== newTheme) {
          return newTheme;
        }
        return currentTheme;
      });
    };

    // Initial update on client mount (uses client timezone)
    updateTheme();
    
    // Check every minute to catch theme transitions
    const intervalId = setInterval(updateTheme, 60000);

    return () => {
      clearInterval(intervalId);
    };
  }, [autoTheme]);

  // Detect browser language for RTL support
  useEffect(() => {
    const browserLang = navigator.language.toLowerCase();
    const isHebrew = browserLang.startsWith("he");
    setIsRTL(isHebrew);
  }, []);

  // Update bubbles when theme, RTL, or size changes to update Settings sub-bubble emojis
  useEffect(() => {
    const newBubbles = createBubblesWithDynamicSettings(theme, isRTL, uiSize);
    setBubbles(newBubbles);
    
    // Update centered bubble's sub-bubbles if it's the Settings bubble
    // This ensures emojis update without resetting the centered state
    if (centeredBubble && (centeredBubble.title === "Settings" || centeredBubble.title === "הגדרות")) {
      const updatedSettingsBubble = newBubbles.find(b => b.title === "Settings" || b.title === "הגדרות");
      if (updatedSettingsBubble) {
        // Update the centered bubble with new sub-bubbles but keep the same reference structure
        setCenteredBubble(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            subBubbles: updatedSettingsBubble.subBubbles
          };
        });
      }
    }
  }, [theme, isRTL, uiSize]);

  const handleThemeToggle = useCallback(() => {
    setAutoTheme(false); // Disable auto theme when manually toggled
    
    // Animate bars out
    setIsThemeTransitioning(true);
    
    setTimeout(() => {
      setTheme((prev) => {
        const newTheme = prev === "light" ? "dark" : "light";
        return newTheme;
      });
      
      // Animate bars back in
      setTimeout(() => {
        setIsThemeTransitioning(false);
      }, 50);
    }, 300);
  }, []);


  const handleCenteredBubbleChange = useCallback((bubble: Bubble | null) => {
    setCenteredBubble(bubble);
    // Clear target bubble after centering is complete
    if (targetBubble && bubble?.id === targetBubble.id) {
      setTargetBubble(null);
    }
  }, [targetBubble]);

  const handleBackToHome = useCallback(() => {
    if (isDashboardMode) {
      // Exit dashboard mode
      setIsDashboardMode(false);
      setCenteredBubble(originBubble);
    } else {
    // Trigger smooth centering of origin bubble
    setTargetBubble(originBubble);
    }
  }, [originBubble, isDashboardMode]);

  const handleOpenDashboard = useCallback(() => {
    setIsDashboardMode(true);
    // Center first dashboard bubble
    if (dashboardBubbles.length > 0) {
      setTargetBubble(dashboardBubbles[0]);
    }
  }, [dashboardBubbles]);


  // Get current bubble ID for chat context
  const getCurrentBubbleId = useCallback(() => {
    if (!centeredBubble) return originBubble.id;
    return centeredBubble.id;
  }, [centeredBubble, originBubble]);

  // Show initial greeting when origin bubble is centered for the first time
  useEffect(() => {
    if (isOriginBubbleCentered && !isChatOpen) {
      const bubbleId = getCurrentBubbleId();
      // Only show greeting if no messages exist for this bubble
      if (!chatMessages[bubbleId] || chatMessages[bubbleId].length === 0) {
        const greeting = isRTL 
          ? "שלום! אני כאן כדי לעזור לך. איך אני יכול לסייע לך היום?"
          : "Hello! I'm here to help you. How can I assist you today?";
        setCurrentAIText(greeting);
      }
    }
  }, [isOriginBubbleCentered, isChatOpen, getCurrentBubbleId, chatMessages, isRTL]);

  // Get current bubble title
  const getCurrentBubbleTitle = useCallback(() => {
    if (!centeredBubble) return "Home";
    return isRTL && centeredBubble.titleRTL ? centeredBubble.titleRTL : centeredBubble.title;
  }, [centeredBubble, isRTL]);

  // Get chat messages for current bubble
  const getCurrentChatMessages = useCallback((): ChatMessage[] => {
    const bubbleId = getCurrentBubbleId();
    return chatMessages[bubbleId] || [];
  }, [chatMessages, getCurrentBubbleId]);

  const handleOpenChat = useCallback(() => {
    setIsChatOpen(true);
    
    // If origin bubble and no messages yet, show initial greeting
    const bubbleId = getCurrentBubbleId();
    if (bubbleId === originBubble.id && (!chatMessages[bubbleId] || chatMessages[bubbleId].length === 0)) {
      // Set initial greeting for origin bubble
      const greeting = isRTL 
        ? "שלום! אני כאן כדי לעזור לך. איך אני יכול לסייע לך היום?"
        : "Hello! I'm here to help you. How can I assist you today?";
      setCurrentAIText(greeting);
    }
  }, [getCurrentBubbleId, originBubble, chatMessages, isRTL]);
  
  // Show initial greeting when origin bubble is centered for the first time
  useEffect(() => {
    if (isOriginBubbleCentered && !isChatOpen) {
      const bubbleId = getCurrentBubbleId();
      // Only show greeting if no messages exist for this bubble
      if (!chatMessages[bubbleId] || chatMessages[bubbleId].length === 0) {
        const greeting = isRTL 
          ? "שלום! אני כאן כדי לעזור לך. איך אני יכול לסייע לך היום?"
          : "Hello! I'm here to help you. How can I assist you today?";
        setCurrentAIText(greeting);
      }
    }
  }, [isOriginBubbleCentered, isChatOpen, getCurrentBubbleId, chatMessages, isRTL]);

  const handleCloseChat = useCallback(() => {
    setIsChatOpen(false);
  }, []);

  const handleSendMessage = useCallback(async (message: string) => {
    const bubbleId = getCurrentBubbleId();
    const bubbleTitle = getCurrentBubbleTitle();
    const currentMessages = chatMessages[bubbleId] || [];
    
    // Generate unique message IDs using counter + timestamp + random
    messageIdCounterRef.current += 1;
    const userMessageId = `user-${Date.now()}-${messageIdCounterRef.current}-${Math.random().toString(36).substr(2, 9)}`;
    const aiMessageId = `ai-${Date.now()}-${messageIdCounterRef.current}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Add user message
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: "user",
      content: message,
    };
    
    // Add AI message placeholder with typing indicator
    const aiMessage: ChatMessage = {
      id: aiMessageId,
      role: "assistant",
      content: "",
      isTyping: true,
    };
    
    // Update chat messages for this bubble (add both user and AI placeholder)
    setChatMessages((prev) => ({
      ...prev,
      [bubbleId]: [...currentMessages, userMessage, aiMessage],
    }));
    
    try {
      // Call OpenAI API
      const response = await fetch("/api/brain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
          bubbleId: bubbleId,
          bubbleTitle: bubbleTitle,
          chatHistory: currentMessages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.reply || "I apologize, but I couldn't generate a response.";

      // Update AI message with response (word-by-word animation)
      const words = aiResponse.split(" ");
      
      // Word-by-word animation - update both chat and TopBar in real-time
      words.forEach((word: string, index: number) => {
        setTimeout(() => {
          setChatMessages((prev) => {
            const bubbleMessages = prev[bubbleId] || [];
            const updated = [...bubbleMessages];
            const aiMsgIndex = updated.findIndex((msg) => msg.id === aiMessageId);
            if (aiMsgIndex >= 0) {
              const currentWords = updated[aiMsgIndex].content ? updated[aiMsgIndex].content.split(" ") : [];
              const newContent = [...currentWords, word].join(" ");
              
              updated[aiMsgIndex] = {
                ...updated[aiMsgIndex],
                content: newContent,
                isTyping: index < words.length - 1,
              };
              
              // Update TopBar with current AI response (first 50 words max, or first 200 characters)
              const previewWords = newContent.split(" ").slice(0, 50);
              const previewText = previewWords.join(" ");
              if (previewText.length <= 200) {
                setCurrentAIText(previewText);
              } else {
                setCurrentAIText(previewText.substring(0, 200) + "...");
              }
            }
            return {
              ...prev,
              [bubbleId]: updated,
            };
          });
        }, index * 50); // Faster typing for better UX
      });

      // Fade TopBar AI text after 5 seconds when typing is complete
      const totalTypingTime = words.length * 50;
      setTimeout(() => {
        setCurrentAIText(null);
      }, totalTypingTime + 5000); // 5 seconds after typing completes
    } catch (error) {
      console.error("Error calling AI API:", error);
      
      // Update AI message with error
      setChatMessages((prev) => {
        const bubbleMessages = prev[bubbleId] || [];
        const updated = [...bubbleMessages];
        const aiMsgIndex = updated.findIndex((msg) => msg.id === aiMessageId);
        if (aiMsgIndex >= 0) {
          updated[aiMsgIndex] = {
            ...updated[aiMsgIndex],
            content: "I apologize, but I encountered an error. Please try again.",
            isTyping: false,
          };
        }
        return {
          ...prev,
          [bubbleId]: updated,
        };
      });
    }
  }, [chatMessages, getCurrentBubbleId, getCurrentBubbleTitle]);

  return (
      <>
      <ThemeColorMeta theme={theme} />
      <FaviconUpdater theme={theme} isRTL={isRTL} />
    <div
      className="fixed inset-0 overflow-hidden"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
        backgroundColor: theme === "dark" ? "#000000" : "#FFFFFF",
        transition: "background-color 0.3s ease",
      }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Layer 1: Fixed centered ornament background */}
      <CenterOrnament theme={theme} uiSize={uiSize} />

      {/* Layer 2: Bubble grid (draggable) */}
       <BubbleField
         bubbles={
           isDashboardMode ? dashboardBubbles : 
           bubbles
         }
         theme={theme}
         uiSize={uiSize}
         onCenteredBubbleChange={handleCenteredBubbleChange}
         originBubble={originBubble}
         targetBubble={targetBubble}
         onThemeToggle={handleThemeToggle}
         centeredBubble={centeredBubble}
         isRTL={isRTL}
         mode={mode}
         onHoveredBubbleChange={setHoveredBubbleId}
         onBubbleClick={(bubble) => {
           // Handle Settings sub-bubble clicks when Settings bubble is centered (Theme/Language/Size)
           if (centeredBubble && (centeredBubble.id === "settings" || centeredBubble.title === "Settings" || centeredBubble.title === "הגדרות")) {
             if (bubble.title === "Theme" || bubble.title === "ערכת נושא") {
               setAutoTheme(false);
               handleThemeToggle();
             } else if (bubble.title === "Language" || bubble.title === "שפה") {
               setIsRTL((prev) => !prev);
             } else if (bubble.title === "Size" || bubble.title === "גודל") {
               setUiSize((prev) => prev === "normal" ? "large" : "normal");
             }
           }
         }}
       />

       {/* Layer 3: Top overlay bar - always present */}
       <TopBar
         theme={theme}
         uiSize={uiSize}
         aiText={isChatOpen ? null : currentAIText} // Only show real AI responses, not predefined bubble text
         isRTL={isRTL}
         isTransitioning={isThemeTransitioning}
         onTap={handleOpenChat}
       />

      {/* Layer 4: Bottom overlay - always present, action button only when needed */}
      <BottomBar
        theme={theme}
        uiSize={uiSize}
        onBackToHome={handleBackToHome}
        onOpenDashboard={handleOpenDashboard}
        isRTL={isRTL}
        showActionButton={isDashboardMode}
        isTransitioning={isThemeTransitioning}
      />

       <InputBar
         theme={theme}
         uiSize={uiSize}
         isRTL={isRTL}
         mode={mode}
         onModeChange={setMode}
         isOriginCentered={isOriginBubbleCentered}
         centeredBubbleTitle={!isOriginBubbleCentered && centeredBubble ? (isRTL && centeredBubble.titleRTL ? centeredBubble.titleRTL : centeredBubble.title) : null}
         onSendMessage={handleSendMessage}
       />

      {/* AI Chat Interface - Overlay from topbar */}
      <AIChat
        theme={theme}
        isRTL={isRTL}
        isOpen={isChatOpen}
        messages={getCurrentChatMessages()}
        onClose={handleCloseChat}
      />
      {/* Button below input with bubble title (only when non-origin bubble is centered) */}
      {!isOriginBubbleCentered && centeredBubble && (
        <div 
          className="fixed left-1/2 -translate-x-1/2 z-40 pointer-events-none"
          style={{
            top: "calc(50% + 100px)", // Position below input bar - moved up slightly
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 2rem)", // Increased bottom margin
          }}
        >
          <button
            className={`
              transition-all duration-300 pointer-events-auto
              text-white
              hover:scale-105
              active:scale-95
            `}
             onClick={() => {
               // Regular click - navigate back to origin
               setCenteredBubble(originBubble);
             }}
            style={{
              minWidth: `${120 * (uiSize === "large" ? 1.25 : 1.0)}px`,
              width: `${180 * (uiSize === "large" ? 1.25 : 1.0)}px`,
              height: `${72 * (uiSize === "large" ? 1.25 : 1.0)}px`,
              paddingLeft: `${32 * (uiSize === "large" ? 1.25 : 1.0)}px`,
              paddingRight: `${32 * (uiSize === "large" ? 1.25 : 1.0)}px`,
              paddingTop: `${12 * (uiSize === "large" ? 1.25 : 1.0)}px`,
              paddingBottom: `${12 * (uiSize === "large" ? 1.25 : 1.0)}px`,
              backgroundImage: "url(/preview-button-bg.svg)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              border: "none",
            }}
          >
            <span className="font-medium whitespace-nowrap" style={{ fontSize: `${0.875 * (uiSize === "large" ? 1.25 : 1.0)}rem` }}>
              {isRTL && centeredBubble.titleRTL ? centeredBubble.titleRTL : centeredBubble.title}
            </span>
          </button>
        </div>
      )}
    </div>
    </>
  );
}
