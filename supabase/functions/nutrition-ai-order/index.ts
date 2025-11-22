import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nutritionGoals, currentIntake, userGoal, preferences } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Calculate remaining macros needed
    const remaining = {
      calories: nutritionGoals.calories - currentIntake.calories,
      protein: nutritionGoals.protein - currentIntake.protein,
      carbs: nutritionGoals.carbs - currentIntake.carbs,
      fats: nutritionGoals.fats - currentIntake.fats,
    };

    const systemPrompt = `You are a nutrition AI assistant helping users order healthy meals from Lieferando (German food delivery service). 
You provide specific restaurant and dish recommendations based on their nutrition needs.

Current situation:
- User goal: ${userGoal}
- Remaining calories needed: ${remaining.calories} kcal
- Remaining protein needed: ${remaining.protein}g
- Remaining carbs needed: ${remaining.carbs}g
- Remaining fats needed: ${remaining.fats}g

You MUST respond with a JSON array of meal recommendations. Each recommendation must have this exact structure:
{
  "restaurantType": "Type of restaurant (e.g., Mediterranean Grill, Asian Fusion)",
  "dishName": "Specific dish name",
  "description": "Brief description of the dish",
  "calories": 600,
  "protein": 50,
  "carbs": 55,
  "fats": 20,
  "reasoning": "Why this fits their goals",
  "ingredients": ["ingredient1", "ingredient2", "ingredient3", "ingredient4", "ingredient5"]
}

Provide 3-4 recommendations. Focus on meals available on typical Lieferando restaurants in Germany. Include key ingredients list for each dish (5-8 main ingredients).

RESPOND ONLY WITH THE JSON ARRAY, NO OTHER TEXT.`;

    const userPrompt = `I need to order food from Lieferando but want to stay on track with my nutrition goals. 
I still need ${remaining.calories} calories, ${remaining.protein}g protein, ${remaining.carbs}g carbs, and ${remaining.fats}g fats today.
My goal is: ${userGoal}. ${preferences ? `My preferences: ${preferences}` : ''}

What should I order?`;

    console.log('Calling Lovable AI for nutrition recommendations...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const rawContent = data.choices[0].message.content;
    
    let meals;
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(rawContent);
      // Handle both direct array and object with array property
      meals = Array.isArray(parsed) ? parsed : (parsed.meals || parsed.recommendations || []);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', e);
      // Fallback: return raw content
      meals = [];
    }

    console.log('AI recommendations generated successfully', meals.length, 'meals');

    return new Response(
      JSON.stringify({ 
        meals,
        remaining,
        rawContent: meals.length === 0 ? rawContent : undefined,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in nutrition-ai-order:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
