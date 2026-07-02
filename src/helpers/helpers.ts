import * as vscode from 'vscode';

export async function getInput(prompt: string, placeHolder: string): Promise<string | undefined> {
    // Input popup
    const input = await vscode.window.showInputBox({
        prompt,
        placeHolder,
    });

    // If they hit Escape (undefined) or just press Enter without typing anything ('')
    if (!input || input.trim() === "") {
        return '';
    }

    return input.trim();
}

export function sendError(error: string, panel: any) {
    panel.webview.postMessage({
        command: 'error',
        payload: {error}
    });
}

export function sendStringCommand(command: string, string: string, panel: any) {
    panel.webview.postMessage({
        command,
        payload: {string}
    });
}