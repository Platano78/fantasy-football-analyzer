/**
 * Netlify Function: AI DeepSeek Proxy
 * 
 * Provides secure server-side access to DeepSeek AI for fantasy football analysis
 * as part of the AI fallback chain (Claude → Gemini → DeepSeek → Offline)
 */

import type { Handler } from '@netlify/functions';

interface DeepSeekRequest {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

interface DeepSeekResponse {
  analysis: string;
  provider: 'deepseek';
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
    const requestData: DeepSeekRequest = JSON.parse(event.body || '{}');
    
    if (!requestData.prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Prompt is required' }),
      };
    }

    console.log('🤖 Processing DeepSeek AI request for fantasy football analysis');

    // Check for DeepSeek API configuration
    const deepSeekApiKey = process.env.DEEPSEEK_API_KEY;
    const deepSeekApiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
    
    if (!deepSeekApiKey) {
      console.error('❌ DEEPSEEK_API_KEY not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'DeepSeek API not configured',
          success: false 
        }),
      };
    }

    // Make request to DeepSeek API
    const deepSeekResponse = await fetch(deepSeekApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepSeekApiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a fantasy football AI assistant. Provide helpful, actionable advice in a structured format suitable for fantasy football decision making.'
          },
          {
            role: 'user',
            content: requestData.prompt
          }
        ],
        temperature: requestData.temperature || 0.7,
        max_tokens: requestData.maxTokens || 2000,
      }),
    });

    if (!deepSeekResponse.ok) {
      const errorText = await deepSeekResponse.text();
      console.error('❌ DeepSeek API error:', errorText);
      
      return {
        statusCode: deepSeekResponse.status,
        headers,
        body: JSON.stringify({
          error: `DeepSeek API error: ${deepSeekResponse.statusText}`,
          success: false,
        }),
      };
    }

    const deepSeekData = await deepSeekResponse.json();
    
    // Extract response text
    const analysisText = deepSeekData?.choices?.[0]?.message?.content || 'No analysis generated';

    const response: DeepSeekResponse = {
      analysis: analysisText,
      provider: 'deepseek',
      timestamp: new Date().toISOString(),
      success: true,
    };

    console.log('✅ DeepSeek AI analysis completed successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };

  } catch (error) {
    console.error('❌ DeepSeek proxy function error:', error);
    
    const errorResponse: DeepSeekResponse = {
      analysis: 'Error processing request',
      provider: 'deepseek',
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