import express from 'express';
import { protect } from '../middleware/auth.js';
import {
    validateCreateUserCommand,
    validateUpdateUserCommand,
    validateExecuteUserCommand
} from '../middleware/validate.js';
import {
    createUserCommand,
    getUserCommands,
    getUserCommandById,
    updateUserCommand,
    deleteUserCommand,
    executeUserCommand
} from '../controllers/user-command.controller.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// CRUD routes
router.post('/', validateCreateUserCommand, createUserCommand);
router.get('/', getUserCommands);
router.get('/:id', getUserCommandById);
router.put('/:id', validateUpdateUserCommand, updateUserCommand);
router.delete('/:id', deleteUserCommand);

// Execute route
router.post('/execute', validateExecuteUserCommand, executeUserCommand);

export default router;