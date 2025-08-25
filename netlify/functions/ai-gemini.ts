/**
 * Netlify Function: AI Gemini Proxy
 * 
 * Provides secure server-side access to Gemini AI for fantasy football analysis
 * as part of the AI fallback chain (Claude → Gemini → DeepSeek → Offline)
 */

import type { Handler } from '@netlify/functions';

interface GeminiRequest {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

interface GeminiResponse {
  analysis: string;
  provider: 'gemini';
  timestamp: string;
  success: boolean;
  error?: string;
}

export const handler: Handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse request
    const requestData: GeminiRequest = JSON.parse(event.body || '{}');
    
    if (!requestData.prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Prompt is required' }),
      };
    }

    console.log('🤖 Processing Gemini AI request for fantasy football analysis');

    // Check for Gemini API key
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      console.error('❌ GEMINI_API_KEY not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Gemini API not configured',
          success: false 
        }),
      };
    }

    // Make request to Gemini API
    const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${geminiApiKey}`,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a fantasy football AI assistant. Analyze this request and provide helpful, actionable advice in a structured format suitable for fantasy football decision making.\n\n${requestData.prompt}`
          }]
        }],
        generationConfig: {
          temperature: requestData.temperature || 0.7,
          maxOutputTokens: requestData.maxTokens || 2000,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('❌ Gemini API error:', errorText);
      
      return {
        statusCode: geminiResponse.status,
        headers,
        body: JSON.stringify({
          error: `Gemini API error: ${geminiResponse.statusText}`,
          success: false,
        }),
      };
    }

    const geminiData = await geminiResponse.json();
    
    // Extract response text
    const analysisText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || 'No analysis generated';

    const response: GeminiResponse = {
      analysis: analysisText,
      provider: 'gemini',
      timestamp: new Date().toISOString(),
      success: true,
    };

    console.log('✅ Gemini AI analysis completed successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };

  } catch (error) {
    console.error('❌ Gemini proxy function error:', error);
    
    const errorResponse: GeminiResponse = {
      analysis: 'Error processing request',
      provider: 'gemini',
      timestamp: new Date().toISOString(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(errorResponse),
    };
  }
};