import * as htmlHelpers from '../helpers/htmlHelpers.js'
import * as vscode from 'vscode';

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