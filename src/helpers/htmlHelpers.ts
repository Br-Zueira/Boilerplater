import * as css from '../views/static/css.js';

export function page404(message: string) {
    return boiler(/*HTML*/`
        <h1>Error 404:</h1>
        <p>${message}</p>
    `);
}

// HTML boilerplate
export function boiler(body: string, script?: string, head?: string) {
    return /*HTML*/`
        <!DOCTYPE html>

        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Boilerplater</title>
                <style>${ css.webviewCss }</style>

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
            return /*HTML*/`
                <p><strong>Title:</strong> ${instance.title}</p>
                <p><strong>Description:</strong> ${instance.description}</p>
                <p><strong>Snippet:</strong> ${instance.snippet}</p>
                <p><strong>Language:</strong> ${lang}</p>
            `;
        }
        case ("tags"): {
            return /*HTML*/`
                <p><strong>Label:</strong> ${instance.label}</p>
            `;
        }
        case ("languages"): {
            return /*HTML*/`
                <p><strong>Display name:</strong> ${instance.displayName}</p>
                <p><strong>Internal name:</strong> ${instance.internalName}</p>
            `;
        }
        default: {
            return /*HTML*/`
                <p><strong>INVALID MODEL</strong></p>
            `;
        }
    }
}

export function getEditableFields(model: string, object: any, language: any = undefined, tags: any = undefined) {
    switch (model) {
        case ("snippets"): {
            let languageOption: string;

            // Avoid "accessing property of undefined" error
            if (language && language.id && language.displayName) {
                languageOption = /*HTML*/`<option value="${language.id}" selected>${language.displayName}</option>`
            } else {
                languageOption = ''
            }

            let tagOptions = '';

            if (tags)  {
                tags.forEach((element: any) => {
                    tagOptions += /*HTML*/`<option value="${element.id}" selected>${element.label}</option>\n`;
                });
            }

            return /*HTML*/`
                <label>
                    <h2>Title:</h2>
                    <input type="text" name="title" value="${object.title}" placeholder="My amazing snippet">
                </label>
                <label>
                    <h2>Description:</h2>
                    <textarea name="description">${object.description}</textarea>
                </label>
                <label>
                    <h2>Snippet:</h2>
                    <textarea name="snippet">${object.snippet}</textarea>
                </label>
                <div>
                    <label for="tagSelector">Tags</label>
                    <select id="tagSelector" name="tags" multiple>
                        ${tagOptions}
                    </select>
                </div>
                <div>
                    <label for="languageSelector">Language</label>
                    <select id="languageSelector" name="language" required="true">
                        ${languageOption}
                    </select>
                </div>
            `;
        }
        case ("languages"): {
            return /*HTML*/`
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
            return /*HTML*/`
                <label>
                    <h2>Label:</h2>
                    <input type="text" name="label" value="${object.label}" placeholder="Cool Functions">
                </label>
            `;
        }
        default: {
            return /*HTML*/`<h1>INVALID MODEL</h1>`
        }
    }
}