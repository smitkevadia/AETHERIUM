import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, AdviceRequest, AdviceResponse } from "../types";

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
    Analyze this bank statement document. 
    
    1. EXTRACT all transactions with date, description, amount.
    2. CATEGORIZE each transaction intelligently based on the description into exactly ONE of these categories:
       - Food & Dining
       - Transportation
       - Utilities
       - Entertainment
       - Shopping
       - Health
       - Salary
       - Transfer
       - Other
       
       *INSTRUCTION*: Do not use generic names like "Purchase" as a category. If a description is "WALMART", categorize as "Shopping". If "SHELL", categorize as "Transportation".
       
    3. IDENTIFY Transaction Type: INCOME or EXPENSE.
    4. CALCULATE monthly summaries (income, expense, savings).
    5. AGGREGATE top spending categories (Sum of EXPENSE amounts only).
    
    Ensure dates are in ISO format (YYYY-MM-DD).
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
          monthlySummary: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                month: { type: Type.STRING, description: "YYYY-MM" },
                totalIncome: { type: Type.NUMBER },
                totalExpense: { type: Type.NUMBER },
                savings: { type: Type.NUMBER },
              },
              required: ["month", "totalIncome", "totalExpense", "savings"],
            },
          },
          topCategories: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                amount: { type: Type.NUMBER },
              },
              required: ["category", "amount"],
            },
          },
        },
        required: ["transactions", "monthlySummary", "topCategories"],
      },
    },
  });

  const text = response.text || "{}";
  // Clean markdown if present
  const cleanedText = text.replace(/```json/g, '').replace(/```/g, '');
  
  try {
    return JSON.parse(cleanedText) as AnalysisResult;
  } catch (e) {
    console.error("Failed to parse JSON", e);
    throw new Error("Failed to parse analysis results");
  }
};

export const getFinancialAdvice = async (data: AdviceRequest): Promise<AdviceResponse> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `
    You are a futuristic financial advisor AI (System Name: CREDITS). The user wants to optimize their savings.
    
    Current Financial State:
    - Total Monthly Income: ${data.totalIncome}
    - Total Monthly Expense: ${data.totalExpense}
    - Current Savings: ${data.currentSavings}
    - User's Target Savings: ${data.targetSavings}
    
    Top Spending Categories:
    ${data.topExpenses.map(e => `- ${e.category}: ${e.amount}`).join('\n')}
    
    Provide specific, actionable advice on where to cut costs to meet the target savings.
    Calculate necessary reductions.
    
    Tone: Sci-fi, precise, tactical, encouraging.
    Return the response in JSON format.
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
                suggestedReduction: { type: Type.NUMBER, description: "Amount to reduce by" },
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
    console.error("Failed to parse JSON", e);
    throw new Error("Failed to parse advice");
  }
};
