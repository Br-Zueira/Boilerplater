import * as tomSelectControler from '../controlers/tomSelectControler.js';
import * as editControler from '../controlers/editControler.js';
import * as addControler from '../controlers/addControler.js';
import * as frontendControler from '../controlers/frontendControler.js';
import * as vscode from 'vscode';

export function routes(param: any, panel: any, command: any, db: any, context: vscode.ExtensionContext) {
    switch (command) {
        // View routes
        case ("goToIndex"): {
            frontendControler.index(panel);
            break;
        }

        case ("goToAdd"): {
            frontendControler.add(context, param.model, panel);
            break;
        }

        case ("goToEdit"): {
            frontendControler.edit(context, param.model, param.id, db, panel);
            break;
        }	

        case ("goToManager"): // Go to page 1
        case ("goToPage"): { // Go to a specific page
            frontendControler.list(param.model, param.page, db, panel);
            break;
        }

        // Form routes
        case ("submitAdd"): {
            addControler.submitAdd(param.model, param.formData, db, panel);
            break;
        }

        case ("submitEdit"): {
            editControler.submitEdit(param.model, param.id, param.formData, db, panel);
            break;
        }
        
        // TomSelect/API routes
        case ("searchTags"): {
            tomSelectControler.searchTags(param.searchQuery, db, panel);
            break;
        }

        case ("searchLanguages"): {
            tomSelectControler.searchLanguages(param.searchQuery, db, panel);
            break;
        }

        // Fallback for unrecognized routes
        default: {
            console.warn(`Boilerplater: Routes received an unrecognized command - "${command}" isn't recognized. Command ignored.`);
            break;
        }
    }
}