// geminiService.js - Dynamic Model Discovery
// Automatically finds a valid Gemini model to avoid 404 errors.

const API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

// Cache
let cachedModelName = null;

/**
 * FUNGSI PENCARI MODEL OTOMATIS 🕵️‍♂️
 * Mencari model Gemini yang tersedia di akun user.
 */
async function getDynamicModel() {
    if (cachedModelName) return cachedModelName;

    try {
        console.log("[AI] Searching for valid Gemini models...");
        const res = await fetch(`${BASE_URL}/models?key=${API_KEY}`);

        if (!res.ok) {
            console.warn("[AI] Failed to fetch models list, defaulting to gemini-pro");
            return "gemini-pro";
        }

        const data = await res.json();
        const models = data.models || [];

        // 1. Prioritaskan Flash (Cepat & Murah)
        const flashModel = models.find(m =>
            m.name.includes("flash") &&
            m.supportedGenerationMethods.includes("generateContent")
        );

        // 2. Fallback ke Pro
        const proModel = models.find(m =>
            m.name.includes("pro") &&
            m.supportedGenerationMethods.includes("generateContent")
        );

        const selectedModel = flashModel || proModel || models[0];

        if (selectedModel) {
            // Hapus prefix "models/" agar bersih
            cachedModelName = selectedModel.name.replace("models/", "");
            console.log("[AI] Model selected:", cachedModelName);
            return cachedModelName;
        }
    } catch (e) {
        console.error("[AI] Discovery failed:", e);
    }

    return "gemini-pro"; // Ultimate fallback
}

/**
 * Chat with the AI Financial Advisor.
 * (Replaces user's askFinancialAdvisor logic in prompt to match App import)
 */
export const chatWithAdvisor = async (userQuestion, financialContext) => {
    // FALLBACK 1: Jika API Key Kosong
    if (!API_KEY) {
        console.warn("[AI] API Key Missing - Using Fallback response");
        return "Disclaimer: API Key belum diset. \n\nSaran Dummy: Hemat pangkal kaya! Coba kurangi jajan kopi dan mulai menabung receh. Data kamu aman.";
    }

    const modelName = await getDynamicModel();
    const url = `${BASE_URL}/models/${modelName}:generateContent?key=${API_KEY}`;

    const prompt = `
    DATA KEUANGAN USER (JSON):
    ${financialContext}

    PERAN:
    Kamu adalah penasihat keuangan pribadi yang santai, lucu, tapi tegas. 
    Berikan saran singkat (maksimal 2-3 kalimat) berdasarkan data keuangan user ini. 
    Jangan terlalu formal, gunakan bahasa gaul yang sopan jika perlu.
    
    PERTANYAAN USER: 
    ${userQuestion}

    JAWABAN (Langsung ke poin, tanpa basa-basi):
    `;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();

        // Error API Handling
        if (!response.ok) {
            console.error("[AI API Error]", data);
            throw new Error(data.error?.message || "Gagal menghubungi otak AI.");
        }

        return data.candidates?.[0]?.content?.parts?.[0]?.text || "Hmm, aku lagi bengong nih. Coba tanya lagi?";
    } catch (err) {
        // FALLBACK 2: Jika Request Gagal (Koneksi/Limit)
        console.error("AI Request Failed:", err);
        return `Duh, sirkuit aku lagi putus nyambung nih. \n\nTips Darurat: Cek lagi pengeluaran terakhirmu, jangan boros ya! (${err.message})`;
    }
};

/**
 * Scans a receipt from a Base64 string.
 */
export const scanReceipt = async (base64Image) => {
    if (!API_KEY) throw new Error("API Key Hilang");

    const modelName = await getDynamicModel();
    const url = `${BASE_URL}/models/${modelName}:generateContent?key=${API_KEY}`;

    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const systemInstruction = `
    Analyze this receipt image. Extract these fields into a strict JSON format only:
    
    total: (Number, clean without currency symbols)
    date: (String, YYYY-MM-DD format, or today's date if missing)
    items: (Array of strings, list of main items purchased)
    merchant: (String, store name)
    category: (String, guess one: 'Makanan', 'Transport', 'Belanja', 'Tagihan', 'Lainnya')
    
    RETURN ONLY RAW JSON. NO MARKDOWN. NO \`\`\`json TAGS.
    `;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: systemInstruction },
                        { inline_data: { mime_type: "image/jpeg", data: cleanBase64 } }
                    ]
                }]
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error?.message || "Gagal Scan");
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("No text returned by AI");

        // CLEAN & PARSE
        const cleanJson = text.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleanJson);

        // Map to app format
        return {
            amount: parsed.total || 0,
            title: parsed.merchant ? `${parsed.merchant} (${parsed.items?.[0] || 'Items'})` : 'Struk Belanja',
            category: parsed.category || 'Expense',
            date: parsed.date || new Date().toISOString()
        };

    } catch (err) {
        console.error("OCR Parse Error:", err);
        throw new Error(`Gagal membaca struk: ${err.message}`);
    }
};

/**
 * Helper: Analyzes a generic image File object.
 */
export const analyzeReceipt = async (imageFile) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(imageFile);
        reader.onload = async () => {
            try {
                const result = await scanReceipt(reader.result);
                resolve(result);
            } catch (e) {
                reject(e);
            }
        };
        reader.onerror = reject;
    });
};

/**
 * Legacy wrapper for Dashboard Advisor.
 */
export const askFinancialAdvisor = async (transactions) => {
    // 1. FILTER: Exclude 'TRANSFER' type completely
    const validTx = transactions.filter(t => t.type !== 'TRANSFER');

    // 2. Metrics Calculation (Help the AI be accurate)
    const income = validTx.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const expense = validTx.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + Number(t.amount || 0), 0);

    // Safety for zero division
    const ratio = income > 0 ? (expense / income) * 100 : (expense > 0 ? 100 : 0);
    const balance = income - expense;

    const context = JSON.stringify({
        summary: {
            income: income,
            expense: expense,
            balance: balance,
            expense_ratio: ratio.toFixed(1) + "%"
        },
        recent_transactions: validTx.slice(0, 5).map(t => ({
            date: t.date.split('T')[0],
            desc: t.description || t.category,
            amount: t.amount,
            type: t.type
        }))
    }, null, 2);

    // 3. Simple Trigger Prompt
    return chatWithAdvisor(
        "Berikan komentar singkat tentang kondisi keuanganku saat ini.",
        context
    );
};

/**
 * Beautifies transaction title using AI.
 * "beli netflix 186k" -> "Netflix Premium"
 */
export const beautifyTransactionTitle = async (rawText) => {
    if (!API_KEY) return rawText; // Fallback if no key

    const modelName = await getDynamicModel();
    const url = `${BASE_URL}/models/${modelName}:generateContent?key=${API_KEY}`;

    // Strict prompt for single line output
    const prompt = `Format teks transaksi ini jadi singkat & rapi (Title Case). Contoh: 'beli token pln 50rb' -> 'Token Listrik'. Input: '${rawText}'. HANYA JAWAB TEKS JADI.`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error("AI Error");

        let result = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (result) {
            // Cleanup quotes or extra lines
            return result.replace(/['"]/g, '').trim();
        }
    } catch (e) {
        console.warn("Beautify failed:", e);
    }

    return rawText; // Fallback
};
