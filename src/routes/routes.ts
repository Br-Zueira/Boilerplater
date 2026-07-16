import * as tomSelectControler from '../controlers/tomSelectControler.js';
import * as editControler from '../controlers/editControler.js';
import * as addControler from '../controlers/addControler.js';
import * as frontendControler from '../controlers/frontendControler.js';
import * as deleteControler from '../controlers/deleteControler.js';
import * as pasteControler from '../controlers/pasteControler.js';
import * as vscode from 'vscode';

export function routes(param: any, panel: vscode.WebviewPanel, command: string) {
    switch (command) {
        // View routes
        case ("goToIndex"): {
            frontendControler.index(panel);
            break;
        }

        case ("goToAdd"): {
            frontendControler.add(param.model, panel);
            break;
        }

        case ("goToEdit"): {
            frontendControler.edit(param.model, param.id, panel);
            break;
        }	

        case ("goToManager"): // Go to page 1
        case ("goToPage"): { // Go to a specific page
            frontendControler.list(param.model, param.page, panel);
            break;
        }

        // Form routes
        case ("submitAdd"): {
            addControler.submitAdd(param.model, param.formData, panel);
            break;
        }

        case ("submitEdit"): {
            editControler.submitEdit(param.model, param.id, param.formData, panel);
            break;
        }

        case ("deleteModel"): {
            deleteControler.submitDelete(param.id, param.model, panel);
            break;
        }
        
        // TomSelect/API routes
        case ("searchTags"): {
            tomSelectControler.searchTags(param.searchQuery, panel);
            break;
        }

        case ("searchLanguages"): {
            tomSelectControler.searchLanguages(param.searchQuery, panel);
            break;
        }

        case ("searchNewLangs"): {
            tomSelectControler.searchNewLangs(param.searchQuery, panel);
            break;
        }

        // Search engine
        case ("search"): {
            frontendControler.search(param.model, param.page, param.searchQuery, panel, param.cursorPos);
            break;
        }

        // Paste the snippet into the editor (THE REASON THIS EXTENSION EXISTS)
        case ("pasteSnippet"): {
            pasteControler.paste(param.is_edit_view, param.id, param.snippet);
            break;
        }

        // Fallback for unrecognized routes
        default: {
            console.error(`Boilerplater: Routes received an unrecognized command - "${command}" isn't recognized. Command ignored.`);
            break;
        }
    }
}