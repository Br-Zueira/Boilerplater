import * as frontendControler from './frontendControler.js';
import * as helpers from '../helpers/helpers.js';
import * as databaseHelpers from '../helpers/databaseHelpers.js';
import { state } from './stateControler.js';
import * as vscode from 'vscode';

export async function submitDelete(id: number, model: string, panel: any) {
    // Model validation
    const validModels = ["snippets", "tags", "macros"];
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
                description: "I'm aware this action cannot be undone, and I want to proceed with deleting it",
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

    // Querying macro before instance deletion for obvious reasons
    let rawMacro: any;
    if (model === "macros") {
        rawMacro = state.db.query(/*SQL*/`SELECT * FROM macros WHERE id = ?`, [id])?.[0] || [];
    }

    // Deleting the instance
    state.db.alter(/*SQL*/`DELETE FROM ${model} WHERE id = ?`, [id]);

    // If model is macro, then update all bigger eval_orders to go down
    if (model === "macros") {   
        const mappedMacro = databaseHelpers.formatRows(rawMacro.columns, rawMacro.values)?.[0] || [];
        if (mappedMacro) {
            state.db.alter(/*SQL*/`
                UPDATE macros
                SET eval_order = CASE
                    WHEN eval_order > ? THEN eval_order - 1
                    ELSE eval_order
                END
                WHERE eval_order > ?  
            `, [mappedMacro.eval_order, mappedMacro.eval_order]);
        }
    }

    // Redirect to avoid form resubmition
    frontendControler.list(model, 1, panel);
}