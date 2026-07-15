import * as vscode from 'vscode';
import * as templater from '../helpers/templater'; 
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
    const parsedSnippet = await templater.BPTemplater(snippet);
    
    // Actually pasting the snippet
    editor.insertSnippet(new vscode.SnippetString(parsedSnippet));

    // Confirms to user if snippet was actually pasted
    vscode.window.setStatusBarMessage('Snippet pasted successfully', 3000);
}