import * as htmlHelpers from '../helpers/htmlHelpers.js'
import * as vscode from 'vscode';

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
        <form id="form">
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