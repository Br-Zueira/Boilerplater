import * as helpers from '../helpers/helpers.js'
import * as databaseHelpers from '../helpers/databaseHelpers.js';
import { state } from './stateControler.js';

export function submitEdit(model: string, id: number, formData: any, panel: any) {
    // Validating model
    const validModels = ['snippets', 'tags', 'languages', 'macros'];
    if (!validModels.includes(model)) {
        helpers.sendError(`Invalid model: "${model}" doesn't exist`, panel);
        return;
    }

    switch (model) {
        case 'snippets': {
            // Validating required fields
            const { title: rawTitle = "", description: rawDescription = "", snippet: rawSnippet = "", language: rawLanguageId = null } = formData;

            // Sanitizing inputs to prevent SQL injection and other potential issues
            const title = databaseHelpers.sanitize(rawTitle) || null;
            const description = databaseHelpers.sanitize(rawDescription) || null; // Optional field, can be null
            const snippet = databaseHelpers.sanitize(rawSnippet) || null;
            
            // Validating languageId to ensure it's a number or null
            const languageId = !rawLanguageId || Number.isNaN(Number(rawLanguageId)) ? null : Number(rawLanguageId);

            // Ensuring that all required fields are present
            if (!title || !snippet || !languageId) {
                helpers.sendError(`Snippet lacks a required field: Either title, snippet or language`, panel);
                return;
            }

            // Get the current tags associated with the snippet from the database
            const rawSnippetTags = state.db.query(/*SQL*/
                `SELECT * FROM snippet_tags 
                WHERE snippet_id = ?`, [formData.id]
            )?.[0] || [];
            
            // Sets to hold the IDs of tags that are already associated, new tags to be added, and tags to be removed 
            const existingTags = new Set<number>();

            const maintainTags = new Set<number>();
            const newTags = new Set<number>();
            const deleteTags = new Set<number>();

            if (rawSnippetTags && rawSnippetTags.columns && rawSnippetTags.values) {
                const mappedSnippetTags = databaseHelpers.formatRows(rawSnippetTags.columns, rawSnippetTags.values);

                for (const row of mappedSnippetTags) {
                    existingTags.add(row.tag_id);
                }
            }

            // Looping through the tags sent in the form data to determine which tags are new, which are existing, and which should be deleted
            for (const rawTag of formData.tags) {
                // Sanitizing and validating the tag ID to ensure it's a number
                const tagId = Number(rawTag)

                if (!rawTag || rawTag.trim() === '' || Number.isNaN(tagId)) {
                    helpers.sendError(`A sent tag ID isn't valid`, panel);
                    return;
                }

                if (existingTags.has(tagId)) {
                    maintainTags.add(tagId);
                } else {
                    newTags.add(tagId);
                }
            }

            // Looping through the existing tags to determine which ones should be deleted 
            for (const tag of existingTags) {
                if (!maintainTags.has(tag)) {
                    deleteTags.add(tag);
                }
            }

            // Updating the snippet in the database with the new values
            try {
                state.db.alter(/*SQL*/`
                    UPDATE snippets SET title = ?, 
                    description = ?, 
                    snippet = ?, 
                    language_id = ?
                    WHERE id = ?`, 
                [
                    title, 
                    description,
                    snippet,
                    languageId, 
                    id
                ]);
            } catch (error) {
                if (error instanceof Error) {
                    helpers.sendError(`Failed to edit snippet: ${error.message}`, panel);
                    return;
                } else {
                    helpers.sendError(`Failed to edit snippet: An unknown error occurred`, panel);
                    return;
                }
            }

            // Delete tags that are no longer associated with the snippet
            if (deleteTags.size > 0) {
                const removePlaceholders = [...deleteTags].map(() => '?').join(',');
                const values = [id, ...deleteTags];
                state.db.alter(/*SQL*/`
                    DELETE FROM snippet_tags
                    WHERE snippet_id = ? AND tag_id IN (${removePlaceholders})`,
                values);
            }

            // Add new tags that are now associated with the snippet
            if (newTags.size > 0) {
                const addPlaceholders = [...newTags].map(() => '(?, ?)').join(',');
                const addParams = [...newTags].flatMap(tagId => [id, tagId]);
                state.db.alter(/*SQL*/`
                    INSERT INTO snippet_tags (snippet_id, tag_id)
                    VALUES ${addPlaceholders}`,
                addParams);
            }
            
            // Model name to be displayed in the success message (From 'snippets' to 'Snippet', for example)
            const showModel = model[0].toUpperCase() + model.slice(1, -1);

            // Success message
            state.db.save();
            helpers.sendStringCommand(`success`, `${showModel} successfully edited`, panel);
            break;
        }
        case 'tags': {
            // Validating required fields
            const { label: rawLabel = '' } = formData;
            const label = databaseHelpers.sanitize(rawLabel) || null;
            
            // Ensuring that the required field is present
            if (!label) {
                helpers.sendError(`Tag lacks a required field: label`, panel);
                return;
            }

            // Updating the tag in the database with the new value
            try {
                state.db.alter(/*SQL*/`
                    UPDATE tags SET label = ?
                    WHERE id = ?`, 
                [
                    label, 
                    id
                ]);
            } catch (error) {
                if (error instanceof Error) {
                    if (error.message.includes('UNIQUE constraint failed')) {
                        helpers.sendError(`Failed to edit tag: A tag with the label "${label}" already exists`, panel);
                        return;
                    }
                    helpers.sendError(`Failed to edit tag: ${error.message}`, panel);
                    return;
                } else {
                    helpers.sendError(`Failed to edit tag: An unknown error occurred`, panel);
                    return;
                }
            }

            // Success message
            state.db.save();
            helpers.sendStringCommand(`success`, `Tag successfully edited`, panel);
            break;
        }
        case 'languages': {
            // Validating required fields
            const { displayName: rawDisplayName = '', internalName: internalName, aliases: rawAliases = '' } = formData;
            const displayName = databaseHelpers.sanitize(rawDisplayName) || null;
            const aliases = databaseHelpers.sanitize(rawAliases) || null;

            // Ensuring that the required field is present
            if (!displayName || !internalName) {
                helpers.sendError(`Language lacks a required field: display name or internal name`, panel);
                return;
            }
            if (!state.langs.includes(internalName)) {
                helpers.sendError(`Internal name "${internalName}" doesn't exist in Vscode`, panel);
                return;
            }

            // Updating the language in the database with the new value
            try {
                state.db.alter(/*SQL*/`
                    UPDATE languages SET displayName = ?, internalName = ?, aliases = ?
                    WHERE id = ?`, 
                [
                    displayName,
                    internalName,
                    aliases,
                    id
                ]);
            } catch (error) {
                if (error instanceof Error) {
                    if (error.message.includes('UNIQUE constraint failed')) {
                        helpers.sendError(`Failed to edit language: A language with the display name "${displayName}" already exists`, panel);
                        return;
                    }
                    helpers.sendError(`Failed to edit language: ${error.message}`, panel);
                    return;
                } else {
                    helpers.sendError(`Failed to edit language: An unknown error occurred`, panel);
                    return;
                }
            }

            // Success message
            state.db.save();
            helpers.sendStringCommand(`success`, `Language successfully edited`, panel);
            break;
        }
        case 'macros': {
            // Validating required fields
            const { title: rawTitle = "", description: rawDescription = "", macro: rawMacro = "", eval_order: rawEvalOrder = null } = formData;

            // Sanitizing inputs to prevent SQL injection and other potential issues
            const title = databaseHelpers.sanitize(rawTitle) || null;
            const description = databaseHelpers.sanitize(rawDescription) || null; // Optional field, can be null
            const macro = databaseHelpers.sanitize(rawMacro) || null;
            
            // Validating evalOrder to ensure it's a number or null
            let evalOrder = !rawEvalOrder || Number.isNaN(Number(rawEvalOrder)) ? 0 : Number(rawEvalOrder);

            // Avoids either empty evalOrder, values bigger than needed and negative values
            const beo = state.db.query(/*SQL*/`SELECT COALESCE(MAX(eval_order), 0) AS beo FROM macros;`)[0];
            const mB = databaseHelpers.formatRows(beo.columns, beo.values)[0]?.beo || 0;
            if ((evalOrder > mB + 1 || evalOrder < 1) && evalOrder !== mB) {
                evalOrder = mB + 1;
            }

            // Ensuring that all required fields are present
            if (!title || !macro) {
                helpers.sendError(`Macro lacks a required field: Either title or macro`, panel);
                return;
            }

            // Get the current tags associated with the snippet from the database
            const rawMacrosTags = state.db.query(/*SQL*/
                `SELECT * FROM macros_tags 
                WHERE macro_id = ?`, [formData.id]
            )?.[0] || [];
            
            // Sets to hold the IDs of tags that are already associated, new tags to be added, and tags to be removed 
            const existingTags = new Set<number>();

            const maintainTags = new Set<number>();
            const newTags = new Set<number>();
            const deleteTags = new Set<number>();

            if (rawMacrosTags && rawMacrosTags.columns && rawMacrosTags.values) {
                const mappedMacrosTags = databaseHelpers.formatRows(rawMacrosTags.columns, rawMacrosTags.values);

                for (const row of mappedMacrosTags) {
                    existingTags.add(row.tag_id);
                }
            }

            // Looping through the tags sent in the form data to determine which tags are new, which are existing, and which should be deleted
            for (const rawTag of formData.tags) {
                // Sanitizing and validating the tag ID to ensure it's a number
                const tagId = Number(rawTag)

                if (!rawTag || rawTag.trim() === '' || Number.isNaN(tagId)) {
                    helpers.sendError(`A sent tag ID isn't valid`, panel);
                    return;
                }

                if (existingTags.has(tagId)) {
                    maintainTags.add(tagId);
                } else {
                    newTags.add(tagId);
                }
            }

            // Looping through the existing tags to determine which ones should be deleted 
            for (const tag of existingTags) {
                if (!maintainTags.has(tag)) {
                    deleteTags.add(tag);
                }
            }

            // Updating the snippet in the database with the new values
            try {
                // First put an invalid eval_order to avoid UNIQUE constraint violations
                state.db.alter(/*SQL*/`
                    UPDATE macros
                    SET eval_order = 0
                    WHERE id = ?;
                `, [id]);

                // Then pushes all the macros that come later to go even later and open a hole
                state.db.alter(/*SQL*/`
                    UPDATE macros
                    SET eval_order = eval_order + 1
                    WHERE eval_order > ?;
                `, [evalOrder-1]);

                // Edits the macro
                state.db.alter(/*SQL*/`
                    UPDATE macros SET title = ?, 
                    description = ?, 
                    macro = ?, 
                    eval_order = ?
                    WHERE id = ?`, 
                [
                    title, 
                    description,
                    macro,
                    evalOrder, 
                    id
                ]);
            } catch (error) {
                if (error instanceof Error) {
                    helpers.sendError(`Failed to edit macro: ${error.message}`, panel);
                    return;
                } else {
                    helpers.sendError(`Failed to edit macro: An unknown error occurred`, panel);
                    return;
                }
            }

            // Delete tags that are no longer associated with the macro
            if (deleteTags.size > 0) {
                const removePlaceholders = [...deleteTags].map(() => '?').join(',');
                const values = [id, ...deleteTags];
                state.db.alter(/*SQL*/`
                    DELETE FROM macros_tags
                    WHERE macro_id = ? AND tag_id IN (${removePlaceholders})`,
                values);
            }

            // Add new tags that are now associated with the macro
            if (newTags.size > 0) {
                const addPlaceholders = [...newTags].map(() => '(?, ?)').join(',');
                const addParams = [...newTags].flatMap(tagId => [id, tagId]);
                state.db.alter(/*SQL*/`
                    INSERT INTO macros_tags (macro_id, tag_id)
                    VALUES ${addPlaceholders}`,
                addParams);
            }
            
            // Model name to be displayed in the success message (From 'snippets' to 'Snippet', for example)
            const showModel = model[0].toUpperCase() + model.slice(1, -1);

            // Success message
            state.db.save();
            helpers.sendStringCommand(`success`, `${showModel} successfully edited`, panel);
            break;
        }
    }
}