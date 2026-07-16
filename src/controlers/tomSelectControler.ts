import * as databaseHelpers from '../helpers/databaseHelpers';
import * as vscode from 'vscode';
import { state } from './stateControler.js';

export function searchTags(rawQuery: string, panel: vscode.WebviewPanel) {
    // Standardizes query
    const query = databaseHelpers.sanitizeLike(rawQuery);

    // Gets actual data
    const data = state.db.query("SELECT * FROM tags WHERE label LIKE ? ESCAPE '\\' LIMIT 50", [`%${query}%`]);
    const dataAmount = data.length;

    // Stores tags in a clean format
    let tags: any [] = [];

    // Uses for loop because it's faster
    for (let i = 0; i < dataAmount; i++) {
        const row = data[i];
        const formated = databaseHelpers.formatRows(row.columns, row.values)
        tags.push({ ...formated[0] });
    }

    // Send results back
    panel.webview.postMessage({
        command: 'receiveTags',
        payload: { tags: tags }
    });
}

export function searchLanguages(rawQuery: string, panel: vscode.WebviewPanel) {
    // Standardizes query
    const query = databaseHelpers.sanitizeLike(rawQuery);

    // Gets actual data
    const data = state.db.query("SELECT * FROM languages WHERE displayName LIKE ? ESCAPE '\\' LIMIT 50", [`%${query}%`]);
    const dataAmount = data.length;

    // Stores languages in a clean format
    let languages: any [] = [];

    // Uses for loop because it's faster
    for (let i = 0; i < dataAmount; i++) {
        const row = data[i];
        const formated = databaseHelpers.formatRows(row.columns, row.values)
        languages.push({ ...formated[0] });
    }

    // Sends results back
    panel.webview.postMessage({
        command: 'receiveLanguages',
        payload: { languages: languages }
    });
}

export function searchNewLangs(rawQuery: string, panel: vscode.WebviewPanel) {
    // Standardizes the query
    const query = databaseHelpers.sanitize(rawQuery).toLowerCase();

    // Gets all Vscode internal language ids
    const langs = state.langs;
    const amount = langs.length;

    // Checks to see if language doesn't already exist in database
    const data = state.db.query("SELECT * FROM languages WHERE internalName LIKE ? ESCAPE '\\' LIMIT 50", [`%${databaseHelpers.sanitizeLike(query)}%`])?.[0] || [];
    const formated = databaseHelpers.formatRows(data.columns, data.values);

    // Stores existing languages internal name
    let existingLangs = new Set<string>;

    // Uses for loop because it's faster
    for (let i = 0; i < formated.length; i++) {
        existingLangs.add( formated[i].internalName );
    }

    // Array of all results that matches query (in TomSelect compatible format)
    const results = new Array<object>;

    // Uses for loop because it's faster
    for (let i = 0; i < amount; i++) {
        const lang = langs[i];
        if (lang.includes(query) && !existingLangs.has(lang)) {
            results.push({internalName: lang});
        }
    }

    // Send results back
    panel.webview.postMessage({
        command: 'receiveNewLangs',
        payload: { languages: results }
    });
}