import * as htmlHelpers from '../helpers/htmlHelpers.js';
import * as databaseHelpers from '../helpers/databaseHelpers.js';
import * as layouts from '../templates/layouts.js';
import * as vscode from 'vscode';
import { state } from './stateControler.js';

export function edit(model: string, id: number, panel: vscode.WebviewPanel) {
    // Validates the model
    const validModels = ["snippets", "tags", "languages", "macros"];
    if (!validModels.includes(model)) {
        return htmlHelpers.page404(panel, `Model "${model}" does not exist`);
    }

    // Raw query response
    const rawObject = state.db.query(`SELECT * FROM ${model} WHERE id = ?`, [id])?.[0] || { columns: [], rows: [] };
    // Validates something is actually received
    if (!rawObject.values || rawObject.values.length <= 0) {
        return htmlHelpers.page404(panel, `ID ${id} from "${model}" was not found`);
    }

    // Formated response
    const object = databaseHelpers.formatRows(rawObject.columns, rawObject.values)[0];

    // Declare the necessary variables up here to avoid variable scope issues
    let language: any = null;
    let tags: any = [];

    // Ensure the following procedure only happens if we're dealing with a snippet
    if (model === 'snippets') {
        // Get the snippet language
        const rawLanguage = state.db.query(/*SQL*/`SELECT * FROM languages WHERE id = ?`, [object.language_id])?.[0] || { columns: [], rows: [] };

        // Avoid null accessing property errors
        if (rawLanguage && rawLanguage.columns && rawLanguage.values) {
            language = databaseHelpers.formatRows(rawLanguage.columns, rawLanguage.values)[0];
        }

        // Get all tags assigned to this snippet
        const rawSnippet_tags = state.db.query(/*SQL*/`SELECT * FROM snippet_tags WHERE snippet_id = ?`, [object.id])?.[0] || [];

        // Avoid null accessing property errors
        if (rawSnippet_tags && rawSnippet_tags.columns && rawSnippet_tags.values) {
            const snippet_tags = databaseHelpers.formatRows(rawSnippet_tags.columns, rawSnippet_tags.values);
            for (const snippet_tag of snippet_tags) {
                // Get the tag from the snippet_tag
                const tag = state.db.query(/*SQL*/`SELECT * FROM tags WHERE id = ?`, [snippet_tag.tag_id])?.[0] || [];
                
                // Ensure tag actually exist
                if (tag && tag.columns && tag.values) {
                    const formatedTag = databaseHelpers.formatRows(tag.columns, tag.values)[0];
                    tags.push(formatedTag);
                }
            }
        }
    }

    panel.webview.html = layouts.edit(panel, model, object, id, language, tags);
}

export function list(model: string, page: number = 1, panel: vscode.WebviewPanel) {
    // Ensure model is valid (Software development 101 - Never trust user input)
    const validModels = ["snippets", "tags", "languages", "macros"];
    if (!validModels.includes(model)) {
        panel.webview.html = htmlHelpers.page404(panel, `Model "${model}" does not exist`);
        return;
    }
        
    // Ensure page don't query for negative pages
    if (page < 1) {
        page = 1;
    }

    // Paginating info
    const perPage = 20;
    const offset = (page - 1) * perPage;
    const totalPages = state.db.getPages(model, perPage);

    // Ensure user doesn't try to read more pages than exist
    if (page > totalPages) {
        page = totalPages;
    }

    // Data
    const queryResult = state.db.query(/*SQL*/`
        SELECT * FROM ${model} 
        LIMIT ? 
        OFFSET ?
    `, [perPage, offset])?.[0] || 0;

    const cleanRows = databaseHelpers.formatRows(queryResult.columns, queryResult.values);

    panel.webview.html = layouts.list(panel, model, cleanRows, page, totalPages, false, '');
}

