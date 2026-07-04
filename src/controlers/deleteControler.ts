import * as frontendControler from './frontendControler.js';
import * as helpers from '../helpers/helpers.js';
import * as vscode from 'vscode';

export async function submitDelete(id: number, model: string, db: any, panel: any) {
    // Model validation
    const validModels = ["snippets", "tags"];
    if (!validModels.includes(model)) {
        helpers.sendError(`Invalid model: ${model} doesn't exist or can't be deleted`, panel);
        return;
    }

    // Warns user if they want to proceed with deleting and gives a chance to come back
    const confirmation = await vscode.window.showWarningMessage(
        `Are you sure you want to delete this ${model.slice(0, -1)}?`,
        {
            modal: true,
            detail: 'This action cannot be undone.'
        },
        'Confirm',
        'Cancel'
    )

    // Interrupts deleting if user cancels it
    if (confirmation !== 'Confirm') return;

    // Deleting the instance
    db.alter(/*SQL*/`DELETE FROM ${model} WHERE id = ?`, [id]);

    // Redirect to avoid form resubmition
    frontendControler.list(model, 1, db, panel);
}