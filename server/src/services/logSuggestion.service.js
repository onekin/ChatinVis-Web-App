import NodeLog from '../models/NodeLog.js';
import openaiService from './openai.service.js';
import PromptBuilder from './PromptBuilder.js';
import { stringSimilarity } from 'string-similarity-js';

const SIMILARITY_THRESHOLD = 0.7;

const QUESTION_ACTIONS = [
  'askFirstQuestion',
  'askQuestion',
  'selectAnswer',
  'askFirstQuestionWithPDF',
  'askQuestionWithPDF'
];

const FEEDBACK_ACTIONS = ['editFeedback', 'newFeedback'];

class LogSuggestionService {
  async getLogsForQuestions(mapId) {
    const questionLogs = await NodeLog.find({
      mapId,
      action: { $in: QUESTION_ACTIONS }
    }).sort({ timestamp: -1 }).lean();

    const nodeIds = [...new Set(questionLogs.map(l => l.nodeId))];

    const feedbackLogs = await NodeLog.find({
      mapId,
      action: { $in: FEEDBACK_ACTIONS },
      nodeId: { $in: nodeIds }
    }).lean();

    return { questionLogs, feedbackLogs };
  }

  async generateFromLogs(mapId, nodeText, nodeContext) {
    const { questionLogs } = await this.getLogsForQuestions(mapId);

    if (!questionLogs || questionLogs.length === 0) {
      return [];
    }

    const answerLabel = nodeContext?.currentAnswer || nodeText;
    const answerNote = nodeContext?.currentAnswerNote || '';
    const previousQuestion = nodeContext?.previousQuestion || nodeText;
    const firstQuestion = nodeContext?.firstQuestion || nodeText;

    const nodeCtx = {
      _styles: { systemSuggestedItems: 3 }
    };

    const prompt = PromptBuilder.getPromptForLogsSuggestedQuestions(
      nodeCtx,
      answerLabel,
      answerNote,
      previousQuestion,
      firstQuestion,
      questionLogs
    );

    const result = await openaiService.generateStructuredNodes(
      nodeCtx,
      prompt,
      'suggested-logs',
      {
        answerLabel,
        answerNote,
        previousQuestion,
        firstQuestion,
        logs: questionLogs
      }
    );

    if (result.parseError || !result.items || !Array.isArray(result.items)) {
      console.warn('Failed to parse log suggestions:', result.parseError);
      return [];
    }

    return result.items
      .filter(item => item.GPT_item_name || item.item_name)
      .slice(0, 3)
      .map(item => ({
        text: item.GPT_item_name || item.item_name || '',
        description: (item.description || '') + '\n\nSource: SystemLog',
        source: 'SystemLog'
      }));
  }

  async crossValidate(mapId, generatedNodes) {
    const selectAnswerLogs = await NodeLog.find({
      mapId,
      action: 'selectAnswer'
    }).lean();

    if (!selectAnswerLogs || selectAnswerLogs.length === 0) {
      return { matches: [] };
    }

    const feedbackLogs = await NodeLog.find({
      mapId,
      action: { $in: FEEDBACK_ACTIONS }
    }).lean();

    const feedbackByNodeId = {};
    feedbackLogs.forEach(log => {
      feedbackByNodeId[log.nodeId] = log.value;
    });

    const matches = [];

    for (const node of generatedNodes) {
      const nodeText = node.text || '';
      if (!nodeText) continue;

      for (const log of selectAnswerLogs) {
        const logText = log.value?.nodeText || log.value?.answer || '';
        if (!logText) continue;

        const similarity = stringSimilarity(nodeText, logText);
        if (similarity >= SIMILARITY_THRESHOLD) {
          const questionLog = await NodeLog.findOne({
            mapId,
            nodeId: log.nodeId,
            action: { $in: ['askQuestion', 'askFirstQuestion'] }
          }).lean();

          matches.push({
            text: nodeText,
            previousAnswer: logText,
            similarity,
            previousQuestion: questionLog?.value?.question || log.value?.question || '',
            feedback: feedbackByNodeId[log.nodeId] || null
          });
          break;
        }
      }
    }

    return { matches };
  }
}

export default new LogSuggestionService();