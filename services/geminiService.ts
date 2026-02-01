import { GoogleGenAI, Type } from "@google/genai";
import {
  AcademicFile,
  Reminder,
  TimetableEntry,
  UserProfile,
  SemesterResult
} from "../types";

/**
 * Gemini API Key (Vite-compatible)
 */
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("VITE_GEMINI_API_KEY is missing");
}

/**
 * Extracts the base64 string from a Data URL
 */
const getBase64FromDataUrl = (dataUrl: string) => {
  const parts = dataUrl.split(",");
  return parts.length > 1 ? parts[1] : parts[0];
};

/**
 * Chat + multimodal Gemini response
 */
export const getGeminiResponse = async (
  prompt: string,
  contextData: {
    files: AcademicFile[];
    reminders: Reminder[];
    timetable: TimetableEntry[];
    profile: UserProfile | null;
    examResults?: SemesterResult[];
  }
) => {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const profileText = contextData.profile
    ? `Student: ${contextData.profile.name}, College: ${contextData.profile.college}, Year: ${contextData.profile.year}, Sem: ${contextData.profile.semester}`
    : "Profile not set";

  const resultsText = contextData.examResults?.length
    ? `Exam Results:\n${contextData.examResults
        .map(
          (s) =>
            `${s.semesterName}: ${s.results
              .map(
                (r) =>
                  `${r.subjectName}(S1:${r.sessional1}, S2:${r.sessional2}, S3:${r.sessional3}, Final:${r.finalExam})`
              )
              .join("; ")}`
        )
        .join("\n")}`
    : "No exam results recorded";

  const contextMetadata = `
User Profile: ${profileText}
${resultsText}
Current Reminders: ${contextData.reminders
    .map((r) => `${r.title} on ${r.date}`)
    .join(", ")}
Timetable:
${contextData.timetable
    .map((t) => `${t.day}: ${t.subject} (${t.startTime}-${t.endTime})`)
    .join("\n")}
Attached Files: ${contextData.files.map((f) => f.name).join(", ")}
`;

  const parts: any[] = [
    {
      text: `You are UniHub, a college academic assistant.
Rules:
1. Support English and Hinglish.
2. Keep answers short and helpful.
3. Use uploaded files when relevant.

Context:
${contextMetadata}

User Question: ${prompt}`
    }
  ];

  contextData.files.slice(0, 5).forEach((file) => {
    if (file.dataUrl) {
      const mimeType = file.type || "application/octet-stream";
      if (mimeType.startsWith("image/") || mimeType === "application/pdf") {
        parts.push({
          inlineData: {
            mimeType,
            data: getBase64FromDataUrl(file.dataUrl)
          }
        });
      } else if (file.content) {
        parts.push({ text: file.content });
      }
    } else if (file.content) {
      parts.push({ text: file.content });
    }
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts }
    });

    return response.text || "Unable to generate response.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI service error. Please try again later.";
  }
};

/**
 * Extract reminders from files
 */
export const analyzeDataForReminders = async (
  files: AcademicFile[]
): Promise<Reminder[]> => {
  if (files.length === 0) return [];

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const relevantFiles = files
    .filter((f) =>
      ["chat", "notice", "datesheet", "assignment"].includes(f.category)
    )
    .slice(0, 8);

  const parts: any[] = [
    {
      text: `Extract upcoming exams, assignments, or events with dates.
Current Date: ${new Date().toISOString()}`
    }
  ];

  relevantFiles.forEach((file) => {
    if (
      file.dataUrl &&
      (file.type?.startsWith("image/") ||
        file.type === "application/pdf")
    ) {
      parts.push({
        inlineData: {
          mimeType: file.type,
          data: getBase64FromDataUrl(file.dataUrl)
        }
      });
    } else if (file.content) {
      parts.push({ text: file.content });
    }
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              date: { type: Type.STRING },
              type: {
                type: Type.STRING,
                enum: ["exam", "assignment", "event"]
              },
              description: { type: Type.STRING }
            },
            required: ["title", "date", "type"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Reminder Extraction Error:", error);
    return [];
  }
};
