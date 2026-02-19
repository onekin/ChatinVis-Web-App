import { validationResult } from 'express-validator';
import UserCommand from '../models/UserCommand.js';
import openaiService from '../services/openai.service.js';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

/**
 * Compila una especificación de comando usando IA
 * Toma la especificación del usuario y genera una descripción y plantilla de prompt optimizadas
 */
export const compileUserCommand = async (req, res, next) => {
    try {
        const { objective, scope, outputType, constraints, draftPrompt } = req.body;

        if (!objective) {
            return res.status(400).json({
                success: false,
                error: 'Objective is required for command compilation'
            });
        }

        // Construir el meta-prompt para la compilación
        const metaPrompt = `You are an AI prompt engineer. Create an optimized command for a mind mapping application based on the following specification:

**Objective**: ${objective}
**Scope**: ${scope || 'single_node'}
**Output Type**: ${outputType || 'text'}
**Constraints**: ${constraints || 'None specified'}
${draftPrompt ? `**User's Draft Prompt**: ${draftPrompt}` : ''}

Generate a JSON response with:
1. "description": A clear, concise description of what this command does (1-2 sentences)
2. "prompt_template": An optimized prompt template that will be sent to the LLM when executing this command. The template can use these placeholders:
   - {selected_nodes}: Will be replaced with the content of the nodes in scope
   - {scope}: The scope type (single_node, node_and_subnodes, selection, graph)
   - {output_type}: The expected output format
   - {node_count}: Number of nodes being processed

Make the prompt_template clear, specific, and designed to produce ${outputType} output.

Respond ONLY with valid JSON in this format:
{
  "description": "...",
  "prompt_template": "..."
}`;

        // Llamar a OpenAI usando LangChain
        const messages = [
            new SystemMessage('You are a helpful AI assistant that generates optimized prompts. Always respond with valid JSON only, no additional text.'),
            new HumanMessage(metaPrompt)
        ];

        const response = await openaiService.llm.invoke(messages);
        const responseText = response.content;

        let compiledData;
        try {
            // Remove markdown code blocks if present
            let cleanedResponse = responseText.trim();
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }
            
            compiledData = JSON.parse(cleanedResponse);
        } catch (parseError) {
            console.error('Failed to parse OpenAI response:', responseText);
            return res.status(500).json({
                success: false,
                error: 'Failed to parse AI response'
            });
        }

        res.status(200).json({
            success: true,
            description: compiledData.description,
            prompt_template: compiledData.prompt_template
        });

    } catch (error) {
        console.error('Compile user command error:', error);
        next(error);
    }
};

export const createUserCommand = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const {
            name,
            description,
            prompt_template,
            scope,
            outputType,
            constraints,
            originalSpec
        } = req.body;

        const userId = req.user.id;

        // Verify if the command alredy exists
        const existing = await UserCommand.findOne({ owner: userId, name });
        if (existing) {
            return res.status(409).json({
                success: false,
                error: 'You already have a command with this name'
            });
        }

        const userCommand = await UserCommand.create({
            name,
            description,
            prompt_template,
            scope,
            outputType,
            constraints,
            owner: userId,
            originalSpec: originalSpec || {}
        });

        await userCommand.populate('owner', 'name email');

        res.status(201).json({
            success: true,
            message: 'User command created successfully',
            data: userCommand
        });
    } catch (error) {
        console.error('Create user command error:', error);
        next(error);
    }
};

export const getUserCommands = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { includePublic = false } = req.query;

        let query = { owner: userId };

        const commands = await UserCommand.find(query)
            .populate('owner', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: commands.length,
            data: commands
        });
    } catch (error) {
        console.error('Get user commands error:', error);
        next(error);
    }
};

export const getUserCommandById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const command = await UserCommand.findOne({
            _id: id,
            $or: [
                { owner: userId },
                { isPublic: true }
            ]
        }).populate('owner', 'name email');

        if (!command) {
            return res.status(404).json({
                success: false,
                error: 'User command not found'
            });
        }

        res.json({
            success: true,
            data: command
        });
    } catch (error) {
        console.error('Get user command error:', error);
        next(error);
    }
};

export const updateUserCommand = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { id } = req.params;
        const userId = req.user.id;
        const updates = req.body;

        delete updates.owner;

        const command = await UserCommand.findOneAndUpdate(
            { _id: id, owner: userId },
            { $set: updates },
            { new: true, runValidators: true }
        ).populate('owner', 'name email');

        if (!command) {
            return res.status(404).json({
                success: false,
                error: 'User command not found or unauthorized'
            });
        }

        res.json({
            success: true,
            message: 'User command updated successfully',
            data: command
        });
    } catch (error) {
        console.error('Update user command error:', error);
        next(error);
    }
};

export const deleteUserCommand = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const command = await UserCommand.findOneAndDelete({
            _id: id,
            owner: userId
        });

        if (!command) {
            return res.status(404).json({
                success: false,
                error: 'User command not found or unauthorized'
            });
        }

        res.json({
            success: true,
            message: 'User command deleted successfully',
            data: command
        });
    } catch (error) {
        console.error('Delete user command error:', error);
        next(error);
    }
};

export const executeUserCommand = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { commandId, selectedNodes, params = {} } = req.body;
        const userId = req.user.id;

        // 1. Obtener el comando
        const command = await UserCommand.findOne({
            _id: commandId,
            $or: [
                { owner: userId },
                { isPublic: true }
            ]
        });

        if (!command) {
            return res.status(404).json({
                success: false,
                error: 'User command not found'
            });
        }

        if (!selectedNodes || selectedNodes.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No nodes selected'
            });
        }

        const nodesContext = selectedNodes.map(node => ({
            text: node.text || node.title,
            description: node.description || node.note || '',
            type: node.type || 'unknown'
        }));

        let finalPrompt = command.prompt_template;

        finalPrompt = finalPrompt
            .replace(/{selected_nodes}/g, JSON.stringify(nodesContext, null, 2))
            .replace(/{scope}/g, command.scope)
            .replace(/{output_type}/g, command.outputType)
            .replace(/{node_count}/g, selectedNodes.length.toString());

        // Reemplazar parámetros adicionales si los hay
        Object.keys(params).forEach(key => {
            const regex = new RegExp(`{${key}}`, 'g');
            finalPrompt = finalPrompt.replace(regex, params[key]);
        });

        console.log('\n=== Executing User Command ===');
        console.log('Command:', command.name);
        console.log('Scope:', command.scope);
        console.log('Nodes:', selectedNodes.length);
        console.log('Final Prompt (first 200 chars):', finalPrompt.substring(0, 200));
        console.log('\n--- FULL PROMPT ---');
        console.log(finalPrompt);
        console.log('\n--- END PROMPT ---\n');

        // Llamar directamente a OpenAI usando LangChain
        const messages = [
            new SystemMessage(`You are a helpful AI assistant. Generate output in ${command.outputType} format.`),
            new HumanMessage(finalPrompt)
        ];

        const response = await openaiService.llm.invoke(messages);
        const result = response.content;
        
        res.json({
            success: true,
            commandName: command.name,
            outputType: command.outputType,
            result: result,
            nodesProcessed: selectedNodes.length
        });

    } catch (error) {
        console.error('Execute user command error:', error);
        next(error);
    }
};