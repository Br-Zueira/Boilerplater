import * as htmlHelpers from '../helpers/htmlHelpers.js'
import * as vscode from 'vscode';

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
                list += /*HTML*/`<button onclick="pBtn.goToEdit('${model}', ${instance.id})">Edit ${modelSingular}</button>`
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