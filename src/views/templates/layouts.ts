import * as htmlHelpers from '../../helpers/htmlHelpers.js'
import * as scripts from '../static/scripts.js'
import * as css from "../static/css.js";

// Page to return an HTML plain string to pass to the webView
export function index() {
    return htmlHelpers.boiler(/*HTML*/`
        <h1>Br-Zueira's Boilerplater!</h1>

        <button id="snippetBtn" onclick="goToManager('snippets')">Manage snippets</button>
        <button id="tagBtn" onclick="goToManager('tags')">Manage tags</button>
        <button id="langBtn" onclick="goToManager('languages')">Manage languages</button>

        <p>Br-Zueira's Boilerplater is an extension that avoids the need to constantly rewrite boilerplate code and makes snippet managment very intuitive and integrated into Vscode.<p>

        <p>To save a new snippet, highlight a string in document and use the Boilerplater shortcut (default: ctrl+u; cmd+u in mac).
        Go to a manager to either see, create, edit or delete snippets, tags or languages. In snippets, you can paste them directly into the document cursor.</p>

        <p>To make it more powerful and automatic, it contains a template syntax, which is:<br>
            [% ... %] => Can execute JavaScript code, specially for string manipulation, and access the following variables:<br>
                <strong>BP_FILENAME:</strong> file name without extension ("file" format)<br>
                <strong>BP_FILENAME_EXT:</strong> file name with extension ("file.ext" format)<br>
                <strong>BP_EXT:</strong> file extension (".ext" format)<br>
                <strong>BP_DIRECTORY_NAME:</strong> file absolute path ("path/to/parent-folder" format, or "." if file is new and unsaved)<br>
                <strong>BP_WORKSPACE_NAME:</strong> file parent folder ("parent-folder" format, or empty string if file is new and unsaved)<br>
                <strong>BP_YEAR:</strong> current year ("XXXX" format)<br>
                <strong>BP_MONTH:</strong> current month ("XX" format)<br>
                <strong>BP_DAY:</strong> current day ("XX" format)<br>
                <strong>BP_SELECTED_TEXT:</strong> the string highlighted by cursor in document (or empty string if nothing highlighted)<br>
                <strong>BP_CLIPBOARD:</strong> the last string copied to clipboard (or empty string if clipboard is empty)<br>
            [# ... #] => Syntax for Vscode tabstop, can be either:<br>
                [# index #]: index is a number that identifies the tabstops order (it's 1 => 2 => 3... => 0) and groups (multiple tabstops with same index will hare the exact same value)<br>
                [# index | default #]: default is a fallback string to be used if user skips tabstop <br>
            Note: JavaScript templates ( [% %] ) are evaluated first than tabspace templates ( [# #] ), 
            and it's possible to put JS templates inside tabspace templates
        </p>
    `, scripts.index());
}

// Page to return generic list
export function list(model: string, data: any, page: number = 1, totalPages: number, isSearch: boolean = false, query: string = "", cursorPos: [number, number] = [0, 0]) {
    // Mounting the object list
    let list = "";

    // String formating
    const modelSingular = model.slice(0, -1);
    const modelFirstUpper = model.charAt(0).toUpperCase() + model.slice(1);

    if (data && data.length > 0) {
        // If data is found, display it in a list
        list = /*HTML*/`<ul>`;

        // Loop through the data and display each instance in a list item
        for (const instance of data) {
            // Get the instance content using the helper function
            list += /*HTML*/`<div>`;
                list += htmlHelpers.getInstanceContent(model, instance, isSearch);
                list += /*HTML*/`<button onclick="goToEdit(${instance.id})">Edit ${modelSingular}</button>`
                if (model === "snippets") {
                    list += /*HTML*/`<button onclick="pasteSnippet(${instance.id})">Paste snippet</button>`
                }
            list += /*HTML*/`</div>`;
        }
        list += /*HTML*/`</ul>`
    } else {
        // if no data is found, display a message to the user
        list = /*HTML*/`<p>Sorry, nothing found</p>`;
    }

    let buttons = "";

    if (page > 1) {
        buttons += /*HTML*/`<button id="lastPage" onclick="goToPage(${page - 1})">Last Page</button>`;
    }
    if (page < totalPages) {
        buttons += /*HTML*/`<button id="nextPage" onclick="goToPage(${page + 1})">Next Page</button>`;
    }

    // Dynamic footbar based on whether the user is searching or not
    let footbar = "";
    if (isSearch) { 
        footbar = /*HTML*/`
            <div id="footbar">
                <p>Search results for "${query}"</p>
            </div>
        `;
    } else { 
        footbar = /*HTML*/`
            <div id="footbar">
                <p>Page ${page} of ${totalPages}</p>
                ${buttons}
            </div>
        `;
    }
    
    // Blocks user from creating languages, since they are automatically generated by the system
    const createNew = model !== "languages" ? /*HTML*/`<button onclick="goToAdd('${model}')">Create new ${modelSingular}</button>` : "";

    return htmlHelpers.boiler(/*HTML*/`
        <!-- Like "Snippets manager" -->
        <h1>${modelFirstUpper} manager</h1>

        <button onclick="goToIndex()">Homepage</button>

        <!-- Like "Create new snippet -->
        ${createNew}

        <input type="text" id="searchBar" placeholder="Search for a specific ${modelSingular}" value="${query}">

        <!-- Like "Snippets:" -->
        <p>${modelFirstUpper}:</p>

        <div id="listContainer">
            ${list}
        </div>

        <!-- Footbar -->
        ${footbar}
    `, scripts.list(model, cursorPos));
}

