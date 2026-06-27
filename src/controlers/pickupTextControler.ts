import * as vscode from 'vscode';
import * as helpers from '../helpers/helpers.js';

export async function pickupTextControler(db: any) {
    // Refers to the open code editor/file (such as this one right now!)
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('Open a file first!');
        return;
    }

    // Reads the selected code
    const selection = editor.selection;
    const highlightedCode = editor.document.getText(selection);
    if (!highlightedCode || highlightedCode.trim() === "") {
        vscode.window.showWarningMessage('Please highlight some code first!');
        return;
    }

    // Asks for the snippet details
    const title = await helpers.getInput(
        'Give a title to your snippet', // Prompt
        'My beautiful boilerplate' // PlaceHolder
    );
    if (!title) return;

    const description = await helpers.getInput(
        'Give a description to your snippet (optional)',
        'This snippet is for...'
    );

    // Get the language part
    const languageId = editor.document.languageId;
    const lang = db.query('SELECT * FROM languages WHERE internalName = ?', [languageId]);

    // Language ID
    let lId: number;

    // If the language isn't on DB yet
    if (lang.length === 0) {
        // Create new language
        const displayName = languageId.charAt(0).toUpperCase() + languageId.slice(1);

        db.query('INSERT INTO languages (displayName, internalName) VALUES (?, ?)', [displayName, languageId]);

        // Get ID from new language
        const idResult = db.query('SELECT last_insert_rowid();');

        lId = idResult[0].values[0][0] as number;

    // If language already exists
    } else {
        // Get ID from language that already exists
        lId = lang[0].values[0][0] as number;
    }

    // (Try to) save the snippet
    try {
        db.query('INSERT INTO snippets (title, description, snippet, language_id) VALUES (?, ?, ?, ?)', [title, description, highlightedCode, lId]);
        db.save();
    } catch (error: any) {
        // If the error is related to duplicates of unique-only values
        if (error.message && error.message.includes('UNIQUE constraint failed')) {
            vscode.window.showWarningMessage('You tried to use an already existing title');
            return;
        } else {
            vscode.window.showWarningMessage(`Error: ${error}`);
            return;
        }
    }
    vscode.window.showInformationMessage(`Snippet '${title}' saved successfully`);
}