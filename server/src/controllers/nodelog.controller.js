import NodeLog from '../models/NodeLog.js';
import MindMap from '../models/MindMap.js';
import mongoose from 'mongoose';

class NodeLogController {
  // Crear un nuevo log
  async createLog(req, res) {
    try {
      const { action, nodeId, source, value, mapId } = req.body;

      // Validar que el mapa existe
      const mindmap = await MindMap.findById(mapId);
      if (!mindmap) {
        return res.status(404).json({ error: 'MindMap not found' });
      }

      const log = new NodeLog({
        action,
        nodeId,
        source,
        value,
        mapId,
        timestamp: new Date()
      });

      await log.save();
      res.status(201).json(log);
    } catch (error) {
      console.error('Error creating node log:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Obtener todos los logs de un mapa mental
  async getLogsByMapId(req, res) {
    try {
      const { mapId } = req.params;
      const { action, nodeId, startDate, endDate, limit = 100, skip = 0 } = req.query;

      console.log('Fetching logs for mapId:', mapId);

      // Validar que mapId es válido
      if (!mapId || mapId === 'undefined') {
        return res.status(400).json({ error: 'Invalid or missing mapId' });
      }

      // Convertir mapId a ObjectId explícitamente
      let objectId;
      try {
        objectId = new mongoose.Types.ObjectId(mapId);
      } catch (err) {
        return res.status(400).json({ error: 'Invalid mapId format' });
      }

      const filters = { mapId: objectId };

      if (action) {
        filters.action = action;
      }

      if (nodeId) {
        filters.nodeId = nodeId;
      }

      if (startDate || endDate) {
        filters.timestamp = {};
        if (startDate) {
          filters.timestamp.$gte = new Date(startDate);
        }
        if (endDate) {
          filters.timestamp.$lte = new Date(endDate);
        }
      }

      const logs = await NodeLog.find(filters)
        .sort({ timestamp: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip));

      const total = await NodeLog.countDocuments(filters);

      console.log(`Found ${logs.length} logs (total: ${total}) for filters:`, filters);

      res.json({
        logs,
        total,
        limit: parseInt(limit),
        skip: parseInt(skip)
      });
    } catch (error) {
      console.error('Error fetching logs:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Obtener logs de un nodo específico
  async getLogsByNodeId(req, res) {
    try {
      const { nodeId } = req.params;
      const { limit = 50 } = req.query;

      const logs = await NodeLog.find({ nodeId })
        .sort({ timestamp: -1 })
        .limit(parseInt(limit));

      res.json(logs);
    } catch (error) {
      console.error('Error fetching node logs:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Obtener estadísticas de logs
  async getLogStats(req, res) {
    try {
      const { mapId } = req.params;

      // Validar que mapId es válido
      if (!mapId || mapId === 'undefined') {
        return res.status(400).json({ error: 'Invalid or missing mapId' });
      }

      // Usar new mongoose.Types.ObjectId() para Mongoose 8
      let objectId;
      try {
        objectId = new mongoose.Types.ObjectId(mapId);
      } catch (err) {
        return res.status(400).json({ error: 'Invalid mapId format' });
      }

      const stats = await NodeLog.aggregate([
        { $match: { mapId: objectId } },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      const totalLogs = await NodeLog.countDocuments({ mapId: objectId });

      console.log('Stats for mapId:', mapId, '- Total:', totalLogs, '- By action:', stats.length);

      res.json({
        total: totalLogs,
        byAction: stats
      });
    } catch (error) {
      console.error('Error fetching log stats:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Eliminar logs antiguos
  async deleteOldLogs(req, res) {
    try {
      const { mapId } = req.params;
      const { daysOld = 90 } = req.body;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await NodeLog.deleteMany({
        mapId,
        timestamp: { $lt: cutoffDate }
      });

      res.json({
        message: `Deleted ${result.deletedCount} logs older than ${daysOld} days`,
        deletedCount: result.deletedCount
      });
    } catch (error) {
      console.error('Error deleting old logs:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Exportar logs a CSV
  async exportLogs(req, res) {
    try {
      const { mapId } = req.params;

      const logs = await NodeLog.find({ mapId })
        .sort({ timestamp: -1 })
        .lean();

      // Crear CSV
      const header = 'id,action,nodeId,source,value,timestamp,mapId\n';
      const rows = logs.map(log => {
        const value = typeof log.value === 'object'
          ? JSON.stringify(log.value).replace(/"/g, '""')
          : log.value || '';

        return `${log._id},${log.action},${log.nodeId},${log.source || ''},${value},${log.timestamp.toISOString()},${log.mapId}`;
      }).join('\n');

      const csv = header + rows;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=logs-${mapId}-${Date.now()}.csv`);
      res.send(csv);
    } catch (error) {
      console.error('Error exporting logs:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Crear logs de prueba para testing
  async createTestLogs(req, res) {
    try {
      const { mapId } = req.params;

      // Verificar que el mapa existe
      const mindmap = await MindMap.findById(mapId);
      if (!mindmap) {
        return res.status(404).json({ error: 'MindMap not found' });
      }

      const testLogs = [
        {
          action: 'askFirstQuestion',
          nodeId: 'root',
          mapId,
          value: { question: '¿Qué es la inteligencia artificial?' }
        },
        {
          action: 'askQuestion',
          nodeId: 'node-1',
          mapId,
          value: {
            question: '¿Cuáles son las aplicaciones?',
            answer: 'Machine Learning, Deep Learning, NLP'
          }
        },
        {
          action: 'selectAnswer',
          nodeId: 'node-2',
          mapId,
          value: { nodeText: 'Machine Learning' }
        },
        {
          action: 'createNode',
          nodeId: 'node-3',
          mapId,
          value: { nodeText: 'Nuevo nodo de prueba' }
        },
        {
          action: 'editFeedback',
          nodeId: 'node-2',
          mapId,
          value: {
            rateValue: 4,
            userAnnotation: 'Muy buena respuesta'
          }
        }
      ];

      const createdLogs = await NodeLog.insertMany(testLogs);

      console.log(` Created ${createdLogs.length} test logs for mapId: ${mapId}`);

      res.status(201).json({
        success: true,
        message: `Created ${createdLogs.length} test logs`,
        logs: createdLogs
      });
    } catch (error) {
      console.error('Error creating test logs:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default new NodeLogController();
