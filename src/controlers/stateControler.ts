import * as vscode from 'vscode';
import * as database from '../database/database.js';

export class state {
    public static db: database.dataBase;
    public static context: vscode.ExtensionContext;
    public static langs: string[];
    
    public static async initialize(newContext: vscode.ExtensionContext): Promise<boolean> {
        // Initializing context
        this.context = newContext;
        
        // Initializing database
        try {
            this.db = new database.dataBase();
            await this.db.initialize();
        } catch (error: any) {
            const message = `Boilerplater: Failed to initialize database: ${error}`;
            vscode.window.showErrorMessage(message);
            console.error(message);
            return false;
        }

        // This is for languages TomSelect
        this.langs = await vscode.languages.getLanguages();

        // Confirm that everything went fine
        return true;
    }
};