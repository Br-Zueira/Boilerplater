import * as htmlHelpers from '../helpers/htmlHelpers.js'
import * as vscode from 'vscode';

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
        <form id="form">
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