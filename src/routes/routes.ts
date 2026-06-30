import * as layouts from '../views/templates/layouts.js';
import * as htmlHelpers from '../helpers/htmlHelpers.js';
import * as databaseHelpers from '../helpers/databaseHelpers.js';
import * as tomSelectControler from '../controlers/tomSelectControler.js';
import * as vscode from 'vscode';

export function routes(param: any, panel: any, command: any, db: any, context: vscode.ExtensionContext) {
    switch (command) {
        case ("goToIndex"): {
            panel.webview.html = layouts.index();
            break;
        }

        case ("goToEdit"): {
            // Validates model coming
            const validModels = ["snippets", "tags", "languages"];
            if (!validModels.includes(param.model)) {
                return htmlHelpers.page404(`Model "${param.model}" does not exist`);
            }

            // Raw query response
            const rawObject = db.query(`SELECT * FROM ${param.model} WHERE id = ?`, [param.id])?.[0] || { columns: [], rows: [] };
            // Validates something is actually received
            if (!rawObject.values || rawObject.values.length <= 0) {
                return htmlHelpers.page404(`ID ${param.id} from "${param.model}" was not found`);
            }

            // Formated response
            const object = databaseHelpers.formatRows(rawObject.columns, rawObject.values);

            // Declare the necessary variables up here to avoid variable scope issues
            let language: any = null;
            let tags: any = [];

            // Ensure the following procedure only happens if we're dealing with a snippet
            if (param.model === 'snippets') {
                // Get the snippet language
                const rawLanguage = db.query('SELECT * FROM languages WHERE id = ?', [object[0].language_id])?.[0] || { columns: [], rows: [] };

                // Avoid null accessing property errors
                if (rawLanguage && rawLanguage.columns && rawLanguage.rows) {
                    language = databaseHelpers.formatRows(rawLanguage.columns, rawLanguage.values);
                }

                // Get all tags assigned to this snippet
                const snippet_tags = db.query('SELECT * FROM snippet_tags WHERE snippet_id = ?', [object[0].id]) || { columns: [], rows: [] };

                // Avoid null accessing property errors
                if (snippet_tags && snippet_tags.columns && snippet_tags.rows) {
                    snippet_tags.forEach((element: any) => {
                        const tag = databaseHelpers.formatRows(element.columns, element.rows);
                        tags.push({ ...tag[0] });
                    });
                }
            }

            panel.webview.html = layouts.edit(param.model, object[0], param.id, context, language, tags);
            break;
        }	

        case ("goToManager"):
        case ("goToPage"): {
            // Ensure model is valid (Software development 101 - Never trust user input)
            const validModels = ["snippets", "tags", "languages"];
            if (!validModels.includes(param.model)) {
                panel.webview.html = htmlHelpers.page404(`Model "${param.model}" does not exist`);
                break;
            }
                
            // Ensure page don't query for negative pages
            if (param.page < 1) {
                param.page = 1;
            }
        
            // Paginating info
            const perPage = 20;
            const offset = (param.page - 1) * perPage;
            const totalPages = db.getPages(param.model, perPage);
        
            // Ensure user doesn't try to read more pages than exist
            if (param.page > totalPages) {
                param.page = totalPages;
            }
        
            // Data
            const queryResult = db.query(`SELECT * FROM ${param.model} LIMIT ? OFFSET ?`, [perPage, offset]);
            const rawRows = queryResult[0] || { columns: [], values: [] };

            panel.webview.html = layouts.list(param.model, rawRows, param.page, totalPages, db);
            break;
        }
        
        case ("searchTags"): {
            tomSelectControler.searchTags(param.searchQuery, db, panel);
            break;
        }

        case ("searchLanguages"): {
            tomSelectControler.searchLanguages(param.searchQuery, db, panel);
            break;
        }

        default: {
            console.log("BOILERPLATER: ERROR - RECEIVED INVALID MESSAGE");
            break;
        }
    }
}