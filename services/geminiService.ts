
import { GoogleGenAI, Type } from "@google/genai";
import { PlannerResponse } from "../types";

// Always use named parameter for apiKey and use process.env.API_KEY directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateStudyPlan = async (
  subject: string,
  daysUntilExam: number,
  hoursPerDay: number,
  details: string
): Promise<PlannerResponse> => {
  const prompt = `
    I need a study plan for ${subject}.
    I have ${daysUntilExam} days until my goal/exam.
    I can study ${hoursPerDay} hours per day.
    Additional context: ${details}.

    Create a structured study plan.
    Structure the response as a JSON object with a plan name and a daily schedule.
    If the language of the request is Hebrew, please return the content in Hebrew.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            planName: { type: Type.STRING, description: "A catchy title for this study plan" },
            schedule: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING, description: "Day 1, Day 2, or specific date" },
                  topics: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    description: "List of specific topics to cover" 
                  },
                  focusArea: { type: Type.STRING, description: "Main goal for the day" }
                },
                required: ["day", "topics", "focusArea"]
              }
            }
          },
          required: ["planName", "schedule"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as PlannerResponse;
    }
    throw new Error("Empty response from AI");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const quickExplain = async (concept: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Explain the concept "${concept}" simply and clearly in one short paragraph. If the concept is in Hebrew, answer in Hebrew.`,
        });
        return response.text || "Could not generate explanation.";
    } catch (e) {
        console.error(e);
        return "Error connecting to AI assistant.";
    }
}

export const analyzeLectureNotes = async (notes: string): Promise<{ summary: string; tasks: string[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following lecture notes. Provide a concise summary and a list of actionable tasks or study questions derived from the content.
      
      Notes: ${notes}
      
      Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            tasks: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });
    
    if (response.text) {
       return JSON.parse(response.text);
    }
    return { summary: "Could not analyze notes.", tasks: [] };
  } catch (e) {
    console.error(e);
    return { summary: "Error analyzing notes.", tasks: [] };
  }
};

export const parseMoodleContent = async (content: string, isImage: boolean = false, mimeType: string = "image/png"): Promise<any[]> => {
  const prompt = `Analyze this Moodle content (either text or screenshot). 
  Identify all academic assignments/tasks and their due dates.
  
  Return a JSON array of objects:
  - title: The name of the assignment.
  - courseName: The name of the course.
  - dueDate: YYYY-MM-DD format. If only a relative date is given (e.g. "Tomorrow", "In 2 days"), calculate it based on today's date: ${new Date().toLocaleDateString('en-CA')}.
  - priority: "High", "Medium", or "Low" based on the deadline urgency.
  
  If the text is in Hebrew, keep titles in Hebrew.`;

  try {
    const contents = isImage 
      ? { parts: [{ inlineData: { mimeType, data: content } }, { text: prompt }] }
      : prompt + "\n\nContent: " + content;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              courseName: { type: Type.STRING },
              dueDate: { type: Type.STRING },
              priority: { type: Type.STRING, enum: ["Low", "Medium", "High"] }
            },
            required: ["title", "courseName", "dueDate", "priority"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error parsing Moodle content:", error);
    return [];
  }
};

export const getTaskAdvice = async (taskTitle: string, description?: string): Promise<string> => {
   try {
     const response = await ai.models.generateContent({
       model: "gemini-3-flash-preview",
       contents: `I have a task: "${taskTitle}". ${description ? `Details: ${description}` : ''}. 
       Give me 3 steps to start this task effectively. Keep it short.`
     });
     return response.text || "No advice generated.";
   } catch(e) {
     return "Error generating advice.";
   }
}

export const parseScheduleImage = async (base64Image: string, mimeType: string = "image/png"): Promise<any[]> => {
  try {
    const prompt = `Analyze this image of a course schedule/timetable. 
    Extract all the classes/sessions.
    
    Return a JSON array where each object has:
    - courseTitle: The name of the course/subject.
    - type: "Lecture", "Recitation", or "Lab" (guess based on context if not explicit).
    - dayOfWeek: Number 0-6 where 0 is Sunday, 1 is Monday, etc.
    - startTime: HH:MM format (24h).
    - endTime: HH:MM format (24h).
    - location: Room number or location if available, otherwise empty string.
    
    If you see Hebrew days, map them correctly (ראשון=0, שני=1...).
    Ignore headers or non-class text.`;

    const response = await ai.models.generateContent({
      // Use gemini-3-flash-preview for general tasks including image analysis as per guidelines.
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              courseTitle: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["Lecture", "Recitation", "Lab"] },
              dayOfWeek: { type: Type.INTEGER },
              startTime: { type: Type.STRING },
              endTime: { type: Type.STRING },
              location: { type: Type.STRING }
            },
            required: ["courseTitle", "type", "dayOfWeek", "startTime", "endTime"]
          }
        }
      }
    });

    if (response.text) {
      let cleanText = response.text.trim();
      return JSON.parse(cleanText);
    }
    return [];
  } catch (error) {
    console.error("Error parsing schedule image:", error);
    throw error;
  }
};
