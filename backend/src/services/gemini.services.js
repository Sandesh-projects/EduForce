// src/services/gemini.services.js
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import 'dotenv/config'; // Ensure dotenv is configured to load environment variables

// Access your API key as an environment variable
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY not found in environment variables. Please set it.");
  // In a real application, you might want to throw an error or handle this more robustly
  process.exit(1); // Exit if API key is not set
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// For text-only input, use the gemini-pro model
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

/**
 * Generates Multiple Choice Questions (MCQs) from given text using the Gemini API.
 * The response is specifically requested in a structured JSON format.
 * @param {string} textContent - The textual content from which to generate MCQs.
 * @param {number} [numQuestions=5] - The desired number of MCQs to generate (min 1, max 25). Defaults to 5.
 * @returns {Promise<object>} - A promise that resolves with the generated MCQs in JSON format.
 */
export const generateMCQsFromText = async (textContent, numQuestions = 5) => {
  if (!textContent || textContent.trim().length === 0) {
    throw new Error('No text content provided for MCQ generation.');
  }

  // Input validation for numQuestions
  let validatedNumQuestions = parseInt(numQuestions, 10);
  if (isNaN(validatedNumQuestions) || validatedNumQuestions < 1) {
    validatedNumQuestions = 1;
    console.warn(`Invalid number of questions requested. Defaulting to minimum of 1.`);
  } else if (validatedNumQuestions > 25) {
    validatedNumQuestions = 25;
    console.warn(`Number of questions exceeds maximum. Capping at 25.`);
  }

  // Construct a detailed prompt for Gemini to ensure structured JSON output.
  const prompt = `
    You are an expert educator designed to create engaging and effective multiple-choice questions (MCQs).
    Generate exactly ${validatedNumQuestions} distinct multiple-choice questions (MCQs) in JSON format based on the following text.
    Ensure each question has 4 options, only one of which is correct.
    For each question, provide a unique ID, the question text, an array of options (each with an ID and text), the correctAnswerId (referencing the correct option's ID), a brief explanation, its difficulty level (Easy, Medium, Hard), and the specific topic it covers.

    The overall JSON structure should be:
    {
      "quizTitle": "A concise title for the quiz based on the content",
      "quizInstructions": "Answer carefully based on the provided text.",
      "questions": [
        {
          "id": "unique_question_id_1",
          "questionText": "Your question here?",
          "options": [
            { "id": "option_id_1a", "text": "Option A text" },
            { "id": "option_id_1b", "text": "Option B text" },
            { "id": "option_id_1c", "text": "Option C text" },
            { "id": "option_id_1d", "text": "Option D text" }
          ],
          "correctAnswerId": "option_id_1b",
          "explanation": "Brief explanation for the correct answer.",
          "difficulty": "Easy" | "Medium" | "Hard",
          "topic": "Specific topic or concept covered by the question"
        }
        // ... more questions
      ]
    }

    Make sure the entire output is a valid JSON object. Do NOT include any introductory or concluding text outside the JSON.

    Text content to generate MCQs from:
    ---
    ${textContent}
    ---
  `;

  try {
    const result = await model.generateContent(prompt, {
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    });

    const response = await result.response;
    const text = response.text();

    const jsonString = text.replace(/```json\n|```/g, '').trim();

    // Console logs for debugging (can be removed in production)
    console.log("Raw Gemini response text (first 500 chars):", text.substring(0, 500));
    console.log("Parsed JSON string (first 500 chars):", jsonString.substring(0, 500));


    try {
      const mcqsData = JSON.parse(jsonString);
      // Optional: Add a check if the number of questions generated matches requested
      if (mcqsData.questions && mcqsData.questions.length !== validatedNumQuestions) {
        console.warn(`Gemini generated ${mcqsData.questions.length} questions, but ${validatedNumQuestions} were requested.`);
      }
      return mcqsData;
    } catch (parseError) {
      console.error("Failed to parse JSON from Gemini response:", parseError);
      console.error("Problematic JSON string:", jsonString);
      throw new Error("Failed to parse Gemini's MCQ response as JSON. Please ensure Gemini outputs valid JSON.");
    }

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error(`Failed to generate MCQs: ${error.message}. Ensure your API key is correct and network is stable.`);
  }
};