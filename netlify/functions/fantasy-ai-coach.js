// Netlify Function: Fantasy AI Coach (Cloud Fallback)
// Provides Gemini Enterprise AI coaching as fallback to local Gemini Advanced

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Fantasy Football Prompt Engineering Templates
const FANTASY_PROMPTS = {
  draft_analysis: `You are an expert fantasy football draft analyst. Analyze the current draft situation and provide strategic recommendations.

Context: {context}
Query: {query}

Provide analysis with:
1. Position tier analysis and scarcity assessment
2. Value-based recommendations for current picks
3. Risk factors and injury concerns
4. Strategy adjustments based on league settings
5. Specific player recommendations with reasoning

Format your response with clear sections and actionable insights.`,

  trade_evaluation: `You are a fantasy football trade analyzer. Evaluate the proposed trade scenario with comprehensive analysis.

Context: {context}
Query: {query}

Analyze and provide:
1. Fair value assessment for both sides
2. Roster construction impact
3. Schedule strength analysis
4. Risk/reward evaluation
5. Counter-offer suggestions if trade is unfavorable

Be objective and consider both short-term and playoff implications.`,

  lineup_optimization: `You are a fantasy football lineup optimizer. Help optimize the weekly lineup based on matchups and projections.

Context: {context}
Query: {query}

Provide recommendations for:
1. Start/sit decisions with confidence levels
2. Matchup analysis and game script expectations
3. Weather and injury considerations
4. Ceiling vs floor analysis for each position
5. Flex position optimization

Focus on maximizing weekly scoring potential.`,

  player_analysis: `You are a fantasy football player analyst. Provide comprehensive player evaluation and outlook.

Context: {context}
Query: {query}

Analyze the player with:
1. Current fantasy value and trend analysis
2. Target share, snap count, and usage patterns
3. Schedule analysis and upcoming matchups
4. Injury history and durability concerns
5. Rest-of-season outlook and playoff relevance

Provide both short-term and long-term perspectives.`,

  general_advice: `You are an expert fantasy football advisor. Provide strategic guidance based on the user's situation.

Context: {context}
Query: {query}

Offer advice considering:
1. League format and scoring system
2. Current roster construction
3. Season phase (draft, early season, playoffs)
4. Risk tolerance and team needs
5. Waiver wire and trade opportunities

Tailor advice to the specific context and user preferences.`
};

// Gemini Enterprise Configuration
const createGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in environment variables');
    throw new Error('Gemini API key not configured');
  }

  return new GoogleGenerativeAI(apiKey);
};

// Enhanced prompt engineering for fantasy football
const buildFantasyPrompt = (request) => {
  const { type = 'general_advice', context = {}, query } = request;
  
  const basePrompt = FANTASY_PROMPTS[type] || FANTASY_PROMPTS.general_advice;
  
  // Build context string
  const contextString = [
    context.scoringSystem ? `Scoring: ${context.scoringSystem.toUpperCase()}` : '',
    context.leagueSettings ? `League: ${JSON.stringify(context.leagueSettings)}` : '',
    context.currentRound ? `Draft Round: ${context.currentRound}` : '',
    context.draftedPlayers ? `Drafted Players: ${context.draftedPlayers.length}` : '',
    context.players ? `Available Players: ${context.players.length}` : '',
    context.userPreferences ? `Preferences: ${JSON.stringify(context.userPreferences)}` : ''
  ].filter(Boolean).join(' | ');

  return basePrompt
    .replace('{context}', contextString)
    .replace('{query}', query);
};

