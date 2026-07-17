// TomSelect handling
let vscode;
let activeCallback = null;

function loadTomSelect() {
    const languageSelector = document.getElementById("newLangSelector");
    if (languageSelector) {
            const languageTom = new TomSelect(languageSelector, {
            valueField: 'id',
            labelField: 'displayName',
            searchField: 'displayName',
            plugins: {
                'no_backspace_delete': {}, 
            },
            load: function(query, callback) {
                activeCallback = callback;
                vscode.postMessage({
                    command: 'searchLanguages',
                    payload: { searchQuery: query }
                });
            }
        });
    }
}

// Bridge between front and backend
function setupMessageListener() {
    window.addEventListener("message", (event) => {
        const message = event.data;
        switch (message.command) {
            case "receiveLanguages": {
                if (activeCallback) {
                    activeCallback(message.payload.languages);
                    activeCallback = null;
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
    const newLangForm = document.getElementById("newLangForm");
    if (!newLangForm) {
        return;
    }
    newLangForm.addEventListener("submit", (event) => {
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

        // Appends action (the submit button that was used) info
        if (event.submitter && event.submitter.name) {
            data[event.submitter.name] = event.submitter.value;
        }

        vscode.postMessage({
            command: "submitLangDelete",
            payload: { formData: data }
        });
    });
}

// Load the TomSelect and setup the form when the DOM is fully loaded
export default function loadLD(api) {
    vscode = api;
    loadTomSelect();
    setupMessageListener();
    setupForm();
}