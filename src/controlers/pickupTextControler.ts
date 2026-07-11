import * as vscode from 'vscode';
import * as helpers from '../helpers/helpers.js';
import { state } from './stateControler.js';

export async function pickupTextControler() {
    // Refers to the open code editor/file (such as this one right now!)
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('Open a file first!');
        return;
    }

    // Reads the selected code
    const selection = editor.selection;
    const highlightedCode = editor.document.getText(selection);
    if (!highlightedCode || highlightedCode.trim() === "") {
        vscode.window.showErrorMessage('Please highlight some code first!');
        return;
    }

    // Asks for the snippet details
    const title = await helpers.getInput(
        'Give a title to your snippet (let empty to cancel operation)',
        'My beautiful boilerplate',
        true
    );
    if (!title) return;

    const description = await helpers.getInput(
        'Give a description to your snippet (optional)',
        'This snippet is for...',
        true
    );

    // Get the language part
    const languageInternalName = editor.document.languageId;
    const existingLang = state.db.query(/*SQL*/`
        SELECT * FROM languages 
        WHERE internalName = ?`, [languageInternalName]
    );

    // Language ID
    let languageId: number;

    // If the language isn't on DB yet
    if (existingLang.length === 0) {
        // Create new language
        const displayName = languageInternalName.charAt(0).toUpperCase() + languageInternalName.slice(1);

        state.db.query(/*SQL*/`
            INSERT INTO languages (displayName, internalName) 
            VALUES (?, ?)
            `, [displayName, languageInternalName]
        );

        // Get ID from new language
        const idResult = state.db.query(/*SQL*/`
            SELECT last_insert_rowid();
        `);

        languageId = idResult[0].values[0][0] as number;

    // If language already exists
    } else {
        // Get ID from language that already exists
        languageId = existingLang[0].values[0][0] as number;
    }

    // (Try to) save the snippet
    try {
        state.db.query(/*SQL*/`
            INSERT INTO snippets (title, description, snippet, language_id) 
            VALUES (?, ?, ?, ?)
            `, [title, description, highlightedCode, languageId]
        );
        state.db.save();
    } catch (error: any) {
        if (error.message) {
            vscode.window.showErrorMessage(`Error: ${error.message}`);
            return;
        }
    }
    vscode.window.showInformationMessage(`Snippet '${title}' saved successfully`);
}