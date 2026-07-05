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
    const modelSingular = model.slice(0, -1);
    const confirmation = await vscode.window.showQuickPick(
        [
            {
                label: "$(trash) Yes, I'll delete it", 
                description: "I'm aware this action cannot be undone",
                action: 'delete'
            },

            {
                label: "$(circle-slash) No, I don't want to delete it", 
                description: `I prefer to keep this ${modelSingular}`,
                action: 'cancel'
            }
        ],
        {
            placeHolder: `Are you sure you want to delete this ${modelSingular}?`,
            ignoreFocusOut: true
        },
    )

    // Interrupts deleting if user cancels it
    if (confirmation?.action !== 'delete') return;

    // Deleting the instance
    db.alter(/*SQL*/`DELETE FROM ${model} WHERE id = ?`, [id]);

    // Redirect to avoid form resubmition
    frontendControler.list(model, 1, db, panel);
}