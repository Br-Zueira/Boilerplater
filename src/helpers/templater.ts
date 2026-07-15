import * as vscode from 'vscode';
import * as path from 'path';
import { state } from '../controlers/stateControler';

export async function BPTemplater(snippet: string): Promise<string> {
    const vars = new templaterVariables();
    await vars.setValues();

    // Match anything inside [% ... %]
    const placeholderRegex = /\[%(.*?)%\]/g;
    const evaluated = snippet.replace(placeholderRegex, (match, jsExpression) => {
        try {
            // Evaluates the JavaScript expressions
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

// Define an interface matching package.json structure for type safety
interface CustomVariable {
    name: string;
    value: string | Array<string>;
    description?: string;
}

class templaterVariables {
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

    public async setValues() {
        // Standard variables
        const editor = vscode.window.activeTextEditor;
        const document = editor?.document;
        const fullPath = document?.fileName || 'untitled.txt';
        const ext = path.extname(fullPath);
        const workspaceFolder = document ? vscode.workspace.getWorkspaceFolder(document.uri) : undefined;

        // This comments are examples of the output model of each function
        // script
        this.vars.BP_FILENAME = path.basename(fullPath, ext);

        // script.ts
        this.vars.BP_FILENAME_EXT = path.basename(fullPath);

        // .ts
        this.vars.BP_EXT = ext;

        // /home/user/vscode/my-project
        this.vars.BP_DIRECTORY_NAME = path.dirname(fullPath);

        // my-project
        this.vars.BP_WORKSPACE_NAME = workspaceFolder ? workspaceFolder.name : '';

        // Date and time variables
        const now = new Date();
        this.vars.BP_YEAR = String(now.getFullYear());
        this.vars.BP_MONTH = String(now.getMonth() + 1).padStart(2, '0');
        this.vars.BP_DATE = String(now.getDate()).padStart(2, '0');

        // Selected variable
        this.vars.BP_SELECTED_TEXT = editor ? editor.document.getText(editor.selection) : '';
        
        // Clipboard var
        this.vars.BP_CLIPBOARD = await vscode.env.clipboard.readText() || '';

        // Deals with custom variables, defined in settings
        const config = vscode.workspace.getConfiguration('boilerplater');

        // Gets the variables at configs using the default layout
        const variables = config.get<CustomVariable[]>('customVariables', []);

        // Process the value of each writte variable
        for (const vari of variables) {
            // Avoid errors
            if (!vari || !vari.name || !vari.value) return;

            // Joins every string into a single string
            const code = Array.isArray(vari.value) ? vari.value.join("\n") : vari.value;

            try {
                // Passes as arguments some of the possibly wanted dependencies and variables
                const varFunc = new Function(...this.getVars(), 'vscode', 'path', 'context', code);
                
                // Uses the function defined before to get the variable value
                const result = await varFunc(...this.getValues(), vscode, path, state.context);
                
                // Add the variables to the record for later use
                this.vars[vari.name] = result;
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
        }
    }
}