import * as fs from 'fs';
import * as path from 'path';

// TomSelect Js
const tomSelectLibJsPath = path.join(__dirname, '..', '..', '..', 'node_modules', 'tom-select', 'dist', 'js', 'tom-select.complete.min.js');
export const tomSelectLibJs = fs.readFileSync(tomSelectLibJsPath, 'utf8');

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

export function edit(model: string, id: number) {
    return /*JavaScript*/`
        ${tomSelectLibJs}
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
        document.addEventListener('DOMContentLoaded', () => {
            const tagSelector = document.getElementById("tagSelector");
            const languageSelector = document.getElementById("languageSelector");
            if (!tagSelector || !languageSelector) {
                return;
            }

            const activeCallbacks = {
                tags: null,
                languages: null
            };

            const tagTom = new TomSelect(tagSelector, {
                valueField: 'id',
                labelField: 'label',
                searchField: 'label',
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
                load: function(query, callback) {
                    activeCallbacks.languages = callback;
                    vscode.postMessage({
                        command: 'searchLanguages',
                        payload: { searchQuery: query }
                    });
                }
            });

            window.addEventListener("message", (event) => {
                const message = event.data;
                switch (message.command): {
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
                }
            });
        });
    `;
}