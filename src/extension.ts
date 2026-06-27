import * as vscode from 'vscode';
import * as database from './database/database.js';
import * as helpers from './helpers/helpers.js';
import * as layouts from './views/templates/layouts.js';
import * as htmlHelpers from './helpers/htmlHelpers.js';

export async function activate(context: vscode.ExtensionContext) {
	// Setting database up
	let db: any;
	try {
		db = new database.dataBase(context);
		await db.initialize();
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

		// Defines panel html content
		panel.webview.html = layouts.index();

		// Sets up panel-backend connection
		panel.webview.onDidReceiveMessage(
			async (message) => {
				const param = message.payload;
				switch (message.command) {
					case ("goToIndex"): {
						panel.webview.html = layouts.index();
						break;
					}

					case ("goToEdit"): {
						// Validates model coming
						const validModels = ["snippets", "tags", "languages"];
						if (!validModels.includes(param.model)) {
							return htmlHelpers.page404(`Model "${param.model}" does not exist`);
						}

						// Raw query response
						const rawObject = db.query(`SELECT * FROM ${param.model} WHERE id = ?`, [param.id])?.[0] || { columns: [], rows: [] };
						// Validates something is actually received
						if (!rawObject.values || rawObject.values.length <= 0) {
							return htmlHelpers.page404(`ID ${param.id} from "${param.model}" was not found`);
						}

						// Formated response
						const object = helpers.formatRows(rawObject.columns, rawObject.values);

						panel.webview.html = layouts.edit(param.model, object[0], param.id);
						break;
					}	

					case ("goToManager"):
					case ("goToPage"): {
						// Ensure model is valid (Software development 101 - Never trust user input)
						const validModels = ["snippets", "tags", "languages"];
						if (!validModels.includes(param.model)) {
							panel.webview.html = htmlHelpers.page404(`Model "${param.model}" does not exist`);
							break;
						}
							
						// Ensure page don't query for negative pages
						if (param.page < 1) {
							param.page = 1;
						}
					
						// Paginating info
						const perPage = 20;
						const offset = (param.page - 1) * perPage;
						const totalPages = db.getPages(param.model, perPage);
					
						// Ensure user doesn't try to read more pages than exist
						if (param.page > totalPages) {
							param.page = totalPages;
						}
					
						// Data
						const queryResult = db.query(`SELECT * FROM ${param.model} LIMIT ? OFFSET ?`, [perPage, offset]);
						const rawRows = queryResult[0] || { columns: [], values: [] };

						panel.webview.html = layouts.list(param.model, rawRows, param.page, totalPages, db);
						break;
					}

					default: {
						console.log("BOILERPLATER: ERROR - RECEIVED INVALID MESSAGE");
						break;
					}
				}
			},
			undefined,
			context.subscriptions
		);
	})

	context.subscriptions.push(pickupText, openWebView);
}

export function deactivate() {}
