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

export function formatRows(columns: Array<any> | undefined, rows: Array<any> | undefined) {
    const formattedData = [];

    // Safety gate
    if (!columns || !rows || !Array.isArray(rows) || rows.length === 0) {
        return []; // Returns safe []
    }

    // Loop through each row of values
    for (const rowValues of rows) {
        const itemObject: Record<string, any> = {};
        
        // For the first row, rowValues is [1, "First Snippet"]
        columns.forEach((colName, index) => {
            // Index 0: itemObject["id"] = 1
            // Index 1: itemObject["title"] = "First Snippet"
            itemObject[colName] = rowValues[index];
        });
        
        formattedData.push(itemObject);
    }
    return formattedData;
}