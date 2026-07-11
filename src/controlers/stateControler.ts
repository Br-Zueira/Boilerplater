import * as vscode from 'vscode';
import * as database from '../database/database.js';

export class state {
    public static db: database.dataBase;
    public static context: vscode.ExtensionContext;
    public static lastActiveEditor: vscode.TextEditor | undefined;
    
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

        // initialized last active editor
        this.lastActiveEditor = vscode.window.activeTextEditor;
        return true;
    }
};