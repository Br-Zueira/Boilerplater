import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	const pickupText = vscode.commands.registerCommand('boilerplater.pickupText', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showWarningMessage('Open a file first!');
    	    return;
		}
		const selection = editor.selection;
		const highlightedCode = editor.document.getText(selection);

		if (!highlightedCode || highlightedCode.trim() === "") {
        	vscode.window.showWarningMessage('Please highlight some code first!');
        	return;
    	}

		vscode.window.showInformationMessage(`You highlighted: '${highlightedCode}'`)
	});

	context.subscriptions.push(pickupText);
}

export function deactivate() {}
