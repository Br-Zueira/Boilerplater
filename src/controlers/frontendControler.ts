import * as htmlHelpers from '../helpers/htmlHelpers.js';
import * as databaseHelpers from '../helpers/databaseHelpers.js';
import * as layouts from '../views/templates/layouts.js';
import * as vscode from 'vscode';

export function edit(context: vscode.ExtensionContext, model: string, id: number, db: any, panel: any) {
    // Validates the model
    const validModels = ["snippets", "tags", "languages"];
    if (!validModels.includes(model)) {
        return htmlHelpers.page404(`Model "${model}" does not exist`);
    }

    // Raw query response
    const rawObject = db.query(`SELECT * FROM ${model} WHERE id = ?`, [id])?.[0] || { columns: [], rows: [] };
    // Validates something is actually received
    if (!rawObject.values || rawObject.values.length <= 0) {
        return htmlHelpers.page404(`ID ${id} from "${model}" was not found`);
    }

    // Formated response
    const object = databaseHelpers.formatRows(rawObject.columns, rawObject.values)[0];

    // Declare the necessary variables up here to avoid variable scope issues
    let language: any = null;
    let tags: any = [];

    // Ensure the following procedure only happens if we're dealing with a snippet
    if (model === 'snippets') {
        // Get the snippet language
        const rawLanguage = db.query('SELECT * FROM languages WHERE id = ?', [object[0].language_id])?.[0] || { columns: [], rows: [] };

        // Avoid null accessing property errors
        if (rawLanguage && rawLanguage.columns && rawLanguage.values) {
            language = databaseHelpers.formatRows(rawLanguage.columns, rawLanguage.values)[0];
        }

        // Get all tags assigned to this snippet
        const snippet_tags = db.query(/*SQL*/`SELECT * FROM snippet_tags WHERE snippet_id = ?`, [object[0].id]) || [];

        // Avoid null accessing property errors
        if (snippet_tags && snippet_tags.length > 0 && snippet_tags[0].columns && snippet_tags[0].values) {
            snippet_tags.forEach((element: any) => {
                // Format model to a more usable format
                const snippet_tag = databaseHelpers.formatRows(element.columns, element.values)[0];
                
                // Get the tag from the snippet_tag
                const tag = db.query(/*SQL*/`SELECT * FROM tags WHERE id = ?`, [snippet_tag.tag_id])?.[0] || [];
                
                // Ensure tag actually exist
                if (tag && tag.columns && tag.values) {
                    const formatedTag = databaseHelpers.formatRows(tag.columns, tag.values)[0];
                    tags.push(formatedTag);
                }
            });
        }
    }

    panel.webview.html = layouts.edit(model, object, id, context, language, tags);
}

export function list(model: string, page: number, db: any, panel: any) {
    // Ensure model is valid (Software development 101 - Never trust user input)
    const validModels = ["snippets", "tags", "languages"];
    if (!validModels.includes(model)) {
        panel.webview.html = htmlHelpers.page404(`Model "${model}" does not exist`);
        return;
    }
        
    // Ensure page don't query for negative pages
    if (page < 1) {
        page = 1;
    }

    // Paginating info
    const perPage = 20;
    const offset = (page - 1) * perPage;
    const totalPages = db.getPages(model, perPage);

    // Ensure user doesn't try to read more pages than exist
    if (page > totalPages) {
        page = totalPages;
    }

    // Data
    const queryResult = db.query(`SELECT * FROM ${model} LIMIT ? OFFSET ?`, [perPage, offset]);
    const rawRows = queryResult[0] || { columns: [], values: [] };

    panel.webview.html = layouts.list(model, rawRows, page, totalPages, db);
}

export function add(context: vscode.ExtensionContext, model: string, panel: any) {
    // Validates the model
    const validModels = ["snippets", "tags", "languages"];
    if (!validModels.includes(model)) {
        return htmlHelpers.page404(`Model "${model}" does not exist`);
    }
    panel.webview.html = layouts.add(model, context);           
}

export function index(panel: any) {
    panel.webview.html = layouts.index();
}