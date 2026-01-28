import PromptBuilder from './PromptBuilder.js';

function makeNodes(n) {
  const nodes = [];
  for (let i = 0; i < n; i++) {
    nodes.push({
      _info: {
        title: `NODE_TITLE_UNIQUE_${i}`,
        note: `This is the note for node ${i}`
      }
    });
  }
  return nodes;
}

function testSummarization(n, clusters) {
  const nodes = makeNodes(n);
  const question = 'Cluster these nodes by similarity.';
  const prompt = PromptBuilder.getPromptForSummarizationAnswers(question, nodes, clusters);

  console.log('Generated prompt length:', prompt.length);
  console.log('First 500 chars:\n', prompt.substring(0, 500));
  console.log('Search for first node title:', prompt.includes('NODE_TITLE_UNIQUE_0'));
  console.log('Search for middle node title:', prompt.includes(`NODE_TITLE_UNIQUE_${Math.floor(n/2)}`));
  console.log('Search for last node title:', prompt.includes(`NODE_TITLE_UNIQUE_${n-1}`));
}

// Run tests
console.log('Testing PromptBuilder.getPromptForSummarizationAnswers with 100 nodes');
testSummarization(100, 5);

console.log('\nTesting PromptBuilder.getPromptForSummarizationQuestions with 100 nodes');
const nodes = makeNodes(100);
const prompt2 = PromptBuilder.getPromptForSummarizationQuestions('Generate questions', nodes, 5);
console.log('Contains first title:', prompt2.includes('NODE_TITLE_UNIQUE_0'));
console.log('Contains last title:', prompt2.includes('NODE_TITLE_UNIQUE_99'));

console.log('\nTesting PromptBuilder.getPromptForLogsSuggestedQuestions with logs array');
const logs = Array.from({ length: 10 }, (_, i) => ({ value: `LOG_ENTRY_${i}` }));
const prompt3 = PromptBuilder.getPromptForLogsSuggestedQuestions(null, 'Ans', 'Note', 'Prev', 'FirstQ', logs);
console.log('Logs JSON included:', prompt3.includes('LOG_ENTRY_0'));

console.log('\nDone.');

