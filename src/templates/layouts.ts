import * as htmlHelpers from '../helpers/htmlHelpers.js'
import * as vscode from 'vscode';

// Page to return an HTML plain string to pass to the webView
export function index(panel: vscode.WebviewPanel) {
    return htmlHelpers.boiler(panel, /*HTML*/`
        <h1>Br-Zueira's Boilerplater!</h1>

        <button id="snippetBtn" onclick="pBtn.goToManager('snippets')">Manage snippets</button>
        <button id="tagBtn" onclick="pBtn.goToManager('tags')">Manage tags</button>
        <button id="langBtn" onclick="pBtn.goToManager('languages')">Manage languages</button>
        <button id="macroBtn" onclick="pBtn.goToManager('macros')">Manage macros</button>

        <p>Br-Zueira's Boilerplater is an extension that avoids the need to constantly rewrite boilerplate code and makes snippet managment very intuitive and integrated into Vscode.<p>

        <p>To save a new snippet, highlight a string in document and use the Boilerplater shortcut (default: ctrl+u; cmd+u in mac).
        Go to a manager to either see, create, edit or delete snippets, tags or languages. In snippets, you can paste them directly into the document cursor.</p>

        <p>To make it more powerful and automatic, it contains a template syntax, which is:<br>
            [% ... %] => Can execute sandboxed JavaScript code, specially for string manipulation, and access the following macros:<br>
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
            It's possible to define your own custom macros, and use macros inside other macros!
            Note: JavaScript templates ( [% %] ) are evaluated first than tabspace templates ( [# #] ), 
            and it's possible to put JS templates inside tabspace templates
        </p>
    `);
}

// Page to return generic list
export function list(panel: vscode.WebviewPanel, model: string, data: any, page: number = 1, totalPages: number, isSearch: boolean = false, query: string = "", cursorPos: [number, number] = [0, 0]) {
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
                list += /*HTML*/`<button onclick="pBtn.goToEdit(${instance.id})">Edit ${modelSingular}</button>`
                if (model === "snippets") {
                    list += /*HTML*/`<button onclick="pBtn.pasteSnippet(${instance.id})">Paste snippet</button>`
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
        buttons += /*HTML*/`<button id="lastPage" onclick="pBtn.goToPage(${page - 1})">Last Page</button>`;
    }
    if (page < totalPages) {
        buttons += /*HTML*/`<button id="nextPage" onclick="pBtn.goToPage(${page + 1})">Next Page</button>`;
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

    return htmlHelpers.boiler(panel, /*HTML*/`
        <!-- Like "Snippets manager" -->
        <h1>${modelFirstUpper} manager</h1>

        <button onclick="pBtn.goToIndex()">Homepage</button>

        <!-- Like "Create new snippet -->
        <button onclick="pBtn.goToAdd('${model}')">Create new ${modelSingular}</button>

        <input type="hidden" id="model" value="${model}">
        <input type="hidden" id="cursorPos" value="${cursorPos}">
        <input type="text" id="searchBar" placeholder="Search for a specific ${modelSingular}" value="${query}">

        <!-- Like "Snippets:" -->
        <p>${modelFirstUpper}:</p>

        <div id="listContainer">
            ${list}
        </div>

        <!-- Footbar -->
        ${footbar}
    `);
}

// Generic model editing view
export function edit(panel: vscode.WebviewPanel, model: string, object: any, id: number, language: any = undefined, tags: any = undefined) {
    // String formating
    const modelSingular = model.slice(0, -1);

    // Only snippets have a button to paste them
    const pasteButton = model === "snippets" ? /*HTML*/`<button type="button" onclick="pBtn.pasteSnippet()">Paste snippet</button>` : "";

    // Return the HTML page
    return htmlHelpers.boiler(panel, /*HTML*/`
        <!-- Like "Edit snippet" -->
        <h1>Edit ${modelSingular}</h1>

        <!-- Form to edit the model -->
        <form id="editForm">
            <!-- Hidden inputs to pass the model and id to the backend -->
            <input type="hidden" id="model" name="model" value="${model}">
            <input type="hidden" id="id" name="id" value="${id}">

            <!-- The following function will return the necessary fields for each model -->
            ${htmlHelpers.getEditableFields(model, object, language, tags)}

            <footer>
                <!-- Buttons to submit the form, cancel edition and delete the model -->
                <button type="submit">Save ${modelSingular}</button>
                ${pasteButton}
                <button type="button" onclick="pBtn.goToManager('${model}')">Cancel edition</button>
                <button type="button" onclick="pBtn.deleteModel('${model}', ${id})">Delete ${model.slice(0, -1)}</button>

                <!-- Error and success messages -->
                <p id="errorMessage" role="alert" style="color: red; display: none;"></p>
                <p id="successMessage" role="alert" style="color: green; display: none;"></p>
            </footer>
        </form>
    `);
}

export function add(panel: vscode.WebviewPanel, model: string) {
    // String formating
    const modelSingular = model.slice(0, -1);

    // Only snippets have a button to paste them
    const pasteButton = model === "snippets" ? /*HTML*/`<button type="button" onclick="pBtn.pasteSnippet()">Paste snippet</button>` : "";

    // Return the HTML page
    return htmlHelpers.boiler(panel, /*HTML*/`
        <!-- Like "Create new snippet" -->
        <h1>Create new ${modelSingular}</h1>

        <!-- Form to add the model -->
        <form id="addForm">
            <!-- Hidden input to pass the model to the backend -->
            <input type="hidden" id="model" name="model" value="${model}">

            <!-- The following function will return the necessary fields for each model -->
            ${htmlHelpers.getEditableFields(model, {}, undefined, undefined)}

            <!-- Buttons to submit the form and cancel creation -->
            <button type="submit">Create ${modelSingular}</button>
            ${pasteButton}
            <button type="button" onclick="pBtn.goToManager('${model}')">Cancel creation</button>

            <!-- Error and success messages -->
            <p id="errorMessage" role="alert" style="color: red; display: none;"></p>
            <p id="successMessage" role="alert" style="color: green; display: none;"></p>
        </form>
    `);
}

export function langDelete(panel: vscode.WebviewPanel, id: number, snAmount: number) {
    const isSingular = snAmount === 1;
    return htmlHelpers.boiler(panel, /*HTML*/`
        <!-- Example: There is 1 snippet or There are 2 snippets-->
        <h1>Warning: There ${isSingular ? 'is' : 'are'} ${snAmount} snippet${isSingular ? '' : 's'} associated to this language.</h1>
        <h2>Associate them to another language or they will be deleted along with the language</h2>

        <button onclick="pBtn.goToIndex()">Cancel deletion</button>

        <form id="newLangForm">
            <input type="hidden" name="id" value="${id}">

            <label>
                <h2>New language</h2>
                <select id="newLangSelector" name="newLanguage"></select>
            </label>

            <button name="action" value="changeDelete">Change languages and delete</button>
            <button name="action" value="nuclearDelete">Delete languages, along with its snippets</button>

            <!-- Error and success messages -->
            <p id="errorMessage" role="alert" style="color: red; display: none;"></p>
            <p id="successMessage" role="alert" style="color: green; display: none;"></p>
        </form>
    `);
}