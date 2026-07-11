import * as vscode from 'vscode';

export async function getInput(prompt: string, placeHolder: string, ignoreFocusOut: boolean): Promise<string | undefined> {
    // Input popup
    const input = await vscode.window.showInputBox({
        prompt,
        placeHolder,
        ignoreFocusOut
    });

    // If they hit Escape (undefined) or just press Enter without typing anything ('')
    if (!input || input.trim() === "") {
        return '';
    }

    return input.trim();
}

export function sendError(error: string, panel: vscode.WebviewPanel) {
    panel.webview.postMessage({
        command: 'error',
        payload: {error}
    });
}

export function sendStringCommand(command: string, string: string, panel: vscode.WebviewPanel) {
    panel.webview.postMessage({
        command,
        payload: {string}
    });
}