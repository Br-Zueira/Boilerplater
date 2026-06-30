import * as helpers from '../helpers/helpers.js'
import * as databaseHelpers from '../helpers/databaseHelpers.js';

export function submitEdit(model: string, id: number, formData: any, db: any, panel: any) {
    const validModels = ['snippets', 'tags', 'languages'];
    if (!validModels.includes(model)) {
        helpers.sendError(`Invalid model: "${model}" doesn't exist`, panel);
        return;
    }

    switch (model) {
        case 'snippets': {
            const { title = undefined, description = "", snippet = undefined, languageId = undefined } = formData;
            if (!title || !snippet || !languageId) {
                helpers.sendError(`Snippet lacks a required field: Either title, snippet or language`, panel);
                return;
            }

            const rawSnippetTags = db.query(/*SQL*/
                `SELECT * FROM snippet_tags 
                WHERE snippet_id = ?`, formData.id
            ) || { columns: [], rows: [] };
            let mappedSnippetTags: any[] = [];

            for (const row of rawSnippetTags) {
                const mappedRow = databaseHelpers.formatRows(row.column, row.values);
                mappedSnippetTags.push(mappedRow);
            }
            
            let existentTags: Number[] = [];
            let newTags: Number[] = [];
            let deleteTags: Number[] = [];

            for (const rawTag of formData.tags) {
                if (Number.isNaN(rawTag) || rawTag.trim() === '') {
                    helpers.sendError(`A sent tag ID isn't valid`, panel);
                    return;
                }
                const tagId = Number(rawTag)
                if (mappedSnippetTags.some((tag: any) => tag.id === tagId)) {
                    existentTags.push(tagId);
                } else {
                    newTags.push(tagId);
                }
            }

            for (const tag of mappedSnippetTags) {
                const id = Number(tag.id);
                if (!existentTags.includes(id)) {
                    deleteTags.push(id);
                }
            }
            
            db.alter(/*SQL*/`
                UPDATE snippets SET title = ?, 
                description = ?, 
                snippet = ?, 
                language_id = ?
                WHERE id = ?`, 
            [
                databaseHelpers.sanitize(title), 
                databaseHelpers.sanitize(description),
                databaseHelpers.sanitize(snippet),
                databaseHelpers.sanitize(languageId), 
                id
            ]);

            // Delete tags that are no longer associated with the snippet
            const removePlaceholders = deleteTags.map(() => '?').join(',');
            db.alter(/*SQL*/`
                DELETE FROM snippet_tags
                WHERE snippet_id = ? AND tag_id IN (${removePlaceholders})`,
            [id, ...deleteTags]);

            // Add new tags that are associated with the snippet
            const addPlaceholders = newTags.map(() => '(?, ?)').join(',');
            const addParams = newTags.flatMap(tagId => [id, tagId]);
            db.alter(/*SQL*/`
                INSERT INTO snippet_tags (snippet_id, tag_id)
                VALUES ${addPlaceholders}`,
            addParams);
            
            // Model name to be displayed in the success message (From 'snippets' to 'Snippet', for example)
            const showModel = model[0].toUpperCase() + model.slice(1, -1);

            // Success message
            helpers.sendStringMessage(`success`, `${showModel} successfully edited`, panel);
            break;
        }
        case 'tags': {
            const { label = undefined } = formData;
            if (!label) {
                helpers.sendError(`Tag lacks a required field: label`, panel);
                return;
            }
            db.alter(/*SQL*/`
                UPDATE tags SET label = ?
                WHERE id = ?`, 
            [
                databaseHelpers.sanitize(label), 
                id
            ]);
            helpers.sendStringMessage(`success`, `Tag successfully edited`, panel);
            break;
        }
        case 'languages': {
            const { displayName = undefined } = formData;
            if (!displayName) {
                helpers.sendError(`Language lacks a required field: display Name`, panel);
                return;
            }
            db.alter(/*SQL*/`
                UPDATE languages SET displayName = ?
                WHERE id = ?`, 
            [
                databaseHelpers.sanitize(displayName),
                id
            ]);
            helpers.sendStringMessage(`success`, `Language successfully edited`, panel);
            break;
        }
    }
}