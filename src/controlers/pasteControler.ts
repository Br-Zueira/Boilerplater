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
    const parsedSnippet = await BPTemplater(snippet);
    
    // Actually pasting the snippet
    editor.insertSnippet(new vscode.SnippetString(parsedSnippet));

    // Confirms to user if snippet was actually pasted
    vscode.window.setStatusBarMessage('Snippet pasted successfully', 3000);
}

async function BPTemplater(snippet: string): Promise<string> {
    const clipboard = await vscode.env.clipboard.readText() || '';

    // Match anything inside [% ... %]
    const placeholderRegex = /\[%(.*?)%\]/g;
    const evaluated = snippet.replace(placeholderRegex, (match, jsExpression) => {
        try {
            // Evaluates the JavaScript expressions
            const vars = new templaterVariables(clipboard);
            const expression = new Function(...vars.getVars(), `return ${jsExpression};`);
            return String(expression(...vars.getValues()));
        } catch (err) {
            // If anything goes wrong, shows it to user
            let error = `Error: couldn't evaluate "${jsExpression.trim()}"`;
            if (err instanceof Error) {
                error += ` - ${err.message}`;
            } else {
                error += " - Unknown Error"
            }
            vscode.window.showWarningMessage(error);
            console.warn(error);
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
            defaultValue = tabstop.slice(separator + 1).trim();
            if (!defaultValue) {
                const error = `Error at "${match}": Default value sign '|' was put, but no default value specified`;
                vscode.window.showWarningMessage(error);
                console.warn(error);
                return match;
            }
        } else {
            // The whole thing is only index
            index = tabstop.trim();
        }

        // Index must be a number, and this verifies it
        if (!index || isNaN(Number(index))) {
            const error = `Invalid tabstop: "${match}" tabstop index is missing or isn't a number`
            vscode.window.showWarningMessage(error);
            console.warn(error);
            return match;
        }

        if (defaultValue) {
            // "${index:defaultValye}"
            return "${" + index + ":" + defaultValue + "}";
        } else {
            // "$index"
            return `$${index}`;
        }
    });
    return tabStopped;
}

// Define an interface matching your package.json structure for type safety
interface CustomVariable {
    name: string;
    value: string | Array<string>;
    description?: string;
}

class templaterVariables {
    private defaultVars: Record<string, string> = {
        BP_FILENAME: '',
        BP_FILENAME_EXT: '',
        BP_EXT: '',
        BP_DIRECTORY_NAME: '',
        BP_WORKSPACE_NAME: '',

        BP_YEAR: '',
        BP_MONTH: '',
        BP_DAY: '',

        BP_SELECTED_TEXT: '',
        BP_CLIPBOARD: ''
    }

    private customVars: Record<string, any> = {};

    private vars: Record<string, any> = {};

    // Explicitly override global access points to prevent malicious scripts or accidental errors
    private forbiddenKeys = ['global', 'globalThis', 'process', 'require', 'eval', 'module', 'Function'];
    private forbiddenValues = this.forbiddenKeys.map(() => undefined);

    // Get the variable names
    public getVars(): string[] {
        return [...Object.keys(this.vars), ...this.forbiddenKeys];
    }

    // Get the variable values
    public getValues(): (string | Function | undefined)[] {
        return [...Object.values(this.vars), ...this.forbiddenValues];
    }

    // Only gets the clipboard text from outside because vscode.env.clipboard.readText() is an async function
    constructor(clipboard: string = '') {
        // Standard variables
        const editor = vscode.window.activeTextEditor;
        const document = editor?.document;
        const fullPath = document?.fileName || 'untitled.txt';
        const ext = path.extname(fullPath);
        const workspaceFolder = document ? vscode.workspace.getWorkspaceFolder(document.uri) : undefined;

        // This comments are examples of the output model of each function
        // script
        this.defaultVars.BP_FILENAME = path.basename(fullPath, ext);

        // script.ts
        this.defaultVars.BP_FILENAME_EXT = path.basename(fullPath);

        // .ts
        this.defaultVars.BP_EXT = ext;

        // /home/user/vscode/my-project
        this.defaultVars.BP_DIRECTORY_NAME = path.dirname(fullPath);

        // my-project
        this.defaultVars.BP_WORKSPACE_NAME = workspaceFolder ? workspaceFolder.name : '';

        // Date and time variables
        const now = new Date();
        this.defaultVars.BP_YEAR = String(now.getFullYear());
        this.defaultVars.BP_MONTH = String(now.getMonth() + 1).padStart(2, '0');
        this.defaultVars.BP_DATE = String(now.getDate()).padStart(2, '0');

        // Selected variable
        this.defaultVars.BP_SELECTED_TEXT = editor ? editor.document.getText(editor.selection) : '';
        
        // Clipboard var
        this.defaultVars.BP_CLIPBOARD = clipboard;

        // Deals with custom variables, defined in settings
        const config = vscode.workspace.getConfiguration('boilerplater');

        // Gets the variables at configs using the default layout
        const variables = config.get<CustomVariable[]>('customVariables', []);

        // Process the value of each writte variable
        variables.forEach((vari: CustomVariable) => {
            // Avoid errors
            if (!vari || !vari.name || !vari.value) return;

            // Joins every string into a single string
            const code = Array.isArray(vari.value) ? vari.value.join("\n") : vari.value;

            // Passes as arguments some of the possibly wanted dependencies and variables
            const varFunc = new Function(...Object.keys(this.defaultVars), ...this.forbiddenKeys, 'vscode', 'path', 'context', code);
            try {
                // Uses the function defined before to get the variable value
                const result = varFunc(...Object.values(this.defaultVars), ...this.forbiddenValues, vscode, path, state.context);
                
                // Add the variables to the record for later use
                this.customVars[vari.name] = result;
            } catch (err) {
                // Throws an error if variable can't be processed
                let errorMessage = `Error while processing ${vari.name}: `;
                if (err instanceof Error) {
                    errorMessage += err.message;
                } else {
                    errorMessage += "Unknown error"
                }
                console.warn(errorMessage);
                vscode.window.showWarningMessage(errorMessage);
            }
        });

        // Merges both the default and custom variables to be passed to the template evaluator
        this.vars = {...this.defaultVars, ...this.customVars};
    }
}