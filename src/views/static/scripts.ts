import * as fs from 'fs';
import * as path from 'path';
import { state } from '../../controlers/stateControler.js';

// TomSelect Js
export function getTomSelectLibJs(): string {
    const tomSelectLibJsPath = path.join(state.context.extensionPath, 'out', 'views', 'static', 'tom-select', 'tom-select.complete.js');
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


export function list(model: string, [cursorStart, cursorEnd]: [number, number] = [0, 0]) {
    return /*JavaScript*/`
        function goToPage(page) {
            vscode.postMessage({
                command: "goToPage",
                payload: { model: "${model}", page: page }
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

        function goToAdd(model) {
            vscode.postMessage({
                command: "goToAdd",
                payload: { model: model }
            })
        }

        function pasteSnippet(id) {
            vscode.postMessage({
                command: "pasteSnippet",
                payload: { is_edit_view: false, id: id }
            })
        }
        
        function search() {
            // Debounce timeout variable to limit the number of search requests
            let debounceTimeout;
            
            // Get the search bar element
            const searchBar = document.getElementById("searchBar");
            searchBar.focus();
            searchBar.setSelectionRange(${cursorStart}, ${cursorEnd});

            // Function to emit the search message to the extension
            function emitSearch(searchQuery, bar) {
                // Recover cursor position
                const start = bar.selectionStart ?? 0;
                const end = bar.selectionEnd ?? 0;
                vscode.postMessage({
                    command: "search",
                    payload: { model: "${model}", searchQuery: searchQuery, cursorPos: [start, end] }
                });
            };

            searchBar.addEventListener("keydown", (event) => {
                // Handle the "Enter" key press to trigger search immediately
                if (event.key === "Enter") {
                    const searchQuery = event.target.value;
                    clearTimeout(debounceTimeout);
                    emitSearch(searchQuery, event.target);
                    return;
                }

                // Every printable char have a length of 1, 
                // While non printable chars have more
                const isPrintableChar = event.key.length === 1;

                // Only typing related keys can fire the query
                if (isPrintableChar || event.key === "Backspace" || event.key === "Delete") {
                    const bar = event.target;
                    clearTimeout(debounceTimeout);

                    // Debounce the search input to avoid excessive calls
                    debounceTimeout = setTimeout(() => {
                        const searchQuery = bar.value;
                        emitSearch(searchQuery, event.target);
                    }, 300);
                }
            });
        }

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", search);
        } else {
            search();
        }
    `;
}

// Helper for shared code between edit and add functions
function editAndAdd(model: string) {
    return /*JavaScript*/`
        // Functions for the buttons on the page
        function goToManager() {
            vscode.postMessage({
                command: "goToManager",
                payload: { model: "${model}"}
            })
        }

        function pasteSnippet() {
            const snippetField = document.getElementById("snippetField");
            if (!snippetField) return;
            const snippet = snippetField.value.trim();
            vscode.postMessage({
                command: "pasteSnippet",
                payload: { is_edit_view: true, snippet: snippet }
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

        function setTextArea() {
            const textarea = document.getElementById("snippetField");
            if (!textarea) return;

            textarea.addEventListener('keydown', (e) => {
                // Setup so tab indents instead of jumping through HTML
                if (e.key === 'Tab') {
                    // Avoids tab from jumping to HTML elements
                    e.preventDefault();

                    // Inserts 4 blank spaces at cursor position
                    document.execCommand('insertText', false, '    ');
                }

                // List of pairs to be auto closed
                const pairs = {
                    '(': ')',
                    '[': ']',
                    '{': '}',
                    '"': '"', 
                    "'": "'",
                    "%": "%",
                    "#": "#"
                }

                // Auto closes (), {}, [], "" and ''
                if (pairs[e.key]) {
                    // Prevents chromium of just inserting the char
                    e.preventDefault();

                    // Catches cursor pos
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;

                    // The opposing character to the typed one
                    const endChar = pairs[e.key];

                    // Gets highlighted text, empty string if no selected text
                    const highlighted = textarea.value.substring(start, end);

                    // Amount of characters to advance over with cursor
                    let jump = 0;

                    // Differenciates between auto insert for placeholder syntax and normal auto insert
                    if (["%", "#"].includes(e.key)) {
                        // Specific auto insert for the placeholder syntax
                        // If inside template syntax, activate the auto insert, else just insert the char normaly
                        if (textarea.value.substring(start - 1, start) === "[" /*If last char is "["*/)  {
                            // Ends up like "[% I'm highlighted! %]"
                            document.execCommand('insertText', false, e.key + " " + highlighted + " " + endChar);
                            jump = 2; // Jumps the placed char + the space
                        } else {
                            // Places the char as usual
                            document.execCommand('insertText', false, e.key);
                            jump = 1;
                        }
                    } else {
                        // Puts the processed text in place, ends up like "(I'm highlighted!)"
                        document.execCommand('insertText', false, e.key + highlighted + endChar);
                        jump = 1; // Jumps the inserted key
                    }

                    // Correctly replaces cursor to continue highlighting string (or only the blink cursor, if no highlighting)
                    textarea.selectionStart = start + jump;
                    textarea.selectionEnd = end + jump;
                }
            });

        }
        
        // Load the TomSelect and setup the form when the DOM is fully loaded
        function loadPage() {
            loadTomSelect();
            setupForm();
            setupMessageListener();
            setTextArea();
        }

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", loadPage);
        } else {
            loadPage();
        }
    `;
}

export function edit(model: string, id: number) {
    return /*JavaScript*/`
        // Function for the button in page
        function deleteModel() {
            vscode.postMessage({
                command: "deleteModel",
                payload: { model: "${model}", id: ${id} }
            })
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
        ${editAndAdd(model)}
    `;
}

export function add(model: string) {
    return /*JavaScript*/`
        // Form submission part
        function setupForm() {
            const addForm = document.getElementById("addForm");
            if (!addForm) {
                return;
            }
            addForm.addEventListener("submit", (event) => {
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
                    command: "submitAdd",
                    payload: { model: "${model}", formData: data }
                });
            });
        }
        ${editAndAdd(model)}
    `;
}