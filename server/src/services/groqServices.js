import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import PromptBuilder from './PromptBuilder.js';

class GroqService {
  constructor(override = null) {
    const apiKey = (override && override.apiKey) ? override.apiKey : process.env.GROQ_API_KEY;
    const rawModel = (override && override.model) ? override.model : 'llama-3.1-8b-instant';

    // Map optimistic/unsupported model names to actual supported models on Groq
    let modelName = rawModel;
    if (rawModel.includes('llama-4') || rawModel.includes('maverick') || rawModel.includes('scout')) {
      modelName = 'llama-3.1-8b-instant';
    } else if (rawModel.includes('qwen3') || rawModel.includes('qwen/qwen3')) {
      modelName = 'qwen-2.5-coder-32b';
    }

    if (!apiKey) {
      console.error('GROQ_API_KEY not found in environment');
      throw new Error('Groq API key is required');
    }

    console.log(`Initializing Groq service with ${modelName} (requested: ${rawModel})`);
    this.llm = new ChatOpenAI({
      modelName: modelName,
      temperature: 0.7,
      maxCompletionTokens: 2000,
      openAIApiKey: apiKey,
      configuration: { baseURL: 'https://api.groq.com/openai/v1' },
      timeout: 30000,
      maxRetries: 1,
      modelKwargs: { response_format: { type: "json_object" } }
    });
    console.log('Groq instance created with 30s timeout, maxRetries: 1, and JSON mode');
  }

  async generateNodes(nodeText, nodeTipo, count = 3, nodeContextData = null, documentId = null, frameworkConfig = null) {
    try {
      console.log(`Generating ${count} nodes for "${nodeText}" (type: ${nodeTipo}) via Groq`);
      return this.generateNodesWithPromptBuilder(nodeText, nodeTipo, count, '', nodeContextData, documentId, frameworkConfig);
    } catch (error) {
      console.error('Groq generation error:', error.message);
      throw new Error(`Failed to generate nodes: ${error.message}`);
    }
  }

  async generateNodesWithPromptBuilder(nodeText, nodeTipo, count = 3, description = '', nodeContextData = null, documentId = null, frameworkConfig = null) {
    try {
      const nodeContext = {
        _styles: {
          llmSuggestedItems: count
        }
      };

      let question = nodeText;
      let promptType = 'basic';
      let options = {};

      if (nodeTipo === 'pregunta') {
        promptType = 'basic';
      } else if (nodeTipo === 'respuesta') {
        promptType = 'suggested-llm';
        if (nodeContextData && nodeContextData.pathLength >= 1) {
          options = {
            answerLabel: nodeContextData.currentAnswer,
            answerNote: nodeContextData.currentAnswerNote,
            previousQuestion: nodeContextData.previousQuestion,
            firstQuestion: nodeContextData.firstQuestion,
            fullPath: nodeContextData.fullPath
          };
        } else {
          options = {
            answerLabel: nodeText,
            answerNote: '',
            previousQuestion: nodeText,
            firstQuestion: nodeText,
            fullPath: [nodeText]
          };
        }
      } else {
        promptType = 'basic';
      }

      const result = await this.generateStructuredNodes(nodeContext, question, promptType, options, frameworkConfig);
      const nodes = this._extractNodesFromStructuredResponse(result, count);

      return { nodes };
    } catch (error) {
      console.error('Groq PromptBuilder generation error:', error);
      throw error;
    }
  }

  async aggregateNodes(question, nodes, clusterCount = 3) {
    try {
      console.log(`Aggregating ${nodes.length} nodes into ${clusterCount} clusters via Groq`);

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
      console.error('Failed to parse structured response');
      throw new Error(`AI response parsing failed: ${result.parseError}`);
    }

    if (result.items && Array.isArray(result.items)) {
      result.items.forEach(item => {
        let text = item.GPT_item_name || item.item_name || '';
        let description = item.description || '';

        if (!text) {
          if (item.item && typeof item.item === 'string') {
            text = item.item;
          } else if (item.name && typeof item.name === 'string') {
            text = item.name;
          } else {
            for (const [key, value] of Object.entries(item)) {
              if (key !== 'description' && key !== 'excerpt' && typeof value === 'string') {
                text = key;
                description = value;
                break;
              }
            }
          }
        }

        if (text) {
          nodes.push({
            text,
            description,
            source: 'Groq'
          });
        }
      });
    }

    return nodes.slice(0, count);
  }

  async generateStructuredNodes(nodeContext, question, type = 'basic', options = {}, frameworkConfig = null) {
    try {
      let prompt;

      switch(type) {
        case 'basic':
          prompt = PromptBuilder.getPromptForLLMAnswers(nodeContext, question);
          break;
        case 'pdf':
          throw new Error('PDF prompts not supported directly on Groq service');
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
        case 'suggested-llm':
          prompt = PromptBuilder.getPromptForLLMSuggestedQuestions(
            nodeContext,
            options.answerLabel,
            options.answerNote,
            options.previousQuestion,
            options.firstQuestion,
            frameworkConfig
          );
          break;
        default:
          throw new Error(`Unknown type: ${type}`);
      }

      const messages = [
        new SystemMessage('You are an expert mind mapping assistant. Provide responses in valid JSON format.'),
        new HumanMessage(prompt)
      ];

      const response = await this.llm.invoke(messages);
      
      if (!response) {
        throw new Error('No response from Groq');
      }

      const parsedResponse = this._parseStructuredResponse(response.content);
      return parsedResponse;
    } catch (error) {
      console.error('Groq structured generation error:', error.message);
      throw error;
    }
  }

  _parseStructuredResponse(aiResponse) {
    if (!aiResponse || typeof aiResponse !== 'string') {
      return { error: 'Invalid response' };
    }

    let jsonText = aiResponse.trim();

    try {
      if (jsonText.includes('```json')) {
        jsonText = jsonText.replace(/^```json\s*/m, '').replace(/\s*```\s*$/m, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/m, '').replace(/\s*```\s*$/m, '');
      }

      jsonText = jsonText.replace(/^`+/, '').replace(/`+$/, '').trim();

      const parsed = JSON.parse(jsonText);
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

class GroqServiceProxy {
  constructor() {
    this.serviceInstance = null;
  }

  getInstance() {
    if (!this.serviceInstance) {
      this.serviceInstance = new GroqService();
    }
    return this.serviceInstance;
  }

  generateNodes(nodeText, nodeTipo, count, nodeContextData, documentId, frameworkConfig) {
    return this.getInstance().generateNodes(nodeText, nodeTipo, count, nodeContextData, documentId, frameworkConfig);
  }

  generateStructuredNodes(nodeContext, question, type, options, frameworkConfig) {
    return this.getInstance().generateStructuredNodes(nodeContext, question, type, options, frameworkConfig);
  }

  aggregateNodes(question, nodes, clusterCount) {
    return this.getInstance().aggregateNodes(question, nodes, clusterCount);
  }

  createForRequest(apiKey, model) {
    return new GroqService({ apiKey, model });
  }

  get llm() {
    return this.getInstance().llm;
  }
}

export default new GroqServiceProxy();
