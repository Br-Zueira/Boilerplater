export function searchTags(query: string, db: any, panel: any) {
    const tags = db.query("SELECT * FROM tags WHERE label LIKE ? LIMIT 50", [`%${query}%`]);
    panel.view.postMessage({
        command: 'receiveTags',
        payload: { tags: tags }
    });
}

export function searchLanguages(query: string, db: any, panel: any) {
    const languages = db.query("SELECT * FROM languages WHERE displayName LIKE ? LIMIT 50", [`%${query}%`]);
    panel.view.postMessage({
        command: 'receiveLanguages',
        payload: { languages: languages }
    });
}