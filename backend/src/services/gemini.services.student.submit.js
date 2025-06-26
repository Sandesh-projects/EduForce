// backend/src/services/gemini.services.student.submit.js
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import 'dotenv/config';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY not found in environment variables. Please set it.");
    throw new Error("GEMINI_API_KEY is not set. Cannot perform AI analysis.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // Using gemini-pro for better quality

// Function to safely parse JSON from Gemini's text response
const safeParseJson = (jsonString) => {
    try {
        // Step 1: Remove common markdown code block wrappers if present
        let cleanedString = jsonString.trim();
        if (cleanedString.startsWith('```json') && cleanedString.endsWith('```')) {
            cleanedString = cleanedString.substring(7, cleanedString.length - 3).trim();
        } else if (cleanedString.startsWith('```') && cleanedString.endsWith('```')) { // General code block
            cleanedString = cleanedString.substring(3, cleanedString.length - 3).trim();
        }

        // Step 2: Remove trailing commas before closing brackets/braces (a common JSON linting error from LLMs)
        cleanedString = cleanedString.replace(/,\s*([\]}])/g, '$1');

        return JSON.parse(cleanedString);
    } catch (e) {
        console.error('Failed to parse JSON from AI response:', e.message);
        console.error('Problematic string that caused parsing error:', jsonString);
        throw new Error('AI response is not a valid JSON format.');
    }
};

/**
 * Generates a detailed quiz attempt analysis using Gemini AI.
 * @param {Array} quizQuestions - Array of original quiz questions (including correctAnswerId).
 * @param {Array} studentAnswers - Array of student's submitted answers ({ questionId, selectedOptionId }).
 * @param {number} score - The student's score.
 * @param {number} totalQuestions - Total number of questions in the quiz.
 * @param {boolean} isSuspicious - Flag indicating if proctoring detected suspicious activity.
 * @returns {Object} JSON object with detailed analysis.
 */
export const generateQuizAttemptAnalysis = async (quizQuestions, studentAnswers, score, totalQuestions, isSuspicious, proctoringEvents = []) => {
    if (!quizQuestions || !Array.isArray(quizQuestions) || quizQuestions.length === 0) {
        throw new Error("Quiz questions are required for analysis.");
    }
    if (!studentAnswers || !Array.isArray(studentAnswers)) {
        throw new Error("Student answers are required for analysis.");
    }

    // Map quiz questions for easier lookup and to include correct answers
    const questionMap = new Map();
    quizQuestions.forEach(q => {
        questionMap.set(q.id, {
            questionText: q.questionText,
            options: q.options,
            correctAnswerId: q.correctAnswerId,
            difficulty: q.difficulty,
            topic: q.topic,
            explanation: q.explanation // Include explanation for report
        });
    });

    const detailedFeedback = studentAnswers.map(studentAns => {
        const question = questionMap.get(studentAns.questionId);
        if (!question) {
            console.warn(`Question with ID ${studentAns.questionId} not found in original quiz data.`);
            return null; // Skip if question data is missing
        }
        const selectedOption = question.options.find(opt => opt.id === studentAns.selectedOptionId);
        const correctOption = question.options.find(opt => opt.id === question.correctAnswerId);

        return {
            questionId: studentAns.questionId,
            questionText: question.questionText,
            selectedAnswer: selectedOption ? selectedOption.text : "No answer",
            correctAnswer: correctOption ? correctOption.text : "N/A",
            isCorrect: studentAns.selectedOptionId === question.correctAnswerId,
            explanation: question.explanation,
            difficulty: question.difficulty,
            topic: question.topic,
        };
    }).filter(Boolean); // Remove any null entries

    const percentageScore = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;

    let proctoringFeedback = "No suspicious activity detected.";
    if (isSuspicious) {
        proctoringFeedback = "Suspicious activity was detected during the quiz. Please review the proctoring log.";
        if (proctoringEvents.length > 0) {
            proctoringFeedback += " Events: " + proctoringEvents.map(e => `${e.eventType} at ${new Date(e.timestamp).toLocaleTimeString()}`).join(', ');
        }
    }

    const prompt = `
        You are an intelligent assistant designed to provide comprehensive analysis and feedback on a student's quiz attempt.
        Based on the provided quiz questions, student's answers, score, and any proctoring flags, generate a detailed report in JSON format.

        The report should include:
        1.  **Summary**: Overall performance, score, percentage.
        2.  **Strengths**: Topics or difficulties where the student performed well.
        3.  **Areas for Improvement**: Topics or difficulties where the student struggled, with specific suggestions.
        4.  **Question-level Feedback**: For each question, indicate if the answer was correct/incorrect, the correct answer, and a concise explanation.
        5.  **Proctoring Analysis**: If suspicious activity was detected, provide a summary and recommendation.

        The JSON structure should be:
        {
          "overallSummary": {
            "score": ${score},
            "totalQuestions": ${totalQuestions},
            "percentage": ${percentageScore.toFixed(2)},
            "message": "Excellent performance!" // or "Good effort!", "Needs more practice." etc.
          },
          "strengths": [
            { "topic": "Topic A", "performance": "Strong" },
            // ... more
          ],
          "areasForImprovement": [
            { "topic": "Topic B", "suggestion": "Review concepts on X and Y." },
            // ... more
          ],
          "questionFeedback": [
            // Array of objects from detailedFeedback
          ],
          "proctoringStatus": {
            "isSuspicious": ${isSuspicious},
            "feedback": "${proctoringFeedback}"
          }
        }

        Student's Score: ${score}/${totalQuestions}
        Student's Answers (questionId, selectedOptionId, isCorrect): ${JSON.stringify(studentAnswers)}
        Original Quiz Questions (id, questionText, options, correctAnswerId, difficulty, topic, explanation): ${JSON.stringify(quizQuestions)}
        Proctoring Detected Suspicious Activity: ${isSuspicious}
        Proctoring Events: ${JSON.stringify(proctoringEvents)}
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
        });

        const response = await result.response;
        let text = response.text();

        console.log("Raw Gemini analysis response (start):", text.substring(0, Math.min(text.length, 500)) + (text.length > 500 ? '...' : ''));
        console.log("Raw Gemini analysis response (end):", text.substring(Math.max(0, text.length - 500)) + (text.length > 500 ? '...' : ''));

        // Use the safe JSON parsing function
        let analysisData = safeParseJson(text);
        
        // Ensure questionFeedback is correctly populated by overriding with local detailedFeedback
        analysisData.questionFeedback = detailedFeedback;

        return analysisData;

    } catch (error) {
        console.error('Error calling Gemini API for analysis:', error);
        throw new Error(`Failed to generate quiz analysis: ${error.message}. Ensure your API key is correct and network is stable.`);
    }
};