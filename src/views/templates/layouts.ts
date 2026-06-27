import * as databaseHelpers from '../../helpers/databaseHelpers.js';
import * as htmlHelpers from '../../helpers/htmlHelpers.js'
import * as scripts from '../static/scripts.js'

// Page to return an HTML plain string to pass to the webView
export function index() {
    return htmlHelpers.boiler(/*HTML*/`
        <h1>Br-Zueira's Boilerplater!</h1>

        <button id="snippetBtn" onclick="goToManager('snippets')">Manage snippets</button>
        <button id="tagBtn" onclick="goToManager('tags')">Manage tags</button>
        <button id="langBtn" onclick="goToManager('languages')">Manage languages</button>
    `, scripts.index());
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
        data = databaseHelpers.formatRows(rawRows.columns, rawRows.values);
        list = /*HTML*/`<ul>`;
        for (const instance of data) {
            list += /*HTML*/`<div>`;
                list += htmlHelpers.getInstanceContent(model, instance, db);
                list += /*HTML*/`<button onclick="goToEdit(${instance.id})">Edit ${modelSingular}</button>`
            list += /*HTML*/`</div>`;
        }
        list += /*HTML*/`</ul>`
    } else {
        list = /*HTML*/`<p>Sorry, nothing found</p>`;
    }

    let buttons = "";

    if (page > 1) {
        buttons += /*HTML*/`<button onclick="goToPage(${page - 1})">Last Page</button>`;
    }
    if (page < totalPages) {
        buttons += /*HTML*/`<button onclick="goToPage(${page + 1})">Next Page</button>`;
    }
    
    return htmlHelpers.boiler(/*HTML*/`
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
    `, scripts.list(model));
}

// Generic model editing view
export function edit(model: string, object: any, id: number) {
    return htmlHelpers.boiler(/*HTML*/`
        <h1>Edit ${model.charAt(0).toUpperCase() + model.slice(1)}</h1>
        <form id="editForm">
            <input type="hidden" name="model" value="${model}">
            <input type="hidden" name="id" value="${id}">
            ${htmlHelpers.getEditableFields(model, object)}
            <button type="submit">Save ${model.slice(0, -1)}</button>
            <button onclick="goToIndex">Cancel editing</button>
            <button onclick="deleteModel">Delete ${model.slice(0, -1)}</button>
        </form>
    `, scripts.edit(model, id));
}