export function search(model: string, page: number = 1, rawQuery: string = "", panel: vscode.WebviewPanel, cursorPos: [number, number] = [0, 0]) {
    // Ensure model is valid (Software development 101 - Never trust user input)
    const validModels = ["snippets", "tags", "languages", "macros"];
    if (!validModels.includes(model)) {
        panel.webview.html = htmlHelpers.page404(panel, `Model "${model}" does not exist`);
        return;
    }

    // Ensure query is not empty
    const query = databaseHelpers.sanitizeLike(rawQuery);
    if (!query) {
        return list(model, page, panel);
    }

    // This turns, for example, "python script" into ["%python%", "%script%"] to make a tokenized query
    const parsedQuery = query.split(" ")
                            .filter(word => word.trim() !== "")
                            .map(word => `%${word}%`);
    
    // Raw query response
    let results;

    // Query cap so search doesn't overload either webview or database even if it's full
    const limit = 100;

    switch (model) {
        case "snippets": {
            // This template is what allows the tokenized query to search for every field
            const placeholderTemplate = /*SQL*/`
                AND (
                    s.title LIKE ? ESCAPE '\\'
                    OR s.description LIKE ? ESCAPE '\\'
                    OR s.snippet LIKE ? ESCAPE '\\'
                    OR l.displayName LIKE ? ESCAPE '\\'
                    OR l.internalName LIKE ? ESCAPE '\\'
                    OR t.label LIKE ? ESCAPE '\\'
                )
            `;

            // The template is repeated for every token in the array so every token can be searched in every column
            const placeholder = parsedQuery.flatMap(w => placeholderTemplate).join(' ');

            // Every token is repeated the exact same amount of placeholders 
            const values = parsedQuery.flatMap(w => Array(6).fill(w));

            // The actual query
            results = state.db.query(/*SQL*/`
                SELECT s.*,
                    l.displayName AS languageName,
                    JSON_GROUP_ARRAY(t.label) AS tagLabels
                FROM snippets AS s
                -- Inner join, as this is a required field
                INNER JOIN languages AS l ON s.language_id = l.id
                -- Left join, as those are optional fields
                LEFT JOIN snippet_tags AS st ON s.id = st.snippet_id
                LEFT JOIN tags AS t ON st.tag_id = t.id
                WHERE 1=1
                ${placeholder}
                GROUP BY s.id
                LIMIT ?
            `, [...values, limit])?.[0] || [];
            break;
        }
        case "tags": {
            // This template is what allows the tokenized query to search for every field
            const placeholderTemplate = /*SQL*/`AND label LIKE ? ESCAPE '\\'`;

            // The template is repeated for every token in the array so every token can be searched in every column
            const placeholder = parsedQuery.flatMap(w => placeholderTemplate).join(' ');

            // The actual query
            results = state.db.query(/*SQL*/`
                SELECT * FROM tags
                WHERE 1=1
                ${placeholder} 
                LIMIT ?   
            `, [...parsedQuery, limit])?.[0] || [];
            break;
        }
        case "languages": {
            // This template is what allows the tokenized query to search for every field
            const placeholderTemplate = /*SQL*/`
                AND (
                    displayName LIKE ? ESCAPE '\\'
                    OR internalName LIKE ? ESCAPE '\\'
                )
            `;

            // The template is repeated for every token in the array so every token can be searched in every column
            const placeholder = parsedQuery.flatMap(w => placeholderTemplate);

            // Every token is repeated the exact same amount of placeholders 
            const values = parsedQuery.flatMap(w => Array(2).fill(w));

            // The actual query
            results = state.db.query(/*SQL*/`
                SELECT * FROM languages
                WHERE 1=1
                ${placeholder}
                LIMIT ?
            `, [...values, limit])?.[0] || [];
            break;
        }
        default: {
            panel.webview.html = htmlHelpers.page404(panel, `Model ${model} does not exist`);
            return;
        }
    }

    const formatedResult = databaseHelpers.formatRows(results?.columns || [], results?.values || []);

    panel.webview.html = layouts.list(panel, model, formatedResult, page, state.db.getPages(model), true, rawQuery, cursorPos);
}

export function add(model: string, panel: vscode.WebviewPanel) {
    // Validates the model
    const validModels = ["snippets", "tags", "macros", "languages"];
    if (!validModels.includes(model)) {
        return htmlHelpers.page404(panel, `Model "${model}" does not exist`);
    }
    panel.webview.html = layouts.add(panel, model);           
}

export function index(panel: vscode.WebviewPanel) {
    panel.webview.html = layouts.index(panel);
}

export function langDelete(id: number, snAmount: number, panel: vscode.WebviewPanel) {
    panel.webview.html = layouts.langDelete(panel, id, snAmount);
}