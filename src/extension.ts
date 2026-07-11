import * as vscode from 'vscode';
import { state } from './controlers/stateControler.js';
import * as pickupTextControler from './controlers/pickupTextControler.js'
import * as openWebViewControler from './controlers/openWebViewControler.js'

export async function activate(context: vscode.ExtensionContext) {
	const initialized = await state.initialize(context);
	if (!initialized) return;

	// Update it whenever the user changes files
	vscode.window.onDidChangeActiveTextEditor(editor => {
		// Only update if the new active view is a real text document, not our webview
		if (editor) {
			state.lastActiveEditor = editor;
		}
	});

	// Function to save new snippets via highlighting and shortcut
	const pickupText = vscode.commands.registerCommand('boilerplater.pickupText', async () => {
		await pickupTextControler.pickupTextControler();
	});

	const openWebView = vscode.commands.registerCommand('boilerplater.openWebView', async () => {
		await openWebViewControler.openWebViewControler();
	})

	context.subscriptions.push(pickupText, openWebView);
}

export function deactivate() {}