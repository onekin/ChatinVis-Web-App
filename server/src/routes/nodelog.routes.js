import express from 'express';
import nodeLogController from '../controllers/nodelog.controller.js';

const router = express.Router();

// Crear un nuevo log
router.post('/', nodeLogController.createLog);

// Obtener logs por mapId
router.get('/map/:mapId', nodeLogController.getLogsByMapId);

// Obtener logs por nodeId
router.get('/node/:nodeId', nodeLogController.getLogsByNodeId);

// Obtener estadísticas de logs
router.get('/map/:mapId/stats', nodeLogController.getLogStats);

// Eliminar logs antiguos
router.delete('/map/:mapId/old', nodeLogController.deleteOldLogs);

// Exportar logs a CSV
router.get('/map/:mapId/export', nodeLogController.exportLogs);

// Crear logs de prueba (solo para desarrollo)
router.post('/map/:mapId/test', nodeLogController.createTestLogs);

export default router;
