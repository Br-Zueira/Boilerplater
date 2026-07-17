let model, id, vscode;

// Form submission part
function setupForm() {
    const form = document.getElementById("form");
    if (!form) {
        return;
    }
    form.addEventListener("submit", (event) => {
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

        if (id) {
            vscode.postMessage({
                command: "submitEdit",
                payload: { model: model, id: id, formData: data }
            });
        } else {
            vscode.postMessage({
                command: "submitAdd",
                payload: { model: model, formData: data }
            });
        }
    });
}

// TomSelect part (for snippet editing)
const activeCallbacks = {
    tags: null,
    languages: null,
    internalNames: null
};

function loadTomSelect() {
    const tagSelector = document.getElementById("tagSelector");
    if (tagSelector) {
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
    }

    const languageSelector = document.getElementById("languageSelector");
    if (languageSelector) {
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

    const internalNameSelector = document.getElementById("internalNameSelector");
    if (internalNameSelector) {
        const internalNameTom = new TomSelect(internalNameSelector, {
            valueField: 'internalName',
            labelField: 'internalName',
            searchField: 'internalName',
            plugins: {
                'no_backspace_delete': {}, 
            },
            load: function(query, callback) {
                activeCallbacks.internalNames = callback;
                vscode.postMessage({
                    command: 'searchNewLangs',
                    payload: { searchQuery: query }
                });
            }
        });
    }
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
            case "receiveNewLangs": {
                if (activeCallbacks.internalNames) {
                    activeCallbacks.internalNames(message.payload.languages);
                    activeCallbacks.internalNames = null;
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

            // If shift is pressed, remove up to 4 spaces, else add 4 spaces 
            if (e.shiftKey) {
                // Catches cursor pos
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;

                // Gets highlighted text, empty string if no selected text
                const highlighted = textarea.value.substring(start, end);

                // Check is kind of an alias to start, to not change the original start variable
                let check = start;

                // I for loop, declared up here to overcome scope issues
                let i;

                // Removes the highlight first, otherwise the for loop will actually not remove one of the spaces
                if (highlighted) {
                    document.execCommand('delete', false);
                }

                // Removes up until 4 spaces
                for (i = 0; i < 4; i++) {
                    // Checks if character right before cursor is a space char
                    if (textarea.value.slice(check-1, check) !== " " || check <= 0) break;
                    document.execCommand('delete', false)
                    check--;
                }

                // Resinserts the highlighted text, if any, after the spaces have been removed
                document.execCommand('insertText', false, highlighted);

                // Correctly replaces cursor to continue highlighting string (or only the blink cursor, if no highlighting)
                textarea.selectionStart = start - i;
                textarea.selectionEnd = end - i;
            } else {
                // Catches cursor pos
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;

                // Gets highlighted text, empty string if no selected text
                const highlighted = textarea.value.substring(start, end);

                // Inserts 4 blank spaces at cursor position
                document.execCommand('insertText', false, '    ' + highlighted);

                // Correctly replaces cursor to continue highlighting string (or only the blink cursor, if no highlighting)
                textarea.selectionStart = start + 4;
                textarea.selectionEnd = end + 4;
            }
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
export default function loadAddAndEdit(api) {
    vscode = api;
    model = document.getElementById("model")?.value || "";
    const idEl = document.getElementById("id");
    id = idEl ? idEl.value : null;
    loadTomSelect();
    setupForm();
    setupMessageListener();
    setTextArea();
}