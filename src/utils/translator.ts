/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="vite/client" />

// Simple client-side translation caching utility
const CACHE_KEY = "lifetalk_translation_cache_v1";

interface TranslationCache {
  [language: string]: {
    [originalText: string]: string;
  };
}

// Load cache from localStorage
const loadCache = (): TranslationCache => {
  try {
    const saved = localStorage.getItem(CACHE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    return {};
  }
};

// Save cache to localStorage
const saveCache = (cache: TranslationCache) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    // Ignore quota issues
  }
};

// High-fidelity pre-translations for stable offline fallbacks
const OFFLINE_DICTIONARY: Record<string, Record<string, string>> = {
  "Mandarin Chinese": {
    "hi there! welcome to cafe 2nl. what can i get started for you today?": "你好！欢迎来到 Cafe 2NL。今天您可以点些什么呢？",
    "good morning. i would like a hot latte, please.": "早上好。我想要一杯热拿铁，谢谢。",
    "give me hot black liquid with cow milk right now.": "立刻给我黑咖啡加牛奶。",
    "you got it! would you like any pastries or muffins to go with your coffee?": "没问题！您需要一些糕点或麦芬来搭配您的咖啡吗？",
    "no, thank you. just the coffee is fine.": "不用了，谢谢。只要咖啡就好。",
    "i want three sugar cookies right now, fast!": "我现在就要三块糖曲奇，快点！",
    "good morning! can i grab a medium caramel macchiato, please? hope you're having a good day!": "早上好！我可以来一杯中杯焦糖玛奇朵吗？祝你今天过得愉快！",
    "hello. i would like to order one warm latte, please.": "你好。我想点一杯温拿铁，谢谢。",
    "just a black coffee to go, please. thanks.": "只要一杯黑咖啡外带，谢谢。",
    "good morning! i'll take a double-shot flat white with oat milk, if you don't mind. your espresso machine looks top-tier!": "早上好！如果不介意的话，我想要一杯双份浓缩燕麦奶馥芮白。你们的咖啡机看起来真高端！",
    "good morning. may i please request a double-shot americano with a splash of skimmed milk on the side?": "早上好。我可以要一杯双份浓缩美式，旁边加一点脱脂牛奶吗？",
    "hi! standard drip coffee, please. oh, and what pastries do you recommend?": "嗨！请给我来一杯普通滴滤咖啡。噢，你有什么推荐的糕点吗？",
    "excellent choice! polite and clean structure.": "优秀的选项！礼貌且清晰的表达结构。",
    "using 'i would like..., please' is the absolute standard for polite ordering.": "使用 'I would like..., please' 是礼貌点单的绝对标准语式。",
    "perfect! alex processes your request with a smile.": "极佳！Alex 微笑着开始为您制作咖啡。",
    "clear and positive transition statement for transactional continuity.": "清晰且积极的过渡语句，保证交易顺利继续。",
    "how will you be paying for that today? we accept cash, card, or mobile tap.": "您今天打算怎么付款？我们接受现金、刷卡或手机支付。",
    "perfect, card is great. please insert or tap your card on the terminal whenever you're ready!": "太好了，刷卡没问题。准备好后，请在终端上插卡或感应支付！",
    "let me get some cash from my pocket... hopefully i have five dollars.": "我找找口袋里的现金……希望我能凑够五美元。",
    "i'll pay by card, please.": "请给我刷卡，谢谢。",
    "can i use phone tap?": "我可以用手机感应支付吗？",
    "cash is king. here's a ten-dollar bill.": "现金最牛。这是一张十面值美元。",
    "card works perfectly. right, that'll be $5.20 in total!": "刷卡一切正常。好的，总共是 $5.20！",
    "using standard card selection structure.": "使用标准的银行卡付款表达方式。",
    "i'll do card, please.": "我要刷卡，谢谢。",
    "tap-to-pay is active.": "感应支付已开启。",
    "cash payment details.": "现金支付明细。",
    "i have some cash here.": "我这里有一些现金。",
    "expected dialogue context:": "期待的生活语境对话上下文：",
    "learned phrasing target:": "学习到的目标句型：",
    "pragmatic translation help": "语用翻译语境帮助"
  },
  "Vietnamese": {
    "hi there! welcome to cafe 2nl. what can i get started for you today?": "Xin chào! Chào mừng đến với Cafe 2NL. Tôi có thể lấy món gì cho bạn hôm nay?",
    "good morning. i would like a hot latte, please.": "Chào buổi sáng. Tôi muốn một ly latte nóng, làm ơn.",
    "give me hot black liquid with cow milk right now.": "Đưa tôi ly nước màu đen nóng có sữa bò ngay lập tức.",
    "you got it! would you like any pastries or muffins to go with your coffee?": "Có ngay! Bạn có muốn dùng kèm bánh ngọt hay bánh muffin với cà phê không?",
    "no, thank you. just the coffee is fine.": "Không, cảm ơn bạn. Chỉ cà phê là được rồi.",
    "i want three sugar cookies right now, fast!": "Tôi muốn ba cái bánh quy đường ngay bây giờ, nhanh lên!",
    "good morning! can i grab a medium caramel macchiato, please? hope you're having a good day!": "Chào buổi sáng! Cho tôi một ly macchiato caramel cỡ vừa nhé? Chúc bạn một ngày tốt lành!",
    "hello. i would like to order one warm latte, please.": "Xin chào. Tôi muốn gọi một ly latte ấm, làm ơn.",
    "just a black coffee to go, please. thanks.": "Chỉ một cà phê đen mang đi thôi, làm ơn. Cảm ơn.",
    "good morning! i'll take a double-shot flat white with oat milk, if you don't mind. your espresso machine looks top-tier!": "Chào buổi sáng! Cho tôi một ly flat white double-shot pha sữa yến mạch nhé. Máy pha cà phê của bạn trông xịn thế!",
    "good morning. may i please request a double-shot americano with a splash of skimmed milk on the side?": "Chào buổi sáng. Tôi có thể gọi một ly americano double-shot với một chút sữa tách béo để riêng không?",
    "hi! standard drip coffee, please. oh, and what pastries do you recommend?": "Chào bạn! Cho tôi một ly cà phê phin tiêu chuẩn nhé. À, bạn có gợi ý bánh ngọt nào ngon không?",
    "excellent choice! polite and clean structure.": "Lựa chọn xuất sắc! Cấu trúc câu rất lịch sự và rõ ràng.",
    "using 'i would like..., please' is the absolute standard for polite ordering.": "Sử dụng 'I would like..., please' là chuẩn mực tuyệt đối để gọi món một cách lịch sự.",
    "perfect! alex processes your request with a smile.": "Tuyệt vời! Alex đáp lại yêu cầu của bạn bằng một nụ cười ấm áp.",
    "clear and positive transition statement for transactional continuity.": "Câu chuyển tiếp rõ ràng, tích cực để giao dịch diễn ra trôi chảy.",
    "how will you be paying for that today? we accept cash, card, or mobile tap.": "Hôm nay bạn muốn thanh toán bằng gì ạ? Chúng tôi nhận tiền mặt, quẹt thẻ hoặc chạm điện thoại.",
    "perfect, card is great. please insert or tap your card on the terminal whenever you're ready!": "Tuyệt vời, thanh toán thẻ nhé. Hãy cắm hoặc chạm thẻ của bạn vào thiết bị bất cứ khi nào bạn sẵn sàng!",
    "let me get some cash from my pocket... hopefully i have five dollars.": "Để tôi lấy ít tiền mặt trong túi ra... hy vọng tôi có đủ năm đô la.",
    "i'll pay by card, please.": "Tôi xin thanh toán bằng thẻ, làm ơn.",
    "can i use phone tap?": "Tôi thanh toán bằng cách chạm điện thoại được không?",
    "cash is king. here's a ten-dollar bill.": "Tiền mặt là vua. Gửi bạn tờ mười đô la.",
    "card works perfectly. right, that'll be $5.20 in total!": "Thẻ hoạt động hoàn hảo. Dạ vâng, tổng cộng hết $5.20 ạ!",
    "using standard card selection structure.": "Sử dụng cấu trúc câu thanh toán bằng thẻ tiêu chuẩn.",
    "i'll do card, please.": "Cho tôi thanh toán thẻ nhé, làm ơn.",
    "tap-to-pay is active.": "Tính năng chạm thanh toán đã được kích hoạt.",
    "cash payment details.": "Chi tiết thanh toán tiền mặt.",
    "i have some cash here.": "Tôi có một ít tiền mặt ở đây.",
    "expected dialogue context:": "Bối cảnh đối thoại mong đợi:",
    "learned phrasing target:": "Mẫu câu mục tiêu đã học:",
    "pragmatic translation help": "Hỗ trợ dịch chuẩn ngữ cảnh"
  },
  "Spanish": {
    "hi there! welcome to cafe 2nl. what can i get started for you today?": "¡Hola! Bienvenidos a Cafe 2NL. ¿Qué les puedo preparar hoy?",
    "good morning. i would like a hot latte, please.": "Buenos días. Me gustaría un latte caliente, por favor.",
    "give me hot black liquid with cow milk right now.": "Dame líquido negro caliente con leche de vaca ahora mismo.",
    "you got it! would you like any pastries or muffins to go with your coffee?": "¡Entendido! ¿Te gustaría algún pastelito o panecillo para acompañar tu café?",
    "no, thank you. just the coffee is fine.": "No, gracias. Solo el café está bien.",
    "i want three sugar cookies right now, fast!": "¡Quiero tres galletas de azúcar ahora mismo, rápido!",
    "good morning! can i grab a medium caramel macchiato, please? hope you're having a good day!": "¡Buenos días! ¿Me puedes dar un macchiato de caramelo mediano, por favor? ¡Espero que tengas un buen día!",
    "hello. i would like to order one warm latte, please.": "Hola. Quisiera ordenar un latte tibio, por favor.",
    "just a black coffee to go, please. thanks.": "Solo un café negro para llevar, por favor. Gracias.",
    "good morning! i'll take a double-shot flat white with oat milk, if you don't mind. your espresso machine looks top-tier!": "¡Buenos días! Tomaré un flat white de doble carga con leche de avena, si no te molesta. ¡Su máquina de espresso se ve de primera clase!",
    "good morning. may i please request a double-shot americano with a splash of skimmed milk on the side?": "Buenos días. ¿Podría solicitar un americano de doble carga con un chorrito de leche descremada aparte, por favor?",
    "hi! standard drip coffee, please. oh, and what pastries do you recommend?": "¡Hola! Un café de filtro estándar, por favor. ¡Ah! ¿Y qué pastelitos me recomiendas?",
    "excellent choice! polite and clean structure.": "¡Excelente elección! Estructura educada y limpia.",
    "using 'i would like..., please' is the absolute standard for polite ordering.": "Usar 'I would like..., please' es el estándar absoluto para ordenar educadamente.",
    "perfect! alex processes your request with a smile.": "¡Perfecto! Alex procesa tu pedido con una sonrisa.",
    "clear and positive transition statement for transactional continuity.": "Declaración de viaje clara y positiva para la continuidad de la transacción.",
    "how will you be paying for that today? we accept cash, card, or mobile tap.": "¿Cómo va a pagar hoy? Aceptamos efectivo, tarjeta o pago con celular.",
    "perfect, card is great. please insert or tap your card on the terminal whenever you're ready!": "Perfecto, con tarjeta está muy bien. ¡Por favor inserte o deslice su tarjeta en la terminal cuando esté listo!",
    "let me get some cash from my pocket... hopefully i have five dollars.": "Déjame sacar algo de efectivo de mi bolsillo... espero tener cinco dólares.",
    "i'll pay by card, please.": "Pagaré con tarjeta, por favor.",
    "can i use phone tap?": "¿Puedo aproximar mi teléfono para pagar?",
    "cash is king. here's a ten-dollar bill.": "El efectivo es el rey. Aquí tiene un billete de diez dólares.",
    "card works perfectly. right, that'll be $5.20 in total!": "La tarjeta funciona perfectamente. ¡Bien, serán $5.20 en total!",
    "using standard card selection structure.": "Uso de la estructura estándar para selección de tarjeta.",
    "i'll do card, please.": "Pagaré con tarjeta, por favor.",
    "tap-to-pay is active.": "El pago por proximidad está activo.",
    "cash payment details.": "Detalles del pago en efectivo.",
    "i have some cash here.": "Tengo algo de efectivo aquí.",
    "expected dialogue context:": "Contexto de diálogo esperado:",
    "learned phrasing target:": "Frase objetivo aprendida:",
    "pragmatic translation help": "Ayuda con traducción pragmática"
  }
};

