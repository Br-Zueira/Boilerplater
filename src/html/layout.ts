import * as helpers from '../helpers/helpers.js';
import * as database from '../database/database.js';
import * as htmlHelper from './htmlHelper.js'

// Page to return an HTML plain string to pass to the webView
export function index() {
    return htmlHelper.boiler(`
        <h1>Br-Zueira's Boilerplater!</h1>

        <button id="snippetBtn" onclick="goToManager('snippets')">Manage snippets</button>
        <button id="tagBtn" onclick="goToManager('tags')">Manage tags</button>
        <button id="langBtn" onclick="goToManager('languages')">Manage languages</button>
    `, 
    // Script
    `
        // Function to abstract the page swapping message call
        function goToManager(model) {
            vscode.postMessage({
                command: "goToManager",
                payload: { model: model, page: 1 }
            });
        }`
    );
}

// Page to return generic list
export function list(model: string, rawRows: any, page: number, totalPages: number, db: any) {
    let data: any;
    
    // Mounting the object list
    let list = "";

    // String formating
    const modelSingular = model.slice(0, -1);
    const modelFirstUpper = model.charAt(0).toUpperCase() + model.slice(1);

    if (rawRows.values && rawRows.values.length > 0) {
        data = helpers.formatRows(rawRows.columns, rawRows.values);
        list = `<ul>`;
        for (const instance of data) {
            list += `<div>`;
                list += htmlHelper.getInstanceContent(model, instance, db);
                list += `<button onclick="goToEdit(${instance.id})">Edit ${modelSingular}</button>`
            list += `</div>`;
        }
        list += `</ul>`
    } else {
        list = `<p>Sorry, nothing found</p>`;
    }

    let buttons = "";

    if (page > 1) {
        buttons += `<button onclick="goToPage(${page - 1})">Last Page</button>`;
    }
    if (page < totalPages) {
        buttons += `<button onclick="goToPage(${page + 1})">Next Page</button>`;
    }
    
    return htmlHelper.boiler(`
        <!-- Like "Snippets manager" -->
        <h1>${modelFirstUpper} manager</h1>

        <button onclick="goToIndex()">Homepage</button>

        <!-- Like "Create new snippet -->
        <button>Create new ${modelSingular}</button>

        <input type="text" id="searchBar" placeholder="Search for a specific ${modelSingular}">

        <!-- Like "Snippets:" -->
        <p>${modelFirstUpper}:</p>
        ${list}

        <!-- Footbar -->
        <p>Page ${page} of ${totalPages}</p>
        ${buttons}
    `,
    `            
        function goToPage(page) {
            vscode.postMessage({
                command: "goToPage",
                payload: { model: "${model}", page: page}
            })
        }

        function goToIndex() {
            vscode.postMessage({
                command: "goToIndex",
                payload: { dummy: "foo" }
            })
        }

        function goToEdit(id) {
            vscode.postMessage({
                command: "goToEdit",
                payload: { model: "${model}", id: id }
            })
        }
    `
    );
}

// Generic model editing view
export function edit(model: string, object: any, id: number) {
    return htmlHelper.boiler(`
        <h1>Edit ${model.charAt(0).toUpperCase() + model.slice(1)}</h1>
        <form id="editForm">
            <input type="hidden" name="model" value="${model}">
            <input type="hidden" name="id" value="${id}">
            ${htmlHelper.getEditableFields(model, object)}
            <button type="submit">Save ${model.slice(0, -1)}</button>
            <button onclick="goToIndex">Cancel editing</button>
            <button onclick="deleteModel">Delete ${model.slice(0, -1)}</button>
        </form>
    `, 
    `
        function goToIndex() {
            vscode.postMessage({
                command: "goToIndex",
                payload: { dummy: "foo"}
            })
        }
            
        function deleteModel() {
            vscode.postMessage({
                command: "deleteModel",
                payload: { model: "${model}", id: ${id} }
            })
        }
    `
    );
}