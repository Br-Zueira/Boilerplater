import * as vscode from 'vscode';

export async function getInput(prompt: string, placeHolder: string): Promise<string | undefined> {
    const input = await vscode.window.showInputBox({
        prompt,
        placeHolder,
    });

    // If they hit Escape (undefined) or just press Enter without typing anything
    if (!input || input.trim() === "") {
        return ''; // Cancel operation quietly
    }

    return input.trim();
}