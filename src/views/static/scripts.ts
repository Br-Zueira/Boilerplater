import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode'

// TomSelect Js
export function getTomSelectLibJs(context: vscode.ExtensionContext): string {
    const tomSelectLibJsPath = path.join(context.extensionPath, 'node_modules', 'tom-select', 'dist', 'js', 'tom-select.complete.js');
    return fs.readFileSync(tomSelectLibJsPath, 'utf8');
}

export function index() {
    return /*JavaScript*/`
        // Function to abstract the page swapping message call
        function goToManager(model) {
            vscode.postMessage({
                command: "goToManager",
                payload: { model: model, page: 1 }
            });
        }
    `;
}

export function list(model: string) {
    return /*JavaScript*/`            
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

        function goToEdit(id) {
            vscode.postMessage({
                command: "goToEdit",
                payload: { model: "${model}", id: id }
            })
        }
    `;
}

export function edit(model: string, id: number, context: vscode.ExtensionContext) {
    return /*JavaScript*/`
        function goToIndex() {
            vscode.postMessage({
                command: "goToIndex",
                payload: { dummy: "foo"}
            })
        }
            
        function deleteModel() {
            vscode.postMessage({
                command: "deleteModel",
                payload: { model: "${model}", id: ${id} }
            })
        }

        // TomSelect part (for snippet editing)
        const activeCallbacks = {
            tags: null,
            languages: null
        };

        function loadTomSelect() {
            const tagSelector = document.getElementById("tagSelector");
            const languageSelector = document.getElementById("languageSelector");
            if (!tagSelector || !languageSelector) {
                return;
            }

            const tagTom = new TomSelect(tagSelector, {
                valueField: 'id',
                labelField: 'label',
                searchField: 'label',
                plugins: {
                    'remove_button': {
                        title: 'Remove this tag'
                    }, 
                    'no_backspace_delete': {}, 
                    'checkbox_options': {}
                },
                load: function(query, callback) {
                    activeCallbacks.tags = callback;
                    vscode.postMessage({
                        command: 'searchTags',
                        payload: { searchQuery: query }
                    });
                }
            });

            const languageTom = new TomSelect(languageSelector, {
                valueField: 'id',
                labelField: 'displayName',
                searchField: 'displayName',
                plugins: {
                    'no_backspace_delete': {}, 
                },
                load: function(query, callback) {
                    activeCallbacks.languages = callback;
                    vscode.postMessage({
                        command: 'searchLanguages',
                        payload: { searchQuery: query }
                    });
                }
            });
        }

        // Bridge between the webview and the extension
        function setupMessageListener() {
            window.addEventListener("message", (event) => {
                const message = event.data;
                switch (message.command) {
                    case "receiveTags": {
                        if (activeCallbacks.tags) {
                            activeCallbacks.tags(message.payload.tags);
                            activeCallbacks.tags = null;
                        }
                        break;
                    }
                    case "receiveLanguages": {
                        if (activeCallbacks.languages) {
                            activeCallbacks.languages(message.payload.languages);
                            activeCallbacks.languages = null;
                        }
                        break;
                    }
                    case "error": {
                        const errorMessageElement = document.getElementById("errorMessage");
                        if (errorMessageElement) {
                            errorMessageElement.textContent = message.payload.error;
                            errorMessageElement.style.display = "block";
                        }
                        const successMessageElement = document.getElementById("successMessage");
                        if (successMessageElement) {
                            successMessageElement.textContent = '';
                            successMessageElement.style.display = "none";
                        }
                        break;
                    }
                    case "success": {
                        const successMessageElement = document.getElementById("successMessage");
                        if (successMessageElement) {
                            successMessageElement.textContent = message.payload.string;
                            successMessageElement.style.display = "block";
                        }
                        const errorMessageElement = document.getElementById("errorMessage");
                        if (errorMessageElement) {
                            errorMessageElement.textContent = '';
                            errorMessageElement.style.display = "none";
                        }
                        break;
                    }
                }
            });
        }

        // Form submission part
        function setupForm() {
            const editForm = document.getElementById("editForm");
            if (!editForm) {
                return;
            }
            editForm.addEventListener("submit", (event) => {
                event.preventDefault();
                const formData = new FormData(event.target);
                const data = {};

                for (const key of formData.keys()) {
                    const value = formData.getAll(key);
                    if (value.length > 1) {
                        data[key] = value;
                    } else {
                        data[key] = value[0];
                    }
                }

                if (!data.tags) {
                    data.tags = [];
                }

                vscode.postMessage({
                    command: "submitEdit",
                    payload: { model: "${model}", id: Number("${id}") || null, formData: data }
                });
            });
        }

        // Load the TomSelect and setup the form when the DOM is fully loaded
        function loadPage() {
            loadTomSelect();
            setupForm();
            setupMessageListener();
        }

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", loadPage);
        } else {
            loadPage();
        }
    `;
}