import * as helpers from '../helpers/helpers.js'
import * as databaseHelpers from '../helpers/databaseHelpers.js';
import { state } from './stateControler.js';

export function submitAdd(model: string, formData: any, panel: any) {
    // Validating model
    const validModels = ['snippets', 'tags', 'languages'];
    if (!validModels.includes(model)) {
        helpers.sendError(`Invalid model: "${model}" doesn't exist`, panel);
        return;
    }

    switch (model) {
        case 'snippets': {
            // Validating required fields
            const { title: rawTitle = "", description: rawDescription = "", snippet: rawSnippet = "", language: rawLanguageId = null, tags: rawTags = [] } = formData;

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

            // Validating and sanitizing tags
            const tags = [];
            for (const rawTag of rawTags) {
                const tagId = Number(rawTag);
                if (rawTag && rawTag.trim() !== '' && !Number.isNaN(tagId) && tagId > 0) {
                    tags.push(tagId);
                }
            }

            // Creating the snippet in the database
            try {
                state.db.alter(/*SQL*/`
                    INSERT INTO snippets (description, title, snippet, language_id) VALUES (?, ?, ?, ?)`,
                [
                    title, 
                    description,
                    snippet,
                    languageId
                ]);
            } catch (error) {
                if (error instanceof Error) {
                    helpers.sendError(`Failed to create snippet: ${error.message}`, panel);
                    return;
                } else {
                    helpers.sendError(`Failed to create snippet: An unknown error occurred`, panel);
                    return;
                }
            }

            // Add new tags that are now associated with the snippet
            if (tags.length > 0) {
                const id = state.db.query(/*SQL*/`SELECT last_insert_rowid()`)?.[0]?.values?.[0]?.[0] as number | undefined; // Get the ID of the newly created snippet
                if (id) {
                    const addPlaceholders = tags.map(() => '(?, ?)').join(',');
                    const addParams = tags.flatMap(tagId => [id, tagId]);
                    state.db.alter(/*SQL*/`
                        INSERT INTO snippet_tags (snippet_id, tag_id)
                        VALUES ${addPlaceholders}`,
                    addParams);
                } else {
                    helpers.sendError("One or more tags couldn't be assigned to snippet", panel);
                    return;
                }
            }

            // Success message
            state.db.save();
            helpers.sendStringCommand(`success`, `Snippet successfully created`, panel);
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

            // Creating the tag in the database
            try {
                state.db.alter(/*SQL*/`
                    INSERT INTO tags (label) VALUES (?)`,
                [
                    label
                ]);
            } catch (error) {
                if (error instanceof Error) {
                    if (error.message.includes('UNIQUE constraint failed')) {
                        helpers.sendError(`Failed to create tag: A tag with the label "${label}" already exists`, panel);
                        return;
                    }
                    helpers.sendError(`Failed to create tag: ${error.message}`, panel);
                    return;
                } else {
                    helpers.sendError(`Failed to create tag: An unknown error occurred`, panel);
                    return;
                }
            }

            // Success message
            state.db.save();
            helpers.sendStringCommand(`success`, `Tag successfully created`, panel);
            break;
        }
        case 'languages': {
            // Validating required fields
            const { displayName: rawDisplayName = '' } = formData;
            const displayName = databaseHelpers.sanitize(rawDisplayName) || null;

            // Ensuring that the required field is present
            if (!displayName) {
                helpers.sendError(`Language lacks a required field: display Name`, panel);
                return;
            }

            // Creating the language in the database
            try {
                state.db.alter(/*SQL*/`
                    INSERT INTO languages (displayName) VALUES (?)`,
                [
                    displayName
                ]);
            } catch (error) {
                if (error instanceof Error) {
                    if (error.message.includes('UNIQUE constraint failed')) {
                        helpers.sendError(`Failed to create language: A language with the display name "${displayName}" already exists`, panel);
                        return;
                    }
                    helpers.sendError(`Failed to create language: ${error.message}`, panel);
                    return;
                } else {
                    helpers.sendError(`Failed to create language: An unknown error occurred`, panel);
                    return;
                }
            }

            // Success message
            state.db.save();
            helpers.sendStringCommand(`success`, `Language successfully created`, panel);
            break;
        }
        default: {
            helpers.sendError(`Error: Requested model '${model}' is invalid`, panel);
            break;
        }
    }
}