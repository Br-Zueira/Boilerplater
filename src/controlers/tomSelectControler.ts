import * as databaseHelpers from '../helpers/databaseHelpers';
import * as vscode from 'vscode';
import { state } from './stateControler.js';

export function searchTags(rawQuery: string, panel: vscode.WebviewPanel) {
    const query = databaseHelpers.sanitizeLike(rawQuery);
    const data = state.db.query("SELECT * FROM tags WHERE label LIKE ? ESCAPE '\\' LIMIT 50", [`%${query}%`]);
    let tags: any [] = [];
    for (const row of data) {
        const formated = databaseHelpers.formatRows(row.columns, row.values)
        tags.push({ ...formated[0] });
    }
    panel.webview.postMessage({
        command: 'receiveTags',
        payload: { tags: tags }
    });
}

export function searchLanguages(rawQuery: string, panel: vscode.WebviewPanel) {
    const query = databaseHelpers.sanitizeLike(rawQuery);
    const data = state.db.query("SELECT * FROM languages WHERE displayName LIKE ? ESCAPE '\\' LIMIT 50", [`%${query}%`]);
    let languages: any [] = [];
    for (const row of data) {
        const formated = databaseHelpers.formatRows(row.columns, row.values)
        languages.push({ ...formated[0] });
    }
    panel.webview.postMessage({
        command: 'receiveLanguages',
        payload: { languages: languages }
    });
}