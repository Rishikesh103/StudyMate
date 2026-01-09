import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fallback mock data generator for testing
function generateMockQuiz(subject: string, topic: string) {
  const mockQuestions = [
    {
      id: "q1",
      type: "mcq",
      question: `What is the fundamental concept of ${topic}?`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: "Option A",
      explanation: "This is the correct answer because it aligns with the core definition.",
    },
    {
      id: "q2",
      type: "mcq",
      question: `How does ${topic} apply to ${subject}?`,
      options: ["Application 1", "Application 2", "Application 3", "Application 4"],
      correctAnswer: "Application 2",
      explanation: "This application directly relates to the principles we discussed.",
    },
    {
      id: "q3",
      type: "mcq",
      question: `Which of the following is an example of ${topic}?`,
      options: ["Example A", "Example B", "Example C", "Example D"],
      correctAnswer: "Example C",
      explanation: "This is the most accurate example in the context of ${subject}.",
    },
    {
      id: "q4",
      type: "mcq",
      question: `What is the primary advantage of ${topic}?`,
      options: ["Advantage 1", "Advantage 2", "Advantage 3", "Advantage 4"],
      correctAnswer: "Advantage 3",
      explanation: "This advantage is most significant for practical applications.",
    },
    {
      id: "q5",
      type: "mcq",
      question: `How would you approach a problem involving ${topic} in ${subject}?`,
      options: ["Method A", "Method B", "Method C", "Method D"],
      correctAnswer: "Method B",
      explanation: "This method is the most efficient and reliable approach.",
    },
  ];
  return mockQuestions;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, content, subject, topic } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    
    // Log incoming request
    console.log(`[AI-STUDY] Received ${type} request for ${subject} - ${topic}`);
    
    if (!GEMINI_API_KEY) {
      console.warn("[AI-STUDY] GEMINI_API_KEY not configured, using mock data for testing");
      
      // Return mock data for testing if no API key
      if (type === "generate_quiz") {
        const mockQuiz = generateMockQuiz(subject, topic);
        return new Response(
          JSON.stringify({ result: mockQuiz }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "generate_quiz") {
      systemPrompt = `You are an expert educational quiz generator. Generate quiz questions that test understanding, not just memorization. Include a mix of difficulty levels.`;
      userPrompt = `Generate 5 multiple choice quiz questions about ${subject} - ${topic}. 
      
Return a JSON array with this exact structure:
[
  {
    "id": "q1",
    "type": "mcq",
    "question": "The question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "The correct option text",
    "explanation": "Brief explanation of why this is correct"
  }
]

Make questions progressively harder. Include conceptual questions, not just factual recall.`;
    } else if (type === "extract_syllabus") {
      systemPrompt = `You are an expert at analyzing educational content and extracting structured syllabus information.`;
      userPrompt = `Analyze this study material content and extract a structured syllabus:

${content}

Return a JSON object with this structure:
{
  "subject": "Main subject name",
  "chapters": [
    {
      "name": "Chapter name",
      "topics": ["Topic 1", "Topic 2"]
    }
  ],
  "suggestedQuizTopics": ["Topic that would make good quiz questions"]
}`;
    } else if (type === "revision_suggestions") {
      systemPrompt = `You are an AI learning assistant that helps students identify what to revise based on spaced repetition principles.`;
      userPrompt = `Based on these study sessions, suggest topics that need revision:

${content}

Consider:
- Topics not studied recently (forgetting curve)
- Topics with lower mastery scores
- Related topics that build on each other

Return a JSON array:
[
  {
    "topicName": "Topic name",
    "subject": "Subject",
    "priority": "high/medium/low",
    "reason": "Why this needs revision",
    "forgottenScore": 0-100
  }
]`;
    } else {
      throw new Error("Invalid request type");
    }

    console.log(`[AI-STUDY] Processing ${type} request for ${subject || 'general'}`);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        system_instruction: {
          parts: {
            text: systemPrompt
          }
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AI-STUDY] AI gateway error:", response.status, errorText);
      
      // Fallback to mock data on API errors for testing
      if (type === "generate_quiz") {
        console.warn("[AI-STUDY] Using mock data fallback due to API error");
        const mockQuiz = generateMockQuiz(subject, topic);
        return new Response(
          JSON.stringify({ result: mockQuiz }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content || "";
    
    // Extract JSON from the response
    const jsonMatch = aiContent.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    let result;
    
    if (jsonMatch) {
      try {
        result = JSON.parse(jsonMatch[0]);
        console.log(`[AI-STUDY] Successfully parsed AI response`);
      } catch (e) {
        console.error("[AI-STUDY] Failed to parse AI response as JSON:", e);
        console.error("[AI-STUDY] Raw content:", aiContent);
        
        // Fallback to mock data if parsing fails
        if (type === "generate_quiz") {
          result = generateMockQuiz(subject, topic);
        } else {
          result = aiContent;
        }
      }
    } else {
      console.warn("[AI-STUDY] No JSON found in AI response");
      
      // Fallback to mock data if no JSON found
      if (type === "generate_quiz") {
        result = generateMockQuiz(subject, topic);
      } else {
        result = aiContent;
      }
    }

    console.log(`[AI-STUDY] Successfully processed ${type} request`);

    return new Response(
      JSON.stringify({ result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[AI-STUDY] Edge function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