// Extract structured analysis from AI response
const extractAnalysis = (response, requestType) => {
  const analysis = {};

  // Extract player recommendations
  const playerMatches = response.match(/(?:recommend|suggest|target|consider)[^\n]*?([A-Z][a-z]+ [A-Z][a-z]+)/gi);
  if (playerMatches) {
    analysis.playerRecommendations = playerMatches.slice(0, 5).map(match => ({
      name: match.match(/([A-Z][a-z]+ [A-Z][a-z]+)/)[1],
      reasoning: match.trim()
    }));
  }

  // Extract strategy points
  const strategyMatches = response.match(/(?:\d+\.|•|-)?\s*([A-Z][^.!?]*(?:strategy|approach|focus|target|avoid|consider)[^.!?]*[.!?])/gi);
  if (strategyMatches) {
    analysis.strategyPoints = strategyMatches.slice(0, 5).map(point => point.replace(/^\d+\.\s*|^[•-]\s*/, '').trim());
  }

  // Extract risk factors
  const riskMatches = response.match(/(?:risk|concern|warning|avoid)[^.!?]*[.!?]/gi);
  if (riskMatches) {
    analysis.riskFactors = riskMatches.slice(0, 3).map(risk => risk.trim());
  }

  // Extract trade recommendations for trade analysis
  if (requestType === 'trade_evaluation') {
    const tradeMatches = response.match(/(?:offer|trade|counter)[^.!?]*[.!?]/gi);
    if (tradeMatches) {
      analysis.tradeRecommendations = tradeMatches.slice(0, 3).map(trade => ({
        suggestion: trade.trim(),
        reasoning: 'Based on fair value analysis'
      }));
    }
  }

  return Object.keys(analysis).length > 0 ? analysis : undefined;
};

// Main handler function
exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        error: 'Method not allowed',
        message: 'This endpoint only accepts POST requests'
      })
    };
  }

  const startTime = Date.now();

  try {
    // Parse request body
    let request;
    try {
      request = JSON.parse(event.body || '{}');
    } catch (parseError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON'
        })
      };
    }

    // Handle health check requests
    if (request.type === 'health_check') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'healthy',
          service: 'fantasy-ai-coach',
          timestamp: new Date().toISOString(),
          responseTime: Date.now() - startTime
        })
      };
    }

    // Validate required fields
    if (!request.query || !request.requestId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields',
          message: 'query and requestId are required'
        })
      };
    }

    console.log(`🤖 Processing ${request.type || 'general'} request: ${request.requestId}`);

    // Initialize Gemini client
    let genAI;
    try {
      genAI = createGeminiClient();
    } catch (clientError) {
      console.error('❌ Failed to create Gemini client:', clientError.message);
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({ 
          error: 'Service unavailable',
          message: 'AI service configuration error'
        })
      };
    }

    // Configure the model
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-pro',
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      }
    });

    // Build the fantasy football prompt
    const prompt = buildFantasyPrompt(request);
    
    // Generate AI response
    let result;
    try {
      console.log(`🧠 Generating AI response for ${request.type || 'general'} query`);
      result = await model.generateContent(prompt);
      
      if (!result.response) {
        throw new Error('No response generated');
      }

    } catch (aiError) {
      console.error('❌ AI generation failed:', aiError.message);
      
      // Check for specific error types
      if (aiError.message.includes('quota') || aiError.message.includes('limit')) {
        return {
          statusCode: 429,
          headers,
          body: JSON.stringify({ 
            error: 'Rate limit exceeded',
            message: 'AI service temporarily unavailable due to rate limits'
          })
        };
      }

      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({ 
          error: 'AI service error',
          message: 'Failed to generate AI response'
        })
      };
    }

    // Process the response
    const responseText = result.response.text();
    const responseTime = Date.now() - startTime;
    
    // Extract structured analysis
    const analysis = extractAnalysis(responseText, request.type);

    // Calculate confidence based on response length and content
    const confidence = Math.min(95, Math.max(60, 
      (responseText.length / 10) + 
      (analysis ? Object.keys(analysis).length * 10 : 0)
    ));

    console.log(`✅ AI response generated successfully in ${responseTime}ms`);

    // Return successful response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        requestId: request.requestId,
        backend: 'cloud',
        response: responseText,
        confidence: Math.round(confidence),
        responseTime,
        analysis,
        timestamp: new Date().toISOString(),
        service: 'gemini-enterprise'
      })
    };

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: 'An unexpected error occurred',
        requestId: request?.requestId || 'unknown',
        timestamp: new Date().toISOString()
      })
    };
  }
};