// Generic model editing view
export function edit(model: string, object: any, id: number, language: any = undefined, tags: any = undefined) {
    // Blocks user from deleting languages, since they are automatically generated by the system
    const deleteButton = model === "languages" ? "" : /*HTML*/`<button type="button" onclick="deleteModel()">Delete ${model.slice(0, -1)}</button>`;
    
    // String formating
    const modelSingular = model.slice(0, -1);

    // Only snippets have a button to paste them
    const pasteButton = model === "snippets" ? /*HTML*/`<button type="button" onclick="pasteSnippet()">Paste snippet</button>` : "";

    // Return the HTML page
    return htmlHelpers.boiler(/*HTML*/`
        <!-- Like "Edit snippet" -->
        <h1>Edit ${modelSingular}</h1>

        <!-- Form to edit the model -->
        <form id="editForm">
            <!-- Hidden inputs to pass the model and id to the backend -->
            <input type="hidden" name="model" value="${model}">
            <input type="hidden" name="id" value="${id}">

            <!-- The following function will return the necessary fields for each model -->
            ${htmlHelpers.getEditableFields(model, object, language, tags)}

            <footer>
                <!-- Buttons to submit the form, cancel edition and delete the model -->
                <button type="submit">Save ${modelSingular}</button>
                ${pasteButton}
                <button type="button" onclick="goToManager()">Cancel edition</button>
                ${deleteButton}

                <!-- Error and success messages -->
                <p id="errorMessage" role="alert" style="color: red; display: none;"></p>
                <p id="successMessage" role="alert" style="color: green; display: none;"></p>
            </footer>
        </form>
    `, scripts.edit(model, id),
    /*HTML*/`
    <style>${ css.getTomSelectLibCss() }</style> 
    <style>${ css.tomSelectCssOverride }</style>
    <script>${ scripts.getTomSelectLibJs() }</script>
    `);
}

export function add(model: string) {
    // String formating
    const modelSingular = model.slice(0, -1);

    // Only snippets have a button to paste them
    const pasteButton = model === "snippets" ? /*HTML*/`<button type="button" onclick="pasteSnippet()">Paste snippet</button>` : "";

    // Return the HTML page
    return htmlHelpers.boiler(/*HTML*/`
        <!-- Like "Create new snippet" -->
        <h1>Create new ${modelSingular}</h1>

        <!-- Form to add the model -->
        <form id="addForm">
            <!-- Hidden input to pass the model to the backend -->
            <input type="hidden" name="model" value="${model}">

            <!-- The following function will return the necessary fields for each model -->
            ${htmlHelpers.getEditableFields(model, {}, undefined, undefined)}

            <!-- Buttons to submit the form and cancel creation -->
            <button type="submit">Create ${modelSingular}</button>
            ${pasteButton}
            <button type="button" onclick="goToManager()">Cancel creation</button>

            <!-- Error and success messages -->
            <p id="errorMessage" role="alert" style="color: red; display: none;"></p>
            <p id="successMessage" role="alert" style="color: green; display: none;"></p>
        </form>
    `, scripts.add(model),
    /*HTML*/`
    <style>${ css.getTomSelectLibCss() }</style> 
    <style>${ css.tomSelectCssOverride }</style>
    <script>${ scripts.getTomSelectLibJs() }</script>
    `);
}