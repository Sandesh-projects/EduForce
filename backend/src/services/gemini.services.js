// backend/src/services/gemini.services.js
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import 'dotenv/config'; // Ensure dotenv is configured to load environment variables

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY not found in environment variables. Please set it.");
    // In a production environment, you might want to throw an error or exit differently.
    // For now, we'll let it proceed but expect failures if API key is truly missing.
    // process.exit(1); // Re-consider if you want the server to fail fast without API key
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
        You are an expert educator who creates engaging, natural, and academically sound multiple-choice questions. Your goal is to assess understanding while making learning enjoyable and accessible.

        CRITICAL GUIDELINES:
        1. Write questions in a direct, conversational tone - avoid phrases like "According to the text," "Based on the passage," or "The text states"
        2. Frame questions as if testing real-world knowledge and understanding, not just text comprehension
        3. Make questions engaging and thought-provoking while maintaining academic rigor
        4. Ensure all incorrect options (distractors) are plausible but clearly wrong to someone who understands the concept
        5. Write explanations that enhance learning, not just justify the correct answer
        6. Vary question difficulty to create a balanced assessment experience

        MATHEMATICAL QUESTIONS REQUIREMENT:
        7. **IMPORTANT**: When the content contains mathematical concepts, formulas, calculations, numerical data, or quantitative information, you MUST include mathematical/computational questions alongside theoretical ones
        8. Mathematical questions should test:
           - Problem-solving using formulas or concepts from the text
           - Calculations and numerical reasoning
           - Application of mathematical principles
           - Interpretation of data, graphs, or numerical relationships
           - Conversion between units or formats
        9. Aim for a balanced mix: if content supports it, include at least 30-40% mathematical questions
        10. For mathematical questions, ensure distractors are mathematically plausible but represent common calculation errors or misconceptions

        QUESTION WRITING BEST PRACTICES:
        - Start questions directly with "What," "How," "Why," "Which," "Calculate," "If," etc.
        - Focus on understanding concepts, applications, and relationships rather than memorization
        - Make each question standalone - don't reference "the text" or "the passage"
        - Use clear, concise language appropriate for the subject level
        - Create realistic distractors based on common misconceptions or related concepts
        - For mathematical questions, show the problem clearly and make calculations straightforward
        - Ensure only one option is unambiguously correct

        MATHEMATICAL QUESTION EXAMPLES:
        ✅ "If a car travels at 60 km/h for 2.5 hours, what distance does it cover?"
        ✅ "Calculate the area of a rectangle with length 8 cm and width 5 cm."
        ✅ "What is the compound interest on $1000 at 5% per annum for 3 years?"
        ✅ "If the voltage is 12V and current is 3A, what is the power consumed?"

        Generate exactly ${validatedNumQuestions} distinct multiple-choice questions based on the content provided below.
        Each question must have exactly 4 options with only one correct answer.

        QUESTION TYPE DISTRIBUTION:
        - If content has mathematical/quantitative elements: Include 30-40% mathematical questions, 60-70% theoretical
        - If content is purely theoretical: Focus on conceptual understanding and application
        - Always prioritize variety in question types and difficulty levels

        IMPORTANT: Keep your response concise to avoid truncation. Use shorter explanations (max 2 sentences each).

        Output Format (STRICT JSON - no additional text):
        {
          "quizTitle": "${quizTitleHint}",
          "quizInstructions": "Choose the best answer for each question. Take your time to read carefully.",
          "questions": [
            {
              "id": "q1",
              "questionText": "Direct question without referencing the text?",
              "options": [
                { "id": "q1_optionA", "text": "First plausible option" },
                { "id": "q1_optionB", "text": "Second plausible option" },
                { "id": "q1_optionC", "text": "Third plausible option" },
                { "id": "q1_optionD", "text": "Fourth plausible option" }
              ],
              "correctAnswerId": "q1_optionB",
              "explanation": "Brief explanation (max 2 sentences).",
              "difficulty": "Easy|Medium|Hard",
              "topic": "Specific concept or topic area",
              "questionType": "theoretical|mathematical|applied"
            }
          ]
        }

        DIFFICULTY DISTRIBUTION GUIDE:
        - Easy (30%): Basic definitions, simple recall, fundamental concepts, basic calculations
        - Medium (50%): Application of concepts, analysis, connecting ideas, multi-step calculations
        - Hard (20%): Complex analysis, synthesis, critical thinking, complex problem-solving

        EXAMPLE TRANSFORMATIONS:
        ❌ Poor: "According to the text, what is the primary purpose of a DBMS?"
        ✅ Good: "What is the primary purpose of a Database Management System?"

        ❌ Poor: "Based on the passage, which programming language is mentioned?"
        ✅ Good: "Which programming language is commonly used for web development?"

        ❌ Poor: "The text states that algorithms are important because..."
        ✅ Good: "Why are algorithms fundamental to computer science?"

        ✅ Mathematical: "If a database has 1000 records and each query processes 100 records per second, how long will it take to process all records?"

        Now generate ${validatedNumQuestions} high-quality MCQs based on this content:

        ---
        ${textContent}
        ---

        Remember: 
        - Output ONLY valid JSON with no additional text, comments, or explanations outside the JSON structure
        - Keep all content concise to ensure complete response
        - Include mathematical questions when the content supports them
        - Balance theoretical understanding with practical problem-solving
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
            generationConfig: {
                temperature: 0.3, // Lower temperature for more consistent JSON structure
                topP: 0.9,        // Focus on most probable tokens
                topK: 20,         // Reduced for more focused responses
                maxOutputTokens: 20000, // Increased to prevent truncation
            }
        });

        const response = await result.response;
        let text = response.text();

        // Log the full raw response to identify if truncation is happening at the API level
        console.log("Full Raw Gemini response text:\n", text);

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
            console.error("Problematic JSON string before final cleanup (full content):\n", jsonString);
            throw new Error("Gemini response is not a valid JSON string and could not be sanitized.");
        }

        // Step 3: Remove potential invisible characters that break JSON.parse
        jsonString = jsonString.replace(/[\u0000-\u001F\u007F-\u009F\u00A0\u200B-\u200F\u2028-\u202E\uFEFF]/g, function(char) {
            if (char === '\t' || char === '\n' || char === '\r') {
                return char;
            }
            return '';
        });

        // Step 4: Enhanced JSON repair for truncated responses
        jsonString = jsonString.replace(/,\s*([\]}])/g, '$1'); // Remove trailing commas
        jsonString = jsonString.replace(/([{,]\s*)(\w+):/g, '$1"$2":'); // Quote unquoted keys

        // Check if JSON is truncated and attempt to repair
        if (!jsonString.endsWith('}')) {
            console.log("Detected potentially truncated JSON, attempting repair...");
            
            // Count opening and closing braces to determine truncation level
            const openBraces = (jsonString.match(/{/g) || []).length;
            const closeBraces = (jsonString.match(/}/g) || []).length;
            const openBrackets = (jsonString.match(/\[/g) || []).length;
            const closeBrackets = (jsonString.match(/\]/g) || []).length;
            
            // Attempt to close incomplete structures
            let repairedJson = jsonString;
            
            // If we're in the middle of an object or array, try to close gracefully
            if (repairedJson.lastIndexOf(',') > repairedJson.lastIndexOf('}') && 
                repairedJson.lastIndexOf(',') > repairedJson.lastIndexOf(']')) {
                // Remove trailing comma if it's the last character before we add closing braces
                repairedJson = repairedJson.replace(/,\s*$/, '');
            }
            
            // Close any open brackets first
            for (let i = closeBrackets; i < openBrackets; i++) {
                repairedJson += ']';
            }
            
            // Close any open braces
            for (let i = closeBraces; i < openBraces; i++) {
                repairedJson += '}';
            }
            
            jsonString = repairedJson;
            console.log("JSON repair attempted");
        }

        console.log("Cleaned JSON string (full content):\n", jsonString);

        let mcqsData;
        try {
            mcqsData = JSON.parse(jsonString);
        } catch (parseError) {
            console.error("Failed to parse JSON from Gemini response (after cleanup):", parseError);
            console.error("Problematic JSON string (first 1000 chars):", jsonString.substring(0, 1000));
            
            // Enhanced recovery attempts for common truncation issues
            try {
                console.log("Attempting advanced JSON recovery...");
                
                // Try to find the last complete question
                const questionsMatch = jsonString.match(/"questions":\s*\[(.*)/s);
                if (questionsMatch) {
                    let questionsContent = questionsMatch[1];
                    
                    // Find all complete question objects
                    const questionPattern = /{[^{}]*"id":\s*"q\d+"[^{}]*}/g;
                    const completeQuestions = questionsContent.match(questionPattern) || [];
                    
                    if (completeQuestions.length > 0) {
                        // Reconstruct JSON with only complete questions
                        const reconstructed = {
                            quizTitle: "Generated Quiz",
                            quizInstructions: "Choose the best answer for each question. Take your time to read carefully.",
                            questions: []
                        };
                        
                        // Parse each complete question
                        for (const questionStr of completeQuestions) {
                            try {
                                const question = JSON.parse(questionStr);
                                if (question.id && question.questionText && question.options && question.correctAnswerId) {
                                    reconstructed.questions.push(question);
                                }
                            } catch (qError) {
                                console.log("Skipping malformed question");
                            }
                        }
                        
                        if (reconstructed.questions.length > 0) {
                            console.log(`Successfully recovered ${reconstructed.questions.length} questions`);
                            mcqsData = reconstructed;
                        } else {
                            throw new Error("No complete questions could be recovered from truncated response");
                        }
                    } else {
                        throw new Error("No recognizable question patterns found in truncated response");
                    }
                } else {
                    throw new Error("Questions array not found in response");
                }
            } catch (recoveryError) {
                console.error("Advanced recovery also failed:", recoveryError);
                throw new Error(`Failed to parse Gemini's MCQ response as JSON. Original error: ${parseError.message}. Recovery error: ${recoveryError.message}`);
            }
        }

        // Validate the structure
        if (!mcqsData.questions || !Array.isArray(mcqsData.questions)) {
            throw new Error("Invalid MCQ data structure: missing or invalid questions array");
        }

        // Quality validation and mathematical question tracking
        let mathematicalQuestions = 0;
        for (let i = 0; i < mcqsData.questions.length; i++) {
            const question = mcqsData.questions[i];
            
            // Check for text reference phrases that should be avoided
            const badPhrases = [
                'according to the text',
                'based on the passage',
                'the text states',
                'as mentioned in the text',
                'from the reading',
                'the passage indicates'
            ];
            
            const questionLower = question.questionText.toLowerCase();
            const hasBadPhrase = badPhrases.some(phrase => questionLower.includes(phrase));
            
            if (hasBadPhrase) {
                console.warn(`Question ${i + 1} contains text reference phrase. Consider regenerating for better quality.`);
            }
            
            // Track question types
            if (question.questionType === 'mathematical') {
                mathematicalQuestions++;
            }
            
            // Validate structure
            if (!question.options || question.options.length !== 4) {
                throw new Error(`Question ${i + 1} does not have exactly 4 options`);
            }
            
            if (!question.correctAnswerId) {
                throw new Error(`Question ${i + 1} is missing correctAnswerId`);
            }
        }

        // Log question type distribution
        console.log(`Generated ${mcqsData.questions.length} questions: ${mathematicalQuestions} mathematical, ${mcqsData.questions.length - mathematicalQuestions} theoretical/applied`);

        if (mcqsData.questions.length !== validatedNumQuestions) {
            console.warn(`Gemini generated ${mcqsData.questions.length} questions, but ${validatedNumQuestions} were requested.`);
        }

        return mcqsData;

    } catch (error) {
        console.error('Error calling Gemini API for MCQ generation:', error);
        throw new Error(`Failed to generate MCQs: ${error.message}. Ensure your API key is correct and network is stable.`);
    }
};