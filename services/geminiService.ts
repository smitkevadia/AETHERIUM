
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, AdviceRequest, AdviceResponse, Transaction } from "../types";

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

export const analyzeStatement = async (file: File): Promise<AnalysisResult> => {
  const model = "gemini-2.5-flash";
  const filePart = await fileToGenerativePart(file);

  const prompt = `
    Analyze this bank statement image or document.
    EXTRACT all transactions.
    
    CRITICAL INSTRUCTION FOR CLASSIFICATION (INCOME vs EXPENSE):
    1. Look for mathematical signs: 
       - A '+' sign usually indicates INCOME.
       - A '-' sign usually indicates EXPENSE.
    2. Look for columns: 
       - Amounts in 'Credit' or 'Deposit' columns are INCOME.
       - Amounts in 'Debit' or 'Withdrawal' columns are EXPENSE.
    3. Context clues:
       - 'Salary', 'Dividend', 'Refund', 'Transfer In' are INCOME.
       - 'Purchase', 'Payment', 'Fee', 'Transfer Out' are EXPENSE.
    
    RETURN JSON with an array of transactions.
    Each transaction object must have:
    - date (YYYY-MM-DD format)
    - description (string)
    - amount (number. IMPORTANT: Return the ABSOLUTE POSITIVE VALUE. Do not include the negative sign in the value.)
    - type (string. Strictly "INCOME" or "EXPENSE" based on the signs/columns found.)
    - category (Choose from: 'Food & Dining', 'Transportation', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Salary', 'Transfer', 'Other')
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
                date: { type: Type.STRING },
                description: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                category: { type: Type.STRING },
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
    const transactions: Transaction[] = (json.transactions || []).map((t: any) => ({
      ...t,
      // CRITICAL FIX: Ensure amount is always positive for math logic. 
      // The 'type' field determines if it's added or subtracted.
      amount: Math.abs(t.amount), 
      id: Math.random().toString(36).substr(2, 9),
      isCash: false
    }));
    
    return { transactions };
  } catch (e) {
    console.error("Failed to parse analysis results", e);
    throw new Error("Failed to parse analysis results");
  }
};

export const getFinancialAdvice = async (data: AdviceRequest): Promise<AdviceResponse> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `
    You are a financial advisor with a minimalist, calm, and encouraging tone.
    User Data:
    - Monthly Income: ${data.totalIncome}
    - Monthly Expense: ${data.totalExpense}
    - Current Savings (Net): ${data.currentSavings}
    - TARGET SAVINGS GOAL (Monthly Equivalent): ${data.targetSavings}
    
    Top Expenses:
    ${data.topExpenses.map(e => `- ${e.category}: ${e.amount}`).join('\n')}
    
    Provide actionable advice on how to reach the goal. Suggest specific cuts if necessary.
    Return JSON.
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
            },
          },
        },
      },
    },
  });

  try {
    return JSON.parse(response.text || "{}") as AdviceResponse;
  } catch (e) {
    throw new Error("Failed to parse advice");
  }
};
