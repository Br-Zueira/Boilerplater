import * as vscode from 'vscode';
import { state } from './controlers/stateControler.js';
import * as pickupTextControler from './controlers/pickupTextControler.js'
import * as openWebViewControler from './controlers/openWebViewControler.js'

export async function activate(context: vscode.ExtensionContext) {
	// Initializes database and saves a context reference
	const success = await state.initialize(context);
	if (!success) return;

	// Function to save new snippets via highlighting and shortcut
	const pickupText = vscode.commands.registerCommand('boilerplater.pickupText', async () => {
		await pickupTextControler.pickupTextControler();
	});

	// Function to initialize the webview and the routes
	const openWebView = vscode.commands.registerCommand('boilerplater.openWebView', async () => {
		await openWebViewControler.openWebViewControler();
	})

	context.subscriptions.push(pickupText, openWebView);
}

export function deactivate() {}