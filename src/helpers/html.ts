import * as helpers from './helpers.js';
import * as database from '../database/database.js';

// Page to return an HTML plain string to pass to the webView
export function index() {
    return boiler(`
        <script>
            // VsCode API to bridge gap between frontend and backend
            const vscode = acquireVsCodeApi();

            // Function to abstract the page swapping message call
            function goToManager(model) {
                vscode.postMessage({
                    command: "goToManager",
                    payload: { model: model }
                });
            }
        </script>

        <h1>Br-Zueira's Boilerplater!</h1>

        <button id="snippetBtn" onclick="goToManager('snippets')">Manage snippets</button>
        <button id="tagBtn" onclick="goToManager('tags')">Manage tags</button>
        <button id="langBtn" onclick="goToManager('languages')">Manage languages</button>
    `);
}

export function list(model: string, db: any, page: number = 1) {

    // Ensure model is valid (Software development 101 - Never trust user input)
    const validModels = ["snippets", "tags", "languages"];
    if (validModels.includes(model)) {
        // Ensure page don't query for negative pages
        if (page < 1) {
            page = 1;
        }

        // Paginating info
        const perPage = 20;
        const offset = (page - 1) * perPage;
        const totalPages = database.getTotalPages(db, model, perPage);

        // Ensure user doesn't try to read more pages than exist
        if (page > totalPages) {
            page = totalPages;
        }

        // Data
        const queryResult = db.exec(`SELECT * FROM ${model} LIMIT ? OFFSET ?`, [perPage, offset]);
        const rawRows = queryResult[0] || { columns: [], values: [] };
        let data: any;
        
        // Mounting the object list
        let list = "";

        if (rawRows.values && rawRows.values.length > 0) {
            data = helpers.formatRows(rawRows.columns, rawRows.values);
            list = `<ul>`;
            for (const instance of data) {
                list += `<div>`;
                    list += getInstanceContent(model, instance, db);
                    list += `<button>Edit ${model.slice(0, -1)}</button>`
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

        return boiler(`
            <script>
                const vscode = acquireVsCodeApi();

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
            </script>

            <!-- Like "Snippets manager" -->
            <h1>${model.charAt(0).toUpperCase() + model.slice(1)} manager</h1>

            <button onclick="goToIndex()">Homepage</button>

            <!-- Like "Create new snippet -->
            <button>Create new ${model.slice(0, -1)}</button>

            <input type="text" id="searchBar" placeholder="Search for a specific ${model.slice(0, -1)}">

            <!-- Like "Snippets:" -->
            <p>${model.charAt(0).toUpperCase()+model.slice(1)}:</p>
            ${list}

            <!-- Footbar -->
            <p>Page ${page} of ${totalPages}</p>
            ${buttons}
        `);

    } else {
        return page404(`Model "${model}" does not exist`);
    }
}

export function page404(message: string) {
    return boiler(`
        <h1>Error 404:</h1>
        <p>${message}</p>
    `);
}

// HTML boilerplate
function boiler(body: string, head?: string) {
    return `
        <!DOCTYPE html>

        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Boilerplater</title>
                ${head ?? ''}
            </head>
            <body>
                ${body}
            </body>
        </html>
    `;
}

function getInstanceContent(model: string, instance: any, db: any) {
    switch (model) {
        case ("snippets"): {
            const lang = db.exec(`SELECT displayName FROM languages WHERE id = ?`, [instance.language_id])[0]?.values?.[0]?.[0] || "UNKNOWN LANGUAGE";
            return `
                <p><strong>Title:</strong> ${instance.title}</p>
                <p><strong>Description:</strong> ${instance.description}</p>
                <p><strong>Snippet:</strong> ${instance.snippet}</p>
                <p><strong>Language:</strong> ${lang}</p>
            `;
        }
        case ("tags"): {
            return `
                <p><strong>Label:</strong> ${instance.label}</p>
            `;
        }
        case ("languages"): {
            return `
                <p><strong>Display name:</strong> ${instance.displayName}</p>
                <p><strong>Internal name:</strong> ${instance.internalName}</p>
            `;
        }
        default: {
            return `
                <p><strong>INVALID MODEL</strong></p>
            `;
        }
    }
}