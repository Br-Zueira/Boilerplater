export function page404(message: string) {
    return boiler(`
        <h1>Error 404:</h1>
        <p>${message}</p>
    `);
}

// HTML boilerplate
export function boiler(body: string, script?: string, head?: string) {
    return `
        <!DOCTYPE html>

        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Boilerplater</title>

                <script>
                    const vscode = acquireVsCodeApi();
                ${script ?? ''}
                </script>

                ${head ?? ''}
            </head>
            <body>
                ${body}
            </body>
        </html>
    `;
}

export function getInstanceContent(model: string, instance: any, db: any) {
    switch (model) {
        case ("snippets"): {
            const lang = db.getLanguage(instance);
            return `
                <p><strong>Title:</strong> ${instance.title}</p>
                <p><strong>Description:</strong> ${instance.description}</p>
                <p><strong>Snippet:</strong> ${instance.snippet}</p>
                <p><strong>Language:</strong> ${lang}</p>
            `;
        }
        case ("tags"): {
            return `
                <p><strong>Label:</strong> ${instance.label}</p>
            `;
        }
        case ("languages"): {
            return `
                <p><strong>Display name:</strong> ${instance.displayName}</p>
                <p><strong>Internal name:</strong> ${instance.internalName}</p>
            `;
        }
        default: {
            return `
                <p><strong>INVALID MODEL</strong></p>
            `;
        }
    }
}

export function getEditableFields(model: string, object: any) {
    switch (model) {
        case ("snippets"): {
            return `
                <label>
                    <h2>Title:</h2>
                    <input type="text" name="title" value="${object.title}" placeholder="My amazing snippet">
                </label>
                <label>
                    <h2>Description:</h2>
                    <p contenteditable="plaintext-only" data-name="description">${object.description}</p>
                </label>
                <label>
                    <h2>Snippet:</h2>
                    <p contenteditable="plaintext-only" data-name="snippet">${object.snippet}</p>
                </label>
                <div>
                    <label for="tagSelector">Tags</label>
                    <select id="tagSelector" multiple placeholder="Type to search tags..."></select>
                </div>
                <div>
                    <label for="languageSelector">Language</label>
                    <select id="languageSelector" placeholder="Type to search languages..."></select>
                </div>
            `;
        }
        case ("languages"): {
            return `
                <label>
                    <h2>Display name:</h2>
                    <input type="text" name="displayName" value="${object.displayName}" placeholder="LoremipsumScript">
                </label>
                <label>
                    <h2>Internal name (immutable):</h2>
                    <p>${object.internalName}</p>
                </label>
            `;
        }
        case ("tags"): {
            return `
                <label>
                    <h2>Label:</h2>
                    <input type="text" name="label" value="${object.label}" placeholder="Cool Functions">
                </label>
            `;
        }
        default: {
            return `<h1>INVALID MODEL</h1>`
        }
    }
}