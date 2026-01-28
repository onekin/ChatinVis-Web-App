import { GoogleGenerativeAI } from '@google/generative-ai';
import PromptBuilder from './PromptBuilder.js';

class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not found in environment');
      throw new Error('Gemini API key is required');
    }

    console.log('Initializing Gemini service with gemini-2.5-flash');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    console.log('Gemini instance created');
  }

  async generateNodes(nodeText, nodeTipo, count = 3, nodeContextData = null) {
    try {
      console.log(`Generating ${count} nodes for "${nodeText}" (type: ${nodeTipo})`);
      
      if (nodeContextData) {
        console.log('With node context:', {
          level: nodeContextData.pathLength,
          firstQuestion: nodeContextData.firstQuestion
        });
      }

      // Siempre usar generación estructurada con PromptBuilder para obtener descripciones
      return this.generateNodesWithPromptBuilder(nodeText, nodeTipo, count, '', nodeContextData);
    } catch (error) {
      console.error('Gemini generation error:', error.message);
      console.error('Error details:', error);

      console.warn('Using fallback nodes');
      const fallbackNodes = [];
      for (let i = 1; i <= count; i++) {
        fallbackNodes.push({
          text: `Concepto ${i}`,
          description: 'Descripción no disponible',
          source: 'Fallback'
        });
      }
      return { nodes: fallbackNodes };
    }
  }

  async generateNodesWithPromptBuilder(nodeText, nodeTipo, count = 3, description = '', nodeContextData = null) {
    try {
      console.log('Using PromptBuilder for node generation');
      console.log('Input:', { nodeText, nodeTipo, count, hasNodeContext: !!nodeContextData });

      const nodeContext = {
        _styles: {
          llmSuggestedItems: count
        }
      };

      let question = nodeText;
      let promptType = 'basic';
      let options = {};

      // Si hay contexto de padres y el tipo es respuesta, usar preguntas sugeridas con contexto
      if (nodeContextData && nodeTipo === 'respuesta' && nodeContextData.pathLength >= 3) {
        promptType = 'suggested-llm';
        options = {
          answerLabel: nodeContextData.currentAnswer,
          answerNote: nodeContextData.currentAnswerNote,
          previousQuestion: nodeContextData.previousQuestion,
          firstQuestion: nodeContextData.firstQuestion
        };
        
        console.log(`Using suggested-llm prompt with context`);
      }

      const result = await this.generateStructuredNodes(nodeContext, question, promptType, options);

      const nodes = this._extractNodesFromStructuredResponse(result, count);

      return { nodes };
    } catch (error) {
      console.error('PromptBuilder generation error:', error);
      throw error;
    }
  }


  async aggregateNodes(question, nodes, clusterCount = 3) {
    try {
      console.log(`Aggregating ${nodes.length} nodes into ${clusterCount} clusters`);

      const formattedNodes = nodes.map(node => ({
        _info: {
          title: node.text || node.title || '',
          note: node.description || ''
        }
      }));

      const result = await this.generateStructuredNodes(
        null,
        question,
        'aggregation',
        { nodes: formattedNodes, clusterCount }
      );

      return result;
    } catch (error) {
      console.error('Aggregation error:', error);
      throw error;
    }
  }

  _extractNodesFromStructuredResponse(result, count) {
    const nodes = [];

    if (result.parseError) {
      console.warn('Failed to parse structured response, using fallback');
      console.warn('Parse error:', result.parseError);
      console.warn('Raw response:', result.raw?.substring(0, 200));
      for (let i = 0; i < count; i++) {
        nodes.push({
          text: `Concepto ${i + 1}`,
          description: 'Error al generar descripción',
          source: 'Fallback'
        });
      }
      return nodes;
    }

    // El PromptBuilder siempre usa "items" ahora
    if (result.items && Array.isArray(result.items)) {
      result.items.forEach(item => {
        const text = item.GPT_item_name || item.item_name || '';
        const description = item.description || '';
        const excerpt = item.excerpt || '';
        if (text) {
          const node = {
            text,
            description,
            source: excerpt ? 'PDF Extract' : 'Gemini 2.5 Flash'
          };
          if (excerpt) node.excerpt = excerpt;
          nodes.push(node);
        }
      });
    }

    while (nodes.length < count) {
      nodes.push({
        text: `Concepto ${nodes.length + 1}`,
        description: 'Descripción no disponible',
        source: 'Fallback'
      });
    }

    return nodes.slice(0, count);
  }

  _buildPrompt(nodeText, nodeTipo, count) {
    if (nodeTipo === 'pregunta' || nodeTipo === 'root') {
      return `Eres un asistente de mind mapping que ayuda a explorar temas a través de pensamiento estructurado. Genera respuestas concisas y específicas.

Genera ${count} respuestas concisas y distintas a la siguiente pregunta:

"${nodeText}"

Requisitos:
- Cada respuesta debe tener máximo 5-15 palabras
- Las respuestas deben explorar diferentes aspectos o perspectivas
- Hazlas específicas y accionables
- Devuelve SOLO las respuestas, una por línea, sin numeración ni viñetas
- Usa español si la pregunta está en español, inglés si está en inglés

Formato: Una respuesta por línea`;
    } else if (nodeTipo === 'respuesta') {
      return `Eres un asistente de mind mapping que ayuda a profundizar la exploración mediante preguntas. Genera preguntas provocadoras de seguimiento.

Basándote en la siguiente afirmación o respuesta:

"${nodeText}"

Genera ${count} preguntas de seguimiento que exploren este tema más profundamente.

Requisitos:
- Cada pregunta debe tener máximo 5-15 palabras
- Las preguntas deben explorar diferentes ángulos (por qué, cómo, qué pasaría si, consecuencias, etc.)
- Hazlas provocadoras y específicas
- Devuelve SOLO las preguntas, una por línea, sin numeración ni viñetas
- Usa español si la afirmación está en español, inglés si está en inglés

Formato: Una pregunta por línea`;
    } else {
      throw new Error(`Unknown node type: ${nodeTipo}`);
    }
  }

  _parseResponse(aiResponse) {
    if (!aiResponse || typeof aiResponse !== 'string') {
      return [];
    }

    const lines = aiResponse
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        return line.replace(/^[\d\-\*\•\.]+\s*/, '').trim();
      })
      .filter(line => line.length > 0);

    return lines.map(text => ({ text }));
  }

  async generateStructuredNodes(nodeContext, question, type = 'basic', options = {}) {
    try {
      console.log(`Generating structured nodes (type: ${type})`);

      let prompt;

      switch(type) {
        case 'basic':
          prompt = PromptBuilder.getPromptForLLMAnswers(nodeContext, question);
          break;
        case 'pdf':
          console.warn('PDF-based prompts require PDF upload functionality');
          prompt = PromptBuilder.getPromptForPDFAnswers(nodeContext, question);
          break;
        case 'aggregation':
          prompt = PromptBuilder.getPromptForSummarizationAnswers(
            question,
            options.nodes || [],
            options.clusterCount || 3
          );
          break;
        case 'summarization-questions':
          prompt = PromptBuilder.getPromptForSummarizationQuestions(
            question,
            options.nodes || [],
            options.clusterCount || 3
          );
          break;
        case 'suggested-model':
          prompt = PromptBuilder.getPromptForModelSuggestedQuestion(
            nodeContext,
            options.answerLabel,
            options.answerNote,
            options.previousQuestion,
            options.firstQuestion,
            options.model
          );
          break;
        case 'suggested-logs':
          prompt = PromptBuilder.getPromptForLogsSuggestedQuestions(
            nodeContext,
            options.answerLabel,
            options.answerNote,
            options.previousQuestion,
            options.firstQuestion,
            options.logs
          );
          break;
        case 'suggested-llm':
          prompt = PromptBuilder.getPromptForLLMSuggestedQuestions(
            nodeContext,
            options.answerLabel,
            options.answerNote,
            options.previousQuestion,
            options.firstQuestion
          );
          break;
        default:
          throw new Error(`Unknown type: ${type}`);
      }

      console.log('Advanced prompt built, invoking Gemini...');
      const result = await this.model.generateContent(prompt);
      const response = await result.response;

      if (!response) {
        throw new Error('No response from Gemini');
      }

      const text = response.text();
      console.log('Gemini response received');

      const parsedResponse = this._parseStructuredResponse(text);
      console.log('Parsed structured response');

      return parsedResponse;
    } catch (error) {
      console.error('Gemini structured generation error:', error.message);
      console.error('Error details:', error);
      throw error;
    }
  }

  _parseStructuredResponse(aiResponse) {
    if (!aiResponse || typeof aiResponse !== 'string') {
      return { error: 'Invalid response' };
    }

    try {
      let jsonText = aiResponse;

      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      } else {
        const codeMatch = aiResponse.match(/```\s*([\s\S]*?)\s*```/);
        if (codeMatch) {
          jsonText = codeMatch[1];
        }
      }

      const parsed = JSON.parse(jsonText.trim());
      return parsed;
    } catch (error) {
      console.error('Failed to parse JSON response:', error.message);
      return {
        raw: aiResponse,
        parseError: error.message
      };
    }
  }
}

let instance = null;

class GeminiServiceProxy {
  constructor() {
    this.serviceInstance = null;
  }

  getInstance() {
    if (!this.serviceInstance) {
      this.serviceInstance = new GeminiService();
    }
    return this.serviceInstance;
  }

  generateNodes(nodeText, nodeTipo, count, useStructured, description) {
    return this.getInstance().generateNodes(nodeText, nodeTipo, count, useStructured, description);
  }

  generateStructuredNodes(nodeContext, question, type, options) {
    return this.getInstance().generateStructuredNodes(nodeContext, question, type, options);
  }

  aggregateNodes(question, nodes, clusterCount) {
    return this.getInstance().aggregateNodes(question, nodes, clusterCount);
  }
}

export default new GeminiServiceProxy();
