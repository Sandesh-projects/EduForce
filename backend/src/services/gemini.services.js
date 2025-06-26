// backend/src/services/gemini.services.js
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import 'dotenv/config';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY not found in environment variables. Please set it.");
    // In a production environment, you might want to throw an error or exit differently.
    // For now, we'll let it proceed but expect failures if API key is truly missing.
    // process.exit(1); // Re-consider if you want the server to fail fast without API key
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export const generateMCQsFromText = async (textContent, numQuestions = 5, subject = '', userProvidedTopic = '') => {
    if (!textContent || textContent.trim().length === 0) {
        throw new Error('No text content provided for MCQ generation.');
    }

    let validatedNumQuestions = parseInt(numQuestions, 10);
    if (isNaN(validatedNumQuestions) || validatedNumQuestions < 1) {
        validatedNumQuestions = 1;
        console.warn(`Invalid number of questions requested. Defaulting to minimum of 1.`);
    } else if (validatedNumQuestions > 25) {
        validatedNumQuestions = 25;
        console.warn(`Number of questions exceeds maximum. Capping at 25.`);
    }

    const quizTitleHint = (subject || userProvidedTopic)
        ? `A concise title for a quiz related to '${subject || 'General'}' on the topic of '${userProvidedTopic || 'the provided text'}'`
        : `A concise title for the quiz based on the content`;

    const prompt = `
        You are an expert educator designed to create engaging and effective multiple-choice questions (MCQs).
        Generate exactly ${validatedNumQuestions} distinct multiple-choice questions (MCQs) in JSON format based on the following text.
        Ensure each question has 4 options, only one of which is correct.
        For each question, provide a unique ID, the question text, an array of options (each with an ID and text), the correctAnswerId (referencing the correct option's ID), a brief explanation, its difficulty level (Easy, Medium, Hard), and the specific topic it covers.

        The overall JSON structure should be:
        {
          "quizTitle": "${quizTitleHint}",
          "quizInstructions": "Answer carefully based on the provided text.",
          "questions": [
            {
              "id": "q1", // Use simpler IDs like q1, q2
              "questionText": "Your question here?",
              "options": [
                { "id": "q1_optionA", "text": "Option A text" }, // Use qID_optionLetter for clarity
                { "id": "q1_optionB", "text": "Option B text" },
                { "id": "q1_optionC", "text": "Option C text" },
                { "id": "q1_optionD", "text": "Option D text" }
              ],
              "correctAnswerId": "q1_optionB",
              "explanation": "Brief explanation for the correct answer.",
              "difficulty": "Medium",
              "topic": "Specific topic or concept covered by the question"
            }
            // ... more questions
          ]
        }

        Make sure the entire output is a valid JSON object. Do NOT include any introductory or concluding text outside the JSON.
        Important: The quizTitle should be automatically derived by you from the text content and any provided subject/topic hints.

        Text content to generate MCQs from:
        ---
        ${textContent}
        ---
    `;

    try {
        const result = await model.generateContent({
            contents: [{ parts: [{ text: prompt }] }],
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ],
            // generationConfig: {
            //     responseMimeType: "application/json", // This is for specific models and APIs, might not work directly for gemini-1.5-flash through this client library syntax
            //     responseSchema: { ... your JSON schema definition if available ... } // Advanced feature
            // }
        });

        const response = await result.response;
        let text = response.text();

        console.log("Raw Gemini response text (start):", text.substring(0, Math.min(text.length, 500)) + (text.length > 500 ? '...' : ''));
        console.log("Raw Gemini response text (end):", text.substring(Math.max(0, text.length - 500)) + (text.length > 500 ? '...' : ''));


        let jsonString = text;

        // Step 1: Try to extract JSON from markdown code block first
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
            jsonString = jsonMatch[1];
        }

        jsonString = jsonString.trim();

        // Step 2: Aggressively remove any leading/trailing characters outside the main JSON object
        // This is a more robust way to find the actual JSON content
        const firstBraceIndex = jsonString.indexOf('{');
        const lastBraceIndex = jsonString.lastIndexOf('}');

        if (firstBraceIndex !== -1 && lastBraceIndex !== -1 && lastBraceIndex > firstBraceIndex) {
            jsonString = jsonString.substring(firstBraceIndex, lastBraceIndex + 1);
        } else {
            // If we can't even find a valid brace pair, it's severely malformed
            console.error("Gemini response does not contain a discernible JSON object after initial markdown strip.");
            console.error("Problematic JSON string before final cleanup:", jsonString);
            throw new Error("Gemini response is not a valid JSON string and could not be sanitized.");
        }

        // Step 3: Remove potential invisible characters that break JSON.parse, excluding valid whitespace
        // This regex targets characters that are not valid in JSON strings (control characters, etc.)
        // but explicitly allows common whitespace like tab, newline, carriage return.
        // It also handles Unicode non-breaking space (U+00A0) and other common problematic non-printable chars.
        jsonString = jsonString.replace(/[\u0000-\u001F\u007F-\u009F\u00A0\u200B-\u200F\u2028-\u202E\uFEFF]/g, function(char) {
            if (char === '\t' || char === '\n' || char === '\r') {
                return char;
            }
            return '';
        });

        // Add a check for trailing commas or other common syntax errors that might slip through
        // This is a heuristic and might not catch all cases, but can help with common LLM mistakes
        // For instance, removing a trailing comma before a closing bracket/brace
        jsonString = jsonString.replace(/,\s*([\]}])/g, '$1');


        console.log("Cleaned JSON string (start):", jsonString.substring(0, Math.min(jsonString.length, 500)) + (jsonString.length > 500 ? '...' : ''));
        console.log("Cleaned JSON string (end):", jsonString.substring(Math.max(0, jsonString.length - 500)) + (jsonString.length > 500 ? '...' : ''));

        let mcqsData;
        try {
            mcqsData = JSON.parse(jsonString);
        } catch (parseError) {
            console.error("Failed to parse JSON from Gemini response:", parseError);
            console.error("Problematic JSON string (full content):\n", jsonString); // Log the full string
            throw new Error("Failed to parse Gemini's MCQ response as JSON. Please ensure Gemini outputs valid JSON.");
        }

        if (mcqsData.questions && mcqsData.questions.length !== validatedNumQuestions) {
            console.warn(`Gemini generated ${mcqsData.questions.length} questions, but ${validatedNumQuestions} were requested.`);
        }
        return mcqsData;

    } catch (error) {
        console.error('Error calling Gemini API:', error);
        throw new Error(`Failed to generate MCQs: ${error.message}. Ensure your API key is correct and network is stable.`);
    }
};