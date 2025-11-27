import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, AdviceRequest, AdviceResponse, Transaction, TransactionType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to convert File to Base64
export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Client-side processing to ensure data consistency
const processTransactions = (transactions: Transaction[]): { monthlySummary: any[], topCategories: any[] } => {
  const monthlyMap = new Map<string, { income: number, expense: number }>();
  const categoryMap = new Map<string, number>();

  transactions.forEach(t => {
    // 1. Monthly Aggregation
    // Assuming date is YYYY-MM-DD
    const month = t.date.substring(0, 7); // YYYY-MM
    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, { income: 0, expense: 0 });
    }
    const mData = monthlyMap.get(month)!;
    
    if (t.type === TransactionType.INCOME) {
      mData.income += t.amount;
    } else {
      mData.expense += t.amount;
      
      // 2. Category Aggregation (Only for Expenses)
      // Normalize category just in case, though prompt should handle it
      const cat = t.category || "Other";
      const currentVal = categoryMap.get(cat) || 0;
      categoryMap.set(cat, currentVal + t.amount);
    }
  });

  // Convert to arrays
  const monthlySummary = Array.from(monthlyMap.entries()).map(([month, data]) => ({
    month,
    totalIncome: data.income,
    totalExpense: data.expense,
    savings: data.income - data.expense
  })).sort((a, b) => a.month.localeCompare(b.month));

  const topCategories = Array.from(categoryMap.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  return { monthlySummary, topCategories };
};

export const analyzeStatement = async (file: File): Promise<AnalysisResult> => {
  const model = "gemini-2.5-flash";
  const filePart = await fileToGenerativePart(file);

  const prompt = `
    Analyze this bank statement document image.
    
    TASK: Extract all transactions from the image.
    
    STRICT RULES:
    1. EXTRACT Date, Description, Amount.
    2. DETERMINE Type: 'INCOME' or 'EXPENSE'.
    3. CATEGORIZE each expense into EXACTLY ONE of these categories:
       - Food & Dining
       - Transportation
       - Utilities
       - Entertainment
       - Shopping
       - Health
       - Salary
       - Transfer
       - Other
       
       *CRITICAL*: 
       - If the description is a grocery store (e.g., Walmart, Kroger), categorize as 'Shopping' or 'Food & Dining'.
       - If gas station, 'Transportation'.
       - If paycheck, 'Salary'.
       - Do NOT invent new categories.
    
    4. RETURN JSON only.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [filePart, { text: prompt }],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          transactions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING, description: "YYYY-MM-DD" },
                description: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                category: { type: Type.STRING, enum: [
                  'Food & Dining', 'Transportation', 'Utilities', 'Entertainment', 
                  'Shopping', 'Health', 'Salary', 'Transfer', 'Other'
                ]},
                type: { type: Type.STRING, enum: ["INCOME", "EXPENSE"] },
              },
              required: ["date", "description", "amount", "category", "type"],
            },
          },
        },
      },
    },
  });

  const text = response.text || "{}";
  const cleanedText = text.replace(/```json/g, '').replace(/```/g, '');
  
  try {
    const json = JSON.parse(cleanedText);
    const transactions = json.transactions || [];
    
    // Perform mathematical aggregation in code to avoid LLM hallucination errors
    const { monthlySummary, topCategories } = processTransactions(transactions);

    return {
      transactions,
      monthlySummary,
      topCategories
    };
  } catch (e) {
    console.error("Failed to parse analysis results", e);
    throw new Error("Failed to parse analysis results");
  }
};

export const getFinancialAdvice = async (data: AdviceRequest): Promise<AdviceResponse> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `
    You are AETHERIUM, a highly advanced tactical financial AI.
    
    MISSION: Analyze spending patterns and provide a tactical plan to meet the user's savings target.
    
    TELEMETRY:
    - Monthly Income: ${data.totalIncome}
    - Monthly Expense: ${data.totalExpense}
    - Current Savings: ${data.currentSavings}
    - TARGET SAVINGS GOAL: ${data.targetSavings}
    
    TOP SPENDING VECTORS:
    ${data.topExpenses.map(e => `- ${e.category}: ${e.amount}`).join('\n')}
    
    DIRECTIVE:
    1. Calculate the gap between Current Savings and Target Savings.
    2. Identify which categories to cut.
    3. Provide precise reduction amounts for specific categories.
    4. Give a brief, encouraging mission briefing.
    
    TONE: Sci-fi, military-grade precision, supportive but direct.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          advice: { type: Type.STRING },
          suggestedCuts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                suggestedReduction: { type: Type.NUMBER },
                reason: { type: Type.STRING },
              },
              required: ["category", "suggestedReduction", "reason"],
            },
          },
        },
        required: ["advice", "suggestedCuts"],
      },
    },
  });

  const text = response.text || "{}";
  const cleanedText = text.replace(/```json/g, '').replace(/```/g, '');

  try {
    return JSON.parse(cleanedText) as AdviceResponse;
  } catch (e) {
    console.error("Failed to parse advice", e);
    throw new Error("Failed to parse advice");
  }
};