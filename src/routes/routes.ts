import * as layouts from '../views/templates/layouts.js';
import * as htmlHelpers from '../helpers/htmlHelpers.js';
import * as helpers from '../helpers/helpers.js';

export function routes(param: any, panel: any, command: any, db: any) {
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
            const object = helpers.formatRows(rawObject.columns, rawObject.values);

            panel.webview.html = layouts.edit(param.model, object[0], param.id);
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

        default: {
            console.log("BOILERPLATER: ERROR - RECEIVED INVALID MESSAGE");
            break;
        }
    }
}