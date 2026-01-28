import axios from 'axios';

class IAService {
  constructor() {
    this.apiClient = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }


  async generateNodes(nodeText, nodeTipo, count = 3, nodeContext = null, documentId = null) {
    try {
      // Map English types to Spanish for API compatibility
      const typeMap = {
        'question': 'pregunta',
        'answer': 'respuesta',
        'root': 'root'
      };
      const mappedTipo = typeMap[nodeTipo] || nodeTipo;

      const response = await this.apiClient.post('/mindmap/generate-nodes', {
        nodeText,
        nodeTipo: mappedTipo,
        count,
        nodeContext,
        documentId
      });

      if (response.data.success && response.data.nodes) {
        // Devolver objetos completos con texto, descripción, source y citation
        return response.data.nodes.map(node => ({
          text: node.text,
          description: node.description || '',
          source: node.source || 'Generado por IA',
          citation: node.citation || null
        }));
      }

      console.warn('Unexpected API response, using mock data');
      return this.getMockResponses(nodeText);
    } catch (error) {
      console.error('IA generation failed:', error);

      if (error.response?.status === 503) {
        console.warn('AI service unavailable, using mock responses');
      } else if (error.code === 'ECONNREFUSED') {
        console.warn('Cannot connect to server, using mock responses');
      }

      return this.getMockResponses(nodeText);
    }
  }

  async generateNodeDetail(nodeText, nodeTipo) {
    try {
      // Map English types to Spanish for API compatibility
      const typeMap = {
        'question': 'pregunta',
        'answer': 'respuesta',
        'root': 'root'
      };
      const mappedTipo = typeMap[nodeTipo] || nodeTipo;

      const response = await this.apiClient.post('/mindmap/generate-detail', {
        nodeText,
        nodeTipo: mappedTipo
      });

      if (response.data.success && response.data.description) {
        return response.data.description;
      }

      console.warn('Unexpected API response for detail');
      return this.getMockDetail(nodeText, nodeTipo);
    } catch (error) {
      console.error('Detail generation failed:', error);

      if (error.response?.status === 503) {
        console.warn('AI service unavailable, using mock detail');
      } else if (error.code === 'ECONNREFUSED') {
        console.warn('Cannot connect to server, using mock detail');
      }

      return this.getMockDetail(nodeText, nodeTipo);
    }
  }

  getMockResponses(question) {
    const lower = question.toLowerCase();

    if (lower.includes('ia') || lower.includes('artificial intelligence')) {
      return [
        { text: 'Machine Learning', description: 'Algorithms that learn from data', source: 'Mock data' },
        { text: 'Neural Networks', description: 'Models inspired by the human brain', source: 'Mock data' },
        { text: 'Natural Language Processing', description: 'Understanding and generating text', source: 'Mock data' },
        { text: 'Computer Vision', description: 'Analyzing and interpreting images', source: 'Mock data' }
      ];
    }

    if (lower.includes('programming') || lower.includes('code')) {
      return [
        { text: 'Frontend', description: 'User interface development', source: 'Mock data' },
        { text: 'Backend', description: 'Server logic and databases', source: 'Mock data' },
        { text: 'Database', description: 'Data storage and management', source: 'Mock data' },
        { text: 'DevOps', description: 'Automation and continuous deployment', source: 'Mock data' }
      ];
    }

    return [
      { text: 'Concept 1', description: 'First idea related to the topic', source: 'Mock data' },
      { text: 'Concept 2', description: 'Second perspective of the concept', source: 'Mock data' },
      { text: 'Concept 3', description: 'Third approach to the topic', source: 'Mock data' }
    ];
  }

  getMockDetail(nodeText, nodeTipo) {
    if (nodeTipo === 'question' || nodeTipo === 'root') {
      return `This is an important question that requires in-depth analysis. The concept "${nodeText}" involves multiple aspects that should be carefully considered to gain a complete understanding of the topic.`;
    } else {
      return `The concept "${nodeText}" is a key answer that addresses fundamental aspects of the topic. Its importance lies in how it connects different ideas and provides a valuable perspective for exploring the mind map.`;
    }
  }

  async aggregateNodes(question, nodes, clusterCount = 3) {
    try {
      console.log(`Aggregating ${nodes.length} nodes into ${clusterCount} clusters`);

      const response = await this.apiClient.post('/mindmap/aggregate-nodes', {
        question,
        nodes,
        clusterCount
      });

      if (response.data.success && response.data.clusters) {
        return response.data.clusters;
      }

      console.warn('Unexpected API response for aggregation, using mock data');
      return this.getMockClusters(nodes, clusterCount);
    } catch (error) {
      console.error('Node aggregation failed:', error);
      return this.getMockClusters(nodes, clusterCount);
    }
  }

  getMockClusters(nodes, clusterCount) {
    const clusters = [];
    const nodesPerCluster = Math.ceil(nodes.length / clusterCount);

    for (let i = 0; i < clusterCount; i++) {
      const start = i * nodesPerCluster;
      const end = Math.min(start + nodesPerCluster, nodes.length);
      const clusterNodes = nodes.slice(start, end);

      clusters.push({
        cluster_name: `Cluster ${i + 1}`,
        description: `Grouping of related nodes ${i + 1}`,
        clusteredItems: clusterNodes
      });
    }

    return clusters;
  }
}

export default IAService;
