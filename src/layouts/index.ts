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