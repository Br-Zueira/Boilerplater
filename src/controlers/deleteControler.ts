import * as frontendControler from './frontendControler.js';
import * as helpers from '../helpers/helpers.js';
import * as databaseHelpers from '../helpers/databaseHelpers.js';
import * as vscode from 'vscode';
import { state } from './stateControler.js';

export async function submitDelete(id: number, model: string, panel: vscode.WebviewPanel) {
    // Model validation
    const validModels = ["snippets", "tags", "macros", "languages"];
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
        const result = state.db.query(/*SQL*/`SELECT * FROM macros WHERE id = ?`, [id])
        rawMacro = result?.[0] || [];
    }

    if (model === "languages") {
        // Checks if any snippets have this language
        const check = state.db.query(/*SQL*/`SELECT * FROM snippets WHERE language_id = ?`, [id])?.[0] || [];
        const mapped = databaseHelpers.formatRows(check?.columns, check?.values);

        // If there is at least one snippet with this language, activates the Alternate Language Deletion Protocol
        if (mapped && mapped[0] && mapped[0].language_id) {
            frontendControler.langDelete(id, mapped.length, panel);
            return;
        }
    }

    // Deleting the instance
    state.db.alter(/*SQL*/`DELETE FROM ${model} WHERE id = ?`, [id]);

    // If model is macro, then update all bigger eval_orders to go down
    if (model === "macros") {   
        const mappedMacro = databaseHelpers.formatRows(rawMacro.columns, rawMacro.values)?.[0] || null;
        if (mappedMacro) {
            state.db.alter(/*SQL*/`
                UPDATE macros
                SET eval_order = eval_order - 1
                WHERE eval_order > ?  
            `, [mappedMacro.eval_order]);
        }
    }

    // Redirect to avoid form resubmition
    frontendControler.list(model, 1, panel);
}

export function langDelete(formData: any, panel: vscode.WebviewPanel) {
    // Get info
    const { id: rawId = null, action: action = "", newLanguage: rawLangId = null } = formData;
    const id = !rawId || Number.isNaN(Number(rawId)) ? null : Number(rawId);
    const langId = !rawLangId || Number.isNaN(Number(rawLangId)) ? null : Number(rawLangId);
    
    // Safety rails
    if (!id) {
        helpers.sendError("Missing language id", panel);
        return;
    };
    if (!["changeDelete", "nuclearDelete"].includes(action)) {
        helpers.sendError("Select a valid option", panel);
        return;
    };

    if (action === "changeDelete") {
        // Safety rail
        if (!langId) {
            helpers.sendError("Select a language to replace the old one", panel);
            return;
        }

        try {
            // Updates snippets to use the new language
            state.db.alter(/*SQL*/`
                UPDATE snippets 
                SET language_id = ?
                WHERE language_id = ?;
            `, [langId, id]);
        } catch (err) {
            // Catch errors, meant specially foreign id constraint related errors
            if (err instanceof Error) {
                helpers.sendError(`Error: ${err.message}`, panel);
            }
            else {
                helpers.sendError(`Error: unknown error`, panel);
            }
            return;
        }
    }

    // Delete the language
    state.db.alter(/*SQL*/`
        DELETE FROM languages 
        WHERE id = ?;
    `, [id]);

    state.db.save();
    frontendControler.list('languages', 1, panel);
}