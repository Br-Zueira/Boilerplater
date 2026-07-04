import * as layouts from '../views/templates/layouts.js';
import * as tomSelectControler from '../controlers/tomSelectControler.js';
import * as editControler from '../controlers/editControler.js';
import * as addControler from '../controlers/addControler.js';
import * as frontendControler from '../controlers/frontendControler.js';
import * as vscode from 'vscode';

export function routes(param: any, panel: any, command: any, db: any, context: vscode.ExtensionContext) {
    switch (command) {
        case ("goToIndex"): {
            frontendControler.index(panel);
            break;
        }

        case ("goToEdit"): {
            frontendControler.edit(context, param, db, panel);
            break;
        }	

        case ("goToManager"):
        case ("goToPage"): {
            frontendControler.list(param, db, panel);
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

        case ("submitEdit"): {
            editControler.submitEdit(param.model, param.id, param.formData, db, panel);
            break;
        }

        case ("goToAdd"): {
            frontendControler.add(context, param.model, panel);
            break;
        }

        case ("submitAdd"): {
            addControler.submitAdd(param.model, param.formData, db, panel);
            break;
        }

        default: {
            console.log("BOILERPLATER: ERROR - RECEIVED INVALID MESSAGE");
            break;
        }
    }
}