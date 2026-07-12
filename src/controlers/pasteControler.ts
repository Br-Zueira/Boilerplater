import * as vscode from 'vscode';
import * as path from 'path'; 
import * as databaseHelpers from '../helpers/databaseHelpers';
import { state } from './stateControler.js';

export async function paste(is_edit_view: boolean = false, id: number = 0, rawSnippet: string = ''){
    let snippet: string = ''; 

    if (is_edit_view) {
        snippet = databaseHelpers.sanitize(rawSnippet);
    } else {
        if (id <= 0) {
            vscode.window.showErrorMessage("Invalid snippet id, couldn't paste it");
            return;
        }
        const dbSnippet = state.db.query(/*SQL*/`
            SELECT * FROM snippets
            WHERE id = ?
        `, [id])?.[0] || [];
        const formatedDbSnippet = databaseHelpers.formatRows(dbSnippet.columns, dbSnippet.values)?.[0];
        snippet = formatedDbSnippet.snippet;
    }

    if (!snippet) {
        vscode.window.showErrorMessage('No snippet to paste');
        return;
    }

    // Had to add a new reference to it to shut up compiler :) (dont ask me about tsc logic)
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('You need to be in an editor to paste a snippet (try to focus your cursor in the file)');
        return;
    };

    // Placeholder managment
    const parsedSnippet = BPTemplater(snippet);
    
    // Actually pasting the snippet
    editor.insertSnippet(new vscode.SnippetString(parsedSnippet));

    // Confirms to user if snippet was actually pasted
    vscode.window.setStatusBarMessage('Snippet pasted successfully', 3000);
}

function BPTemplater(snippet: string): string {
    // Match anything inside [% ... %]
    const placeholderRegex = /\[%(.*?)%\]/g;
    const evaluated = snippet.replace(placeholderRegex, (match, jsExpression) => {
        try {
            // Evaluates the JavaScript expressions
            const expression = new Function(`return ${jsExpression};`);
            return String(expression());
        } catch (err) {
            // If anything goes wrong, shows it to user
            const error = `Error: couldn't evaluate '${jsExpression}`;
            vscode.window.showWarningMessage(error);
            if (err instanceof Error) {
                console.warn(error + ` - ${err.message}`);
            } else {
                console.warn(error + ` - Unknown error`);
            }
            return match;
        }
    });

    // Escape dollar signs so Vscode parser take them as literal strings
    const escaped = evaluated.replace(/\$/g, () => '\\$');

    // Match tab-stops inside [# ... #]
    // Can be either 
    // [# index #] Or
    // [# index | defaultValue #]
    const tabstopRegex = /\[#(.*?)#\]/g;

    // Custom tabstop processor
    // A tabstop lets user insert syntax like '$0' and '$1', 
    // then navigate through them with tab and change each one easily,
    // and it can have a default value to be insert like '$0:Main'
    const tabStopped = escaped.replace(tabstopRegex, (match, tabstop) => {
        // Optional sign to have both index (required) and default value (optional)
        const separator = tabstop.indexOf("|");

        // Index is is a number that ends up like '$i', where i = index, 
        // while (optional) defaultValue is a string
        // It ends up like '$i:defaultValue' (or only '$i' if no default value)
        let index: string = "";
        let defaultValue: string = "";

        // If default value sign '|' is found
        if (separator > -1) {
            // Half before separator (number)
            index = tabstop.slice(0, separator).trim();

            // Half after separator (string)
            defaultValue = ':' + tabstop.slice(separator + 1).trim();
            if (!defaultValue) {
                const error = `Error at '${match}' Default value sign '|' was put, but no default value specified`;
                vscode.window.showWarningMessage(error);
                console.warn(error);
                return match;
            }
        } else {
            // The whole thing is only index
            index = tabstop;
        }

        // Index must be a number, and this verifies it
        if (!index || isNaN(Number(index))) {
            const error = `Invalid tabstop: '${match}' tabstop index is missing or isn't a number`
            vscode.window.showWarningMessage(error);
            console.warn(error);
            return match;
        }

        return `$${index}${defaultValue}`
    });
    return tabStopped;
}

class templaterVariables {
    public vars: Record<string, string> = {
        BP_FILENAME: '',
        BP_FILENAME_EXT: ''
    }

    constructor() {
        const editor = vscode.window.activeTextEditor;
        const document = editor?.document;
        const fullPath = document?.fileName || 'untitled.txt';
        const ext = path.extname(fullPath);

        this.vars.BP_FILENAME_EXT = path.basename(fullPath);
        this.vars.BP_FILENAME = path.basename(fullPath, ext);
    }
}