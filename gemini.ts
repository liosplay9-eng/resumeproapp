import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const geminiService = {
  generateResumeContent: async (userData: any) => {
    const prompt = `Generate a professional, ATS-friendly resume content in JSON format for the following user data: ${JSON.stringify(userData)}. 
    Include professional summaries, formatted experience descriptions with bullet points, and categorized skills.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            experience: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  role: { type: Type.STRING },
                  company: { type: Type.STRING },
                  period: { type: Type.STRING },
                  achievements: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  },

  analyzeAtsScore: async (resumeText: string, jobDescription?: string) => {
    const prompt = `Analyze this resume and provide an ATS score (0-100) and improvement suggestions. ${jobDescription ? `Compare it against this job description: ${jobDescription}` : ''}
    Resume: ${resumeText}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  },

  generateCoverLetter: async (userData: any, jobInfo: string) => {
    const prompt = `Write a compelling cover letter for: ${jobInfo}. Using this user data: ${JSON.stringify(userData)}.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    return response.text;
  },

  getInterviewPrep: async (role: string) => {
    const prompt = `Generate top 10 interview questions and professional answers for the role: ${role}. Include HR, Technical, and Behavioral questions.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              answer: { type: Type.STRING },
              category: { type: Type.STRING }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  }
};
