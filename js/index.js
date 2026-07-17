import loadAddAndEdit from './addAndEdit.js';
import loadLD from './langDelete.js';
import search from './list.js';

const vscode = acquireVsCodeApi();

function loadPage() {
    loadAddAndEdit(vscode);
    loadLD(vscode);
    search(vscode);
}

// Page buttons
window.pBtn = {
    goToPage: (model, page) => {
        vscode.postMessage({
            command: "goToPage",
            payload: { model: model, page: page }
        })
    },

    goToIndex: () => {
        vscode.postMessage({
            command: "goToIndex",
            payload: { dummy: "foo" }
        })
    },

    goToEdit: (model, id) => {
        vscode.postMessage({
            command: "goToEdit",
            payload: { model: model, id: id }
        })
    },

    goToAdd: (model) => {
        vscode.postMessage({
            command: "goToAdd",
            payload: { model: model }
        })
    },

    pasteSnippet: (id) => {
        const snippetField = document.getElementById("snippetField");
        if (snippetField) {
            const snippet = snippetField.value.trim();
            vscode.postMessage({
                command: "pasteSnippet",
                payload: { is_edit_view: true, snippet: snippet }
            })
        } else {
            vscode.postMessage({
                command: "pasteSnippet",
                payload: { is_edit_view: false, id: id }
            })
        }
    },

    goToManager: (model) => {
        vscode.postMessage({
            command: "goToManager",
            payload: { model: model, page: 1 }
        });
    },

    deleteModel: (model, id) => {
        vscode.postMessage({
            command: "deleteModel",
            payload: { model: model, id: id }
        })
    }
}

if (document.readyState === 'loaded') {
    loadPage();
} else {
    document.addEventListener('DOMContentLoaded', loadPage);
}