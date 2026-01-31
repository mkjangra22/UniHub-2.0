
import { GoogleGenAI, Type } from "@google/genai";
import { AcademicFile, Reminder, TimetableEntry, UserProfile, SemesterResult } from "../types";

/**
 * Extracts the base64 string from a Data URL
 */
const getBase64FromDataUrl = (dataUrl: string) => {
  const parts = dataUrl.split(',');
  return parts.length > 1 ? parts[1] : parts[0];
};

/**
 * Normal chat response with Hinglish and English support.
 * Now supports multimodal input (reading PDFs/Images/Text files).
 */
export const getGeminiResponse = async (
  prompt: string, 
  contextData: { 
    files: AcademicFile[], 
    reminders: Reminder[], 
    timetable: TimetableEntry[],
    profile: UserProfile | null,
    examResults?: SemesterResult[]
  }
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const profileText = contextData.profile 
    ? `Student: ${contextData.profile.name}, College: ${contextData.profile.college}, Year: ${contextData.profile.year}, Sem: ${contextData.profile.semester}`
    : 'Profile not set';

  const resultsText = contextData.examResults?.length 
    ? `Exam Results: ${contextData.examResults.map(s => `${s.semesterName}: ${s.results.map(r => `${r.subjectName}(S1:${r.sessional1}, S2:${r.sessional2}, S3:${r.sessional3}, Final:${r.finalExam})`).join('; ')}`).join('\n')}`
    : 'No exam results recorded';

  // Construct text context for metadata
  const contextMetadata = `
    User Profile: ${profileText}
    ${resultsText}
    Current Reminders: ${contextData.reminders.map(r => `${r.title} on ${r.date}`).join(', ')}
    Timetable: ${contextData.timetable.map(t => `${t.day}: ${t.subject} (${t.startTime}-${t.endTime})`).join('\n')}
    Attached Files list: ${contextData.files.map(f => f.name).join(', ')}
  `;

  // Prepare parts for multimodal content
  // We include the text context and the user's prompt
  const parts: any[] = [
    { text: `System Instruction: You are UniHub, a college academic assistant. 
      Rules:
      1. Support English and Hinglish.
      2. Keep responses short and helpful.
      3. Use data from the attached files/parts to answer questions about notices, chats, or datesheets.
      4. If a file is a PDF or Image, "look" at it to extract dates, subjects, or instructions.
      
      Context:\n${contextMetadata}\n\nUser Question: ${prompt}` }
  ];

  // Add the most relevant/recent files as inlineData parts to avoid payload limits
  // We prioritize the last 5 files to stay within token/size limits
  const relevantFiles = contextData.files.slice(0, 5);
  
  relevantFiles.forEach(file => {
    if (file.dataUrl) {
      const mimeType = file.type || 'application/octet-stream';
      // Gemini supports image/* and application/pdf
      if (mimeType.startsWith('image/') || mimeType === 'application/pdf') {
        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: getBase64FromDataUrl(file.dataUrl)
          }
        });
      } else if (file.content) {
        // For text files or snippets
        parts.push({ text: `File Name: ${file.name}\nContent: ${file.content}` });
      }
    } else if (file.content) {
      parts.push({ text: `File Name: ${file.name}\nContent: ${file.content}` });
    }
  });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
    });

    return response.text || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI connecting error. Make sure files aren't too large and your API key is valid.";
  }
};

/**
 * Scans all uploaded data to find deadlines and exams using multimodal capabilities
 */
export const analyzeDataForReminders = async (files: AcademicFile[]): Promise<Reminder[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  if (files.length === 0) return [];

  // We only send the most relevant categories for reminder extraction
  const relevantFiles = files
    .filter(f => ['chat', 'notice', 'datesheet', 'assignment'].includes(f.category))
    .slice(0, 8); // Limit to 8 files

  const parts: any[] = [
    { text: `Analyze these college documents, images, and chats to find all upcoming tests, assignment deadlines, and events. 
      Return only new reminders that have a specific date.
      Current Date: ${new Date().toISOString()}` }
  ];

  relevantFiles.forEach(file => {
    if (file.dataUrl && (file.type?.startsWith('image/') || file.type === 'application/pdf')) {
      parts.push({
        inlineData: {
          mimeType: file.type,
          data: getBase64FromDataUrl(file.dataUrl)
        }
      });
    } else if (file.content) {
      parts.push({ text: `Content from ${file.name}:\n${file.content}` });
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
              title: { type: Type.STRING, description: "Short title of the event or deadline" },
              date: { type: Type.STRING, description: "ISO Date string" },
              type: { type: Type.STRING, enum: ["exam", "assignment", "event"] },
              description: { type: Type.STRING, description: "Which file or chat was this found in?" }
            },
            required: ["title", "date", "type"]
          }
        }
      }
    });

    const text = response.text || "[]";
    try {
      return JSON.parse(text);
    } catch {
      return [];
    }
  } catch (error) {
    console.error("Reminder Extraction Error:", error);
    return [];
  }
};
