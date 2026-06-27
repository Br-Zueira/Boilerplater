import * as vscode from 'vscode';
import * as database from './database/database.js';
import * as pickupTextControler from './controlers/pickupTextControler.js'
import * as openWebViewControler from './controlers/openWebViewControler.js'

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
		await pickupTextControler.pickupTextControler(db);
	});

	const openWebView = vscode.commands.registerCommand('boilerplater.openWebView', async () => {
		await openWebViewControler.openWebViewControler(context, db);
	})

	context.subscriptions.push(pickupText, openWebView);
}

export function deactivate() {}
