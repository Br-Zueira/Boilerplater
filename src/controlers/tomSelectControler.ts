import * as databaseHelpers from '../helpers/databaseHelpers';

export function searchTags(rawQuery: string, db: any, panel: any) {
    const query = databaseHelpers.sanitizeLike(rawQuery);
    const data = db.query("SELECT * FROM tags WHERE label LIKE ? ESCAPE '\\' LIMIT 50", [`%${query}%`]);
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

export function searchLanguages(rawQuery: string, db: any, panel: any) {
    const query = databaseHelpers.sanitizeLike(rawQuery);
    const data = db.query("SELECT * FROM languages WHERE displayName LIKE ? ESCAPE '\\' LIMIT 50", [`%${query}%`]);
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