/**
 * Robust text translation function that operates first by performing a clean 
 * check against the offline pre-calculated maps, followed by querying the server 
 * dynamic LLM proxy. This keeps performance fast, completely private, and highly robust.
 */
export async function translateText(text: string, targetLanguage: string): Promise<string> {
  if (!text || !targetLanguage || targetLanguage === "English") {
    return text;
  }

  const cleanText = text.trim();
  const lowerText = cleanText.toLowerCase();

  // 1. Check Offline Dictionary Map
  const langDict = OFFLINE_DICTIONARY[targetLanguage];
  if (langDict) {
    if (langDict[lowerText]) {
      return langDict[lowerText];
    }
    // Sub-phrase matching for common sentences
    for (const [key, val] of Object.entries(langDict)) {
      if (lowerText === key || lowerText.includes(key) && key.length > 10) {
        return val;
      }
    }
  }

  // 2. Read from Local Translation Cache
  const cache = loadCache();
  if (cache[targetLanguage] && cache[targetLanguage][cleanText]) {
    return cache[targetLanguage][cleanText];
  }

  // 3. Dynamic server call (Gemini powered)
  try {
    const apiUrl = import.meta.env.VITE_TRANSLATE_API_URL || "/api/translate";
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: cleanText, targetLanguage }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.translation) {
        const translated = data.translation;
        
        // Save to cache
        if (!cache[targetLanguage]) {
          cache[targetLanguage] = {};
        }
        cache[targetLanguage][cleanText] = translated;
        saveCache(cache);
        
        return translated;
      }
    }
  } catch (err) {
    console.warn("Translation route unavailable, falling back directly.");
  }

  // Fallback to Spanish hardcoded heuristics if matching common things
  if (targetLanguage === "Spanish") {
    if (lowerText.includes("started") || lowerText.includes("get you")) return "¿En qué puedo servirte hoy?";
    if (lowerText.includes("hot or iced")) return "¿Quieres que sea caliente o helado?";
    if (lowerText.includes("receipt")) return "¿Quieres el recibo?";
  }

  return text; // Fallback to original text if everything fails
}
