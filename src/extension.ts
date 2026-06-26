import * as vscode from 'vscode';
import * as database from './database/database.js';
import * as helpers from './helpers/helpers.js';
import * as html from './helpers/html.js';

export async function activate(context: vscode.ExtensionContext) {
	// Setting database up
	let db: any;
	try {
		db = await database.sqlInit(context);
	} catch (error: any) {
		vscode.window.showErrorMessage(`Failed to initialize database: ${error}`);
		return;
	}

	// Function to save new snippets via highlighting and shortcut
	const pickupText = vscode.commands.registerCommand('boilerplater.pickupText', async () => {
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
		const lang = db.exec('SELECT * FROM languages WHERE internalName = ?', [languageId]);

		// Language ID
		let lId: number;

		// If the language isn't on DB yet
		if (lang.length === 0) {
			// Create new language
			const displayName = languageId.charAt(0).toUpperCase() + languageId.slice(1);

			db.run('INSERT INTO languages (displayName, internalName) VALUES (?, ?)', [displayName, languageId]);

			// Get ID from new language
			const idResult = db.exec('SELECT last_insert_rowid();');

			lId = idResult[0].values[0][0] as number;

		// If language already exists
		} else {
			// Get ID from language that already exists
			lId = lang[0].values[0][0] as number;
		}

		// (Try to) save the snippet
		try {
			db.run('INSERT INTO snippets (title, description, snippet, language_id) VALUES (?, ?, ?, ?)', [title, description, highlightedCode, lId]);
			database.saveDB(db, context);
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
	});

	const openWebView = vscode.commands.registerCommand('boilerplater.openWebView', async () => {
		// Create web panel
		const panel = vscode.window.createWebviewPanel(
			'boilerplater.managerView', // Internal name
			'Boilerplater WebView', // Display name
			vscode.ViewColumn.One, // How to display the panel
			{
				enableScripts: true, // Important: lets JavaScript to be executed inside the panel
				retainContextWhenHidden: true // Panel is not killed when closed
			}
		);

		// Defines panel HTML content
		panel.webview.html = html.index();

		// Sets up panel-backend connection
		panel.webview.onDidReceiveMessage(
			async (message) => {
				if (message.command == "goToIndex") {
					panel.webview.html = html.index();
				}
				if (message.command == "goToManager") {
					panel.webview.html = html.list(message.payload.model, db);
				}
				if (message.command == "goToPage") {
					panel.webview.html = html.list(message.payload.model, db, message.payload.page);
				}
			},
			undefined,
			context.subscriptions
		);
	})

	context.subscriptions.push(pickupText, openWebView);
}

export function deactivate() {}
