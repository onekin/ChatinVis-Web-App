const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class NodeLogService {
  // Crear un nuevo log
  async createLog(action, nodeId, mapId, source = null, value = null) {
    try {
      const response = await fetch(`${API_URL}/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          nodeId,
          mapId,
          source,
          value
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create log');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating log:', error);
      throw error;
    }
  }

  // Obtener logs de un mapa mental
  async getLogsByMapId(mapId, filters = {}) {
    try {
      const params = new URLSearchParams();

      if (filters.action) params.append('action', filters.action);
      if (filters.nodeId) params.append('nodeId', filters.nodeId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.skip) params.append('skip', filters.skip);

      const url = `${API_URL}/logs/map/${mapId}?${params}`;
      console.log(' nodeLogService.getLogsByMapId - URL:', url);
      console.log(' nodeLogService.getLogsByMapId - mapId:', mapId, 'type:', typeof mapId);

      const response = await fetch(url);
      console.log(' nodeLogService.getLogsByMapId - response status:', response.status);

      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }

      const data = await response.json();
      console.log(' nodeLogService.getLogsByMapId - data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching logs:', error);
      throw error;
    }
  }

  // Obtener logs de un nodo específico
  async getLogsByNodeId(nodeId, limit = 50) {
    try {
      const response = await fetch(`${API_URL}/logs/node/${nodeId}?limit=${limit}`);

      if (!response.ok) {
        throw new Error('Failed to fetch node logs');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching node logs:', error);
      throw error;
    }
  }

  // Obtener estadísticas de logs
  async getLogStats(mapId) {
    try {
      const url = `${API_URL}/logs/map/${mapId}/stats`;
      console.log(' nodeLogService.getLogStats - URL:', url);
      console.log(' nodeLogService.getLogStats - mapId:', mapId, 'type:', typeof mapId);

      const response = await fetch(url);
      console.log(' nodeLogService.getLogStats - response status:', response.status);

      if (!response.ok) {
        throw new Error('Failed to fetch log stats');
      }

      const data = await response.json();
      console.log(' nodeLogService.getLogStats - data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching log stats:', error);
      throw error;
    }
  }

  // Exportar logs a CSV
  async exportLogs(mapId) {
    try {
      const response = await fetch(`${API_URL}/logs/map/${mapId}/export`);

      if (!response.ok) {
        throw new Error('Failed to export logs');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs-${mapId}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting logs:', error);
      throw error;
    }
  }

  // Helper: Log de pregunta inicial
  async logAskFirstQuestion(nodeId, mapId, question) {
    return this.createLog('askFirstQuestion', nodeId, mapId, null, { question });
  }

  // Helper: Log de pregunta con respuesta
  async logAskQuestion(nodeId, mapId, question, answer) {
    return this.createLog('askQuestion', nodeId, mapId, null, { question, answer });
  }

  // Helper: Log de pregunta inicial con PDF
  async logAskFirstQuestionWithPDF(nodeId, mapId, pdfSource, question) {
    return this.createLog('askFirstQuestionWithPDF', nodeId, mapId, pdfSource, { question });
  }

  // Helper: Log de pregunta con PDF
  async logAskQuestionWithPDF(nodeId, mapId, pdfSource, question, answer) {
    return this.createLog('askQuestionWithPDF', nodeId, mapId, pdfSource, { question, answer });
  }

  // Helper: Log de selección de respuesta
  async logSelectAnswer(nodeId, mapId, nodeText) {
    return this.createLog('selectAnswer', nodeId, mapId, null, { nodeText });
  }

  // Helper: Log de editar feedback
  async logEditFeedback(nodeId, mapId, rateValue, userAnnotation) {
    return this.createLog('editFeedback', nodeId, mapId, null, {
      rateValue,
      userAnnotation
    });
  }

  // Helper: Log de nuevo feedback
  async logNewFeedback(nodeId, mapId, rateValue, userAnnotation) {
    return this.createLog('newFeedback', nodeId, mapId, null, {
      rateValue,
      userAnnotation
    });
  }

  // Helper: Log de consultar nota
  async logConsultNote(nodeId, mapId, nodeText) {
    return this.createLog('consultNote', nodeId, mapId, null, { nodeText });
  }

  // Helper: Log de resumir
  async logSummarize(nodeId, mapId, value) {
    // value puede ser un string (nodeText) o un objeto con detalles de la compactación
    const logValue = typeof value === 'string' ? { nodeText: value } : value;
    return this.createLog('summarize', nodeId, mapId, null, logValue);
  }

  // Helper: Log de crear nodo
  async logCreateNode(nodeId, mapId, nodeText) {
    return this.createLog('createNode', nodeId, mapId, null, { nodeText });
  }

  // Helper: Log de editar nodo
  async logEditNode(nodeId, mapId, oldText, newText) {
    return this.createLog('editNode', nodeId, mapId, null, { oldText, newText });
  }

  // Helper: Log de eliminar nodo
  async logDeleteNode(nodeId, mapId, nodeText) {
    return this.createLog('deleteNode', nodeId, mapId, null, { nodeText });
  }

  // Helper: Log de mover nodo
  async logMoveNode(nodeId, mapId, oldPosition, newPosition) {
    return this.createLog('moveNode', nodeId, mapId, null, {
      oldX: oldPosition.x,
      oldY: oldPosition.y,
      newX: newPosition.x,
      newY: newPosition.y
    });
  }

  // Helper: Log de cambiar color de nodo
  async logChangeNodeColor(nodeId, mapId, oldColor, newColor) {
    return this.createLog('changeNodeColor', nodeId, mapId, null, {
      oldColor,
      newColor
    });
  }

  // Helper: Log de cambiar estilo de nodo
  async logChangeNodeStyle(nodeId, mapId, property, oldValue, newValue) {
    return this.createLog('changeNodeStyle', nodeId, mapId, null, {
      property,
      oldValue,
      newValue
    });
  }

  // Crear logs de prueba
  async createTestLogs(mapId) {
    try {
      const response = await fetch(`${API_URL}/logs/map/${mapId}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to create test logs');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating test logs:', error);
      throw error;
    }
  }
}

export default new NodeLogService();
