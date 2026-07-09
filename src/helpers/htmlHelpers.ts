import * as css from '../views/static/css.js';
import * as databaseHelpers from '../helpers/databaseHelpers.js';

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

export function getInstanceContent(model: string, instance: any, db: any, isSearch: boolean = false) {
    switch (model) {
        case ("snippets"): {
            let lang: string = ""; 
            let tags: string = ""; 
            if (isSearch) {
                lang = instance.LangageName;
                for (const tag of JSON.parse(instance.tagLabels)) {
                    if (tag === null) continue;
                    tags += /*HTML*/`<span class="tag">${tag}</span>`;
                }
            } else {
                lang = db.getLanguage(instance);
                tags = getTags(instance, db);
            }
            return /*HTML*/`
                <p><strong>Title:</strong> ${limitCharSize(instance.title, 50)}</p>
                <p><strong>Description:</strong> ${limitCharSize(instance.description, 100)}</p>
                <p><strong>Snippet:</strong> ${limitCharSize(instance.snippet, 100)}</p>
                <p><strong>Language:</strong> ${lang}</p>
                <p><strong>Tags:</strong> ${tags}</p>
            `;
        }
        case ("tags"): {
            return /*HTML*/`
                <p><strong>Label:</strong> ${limitCharSize(instance.label, 50)}</p>
            `;
        }
        case ("languages"): {
            return /*HTML*/`
                <p><strong>Display name:</strong> ${limitCharSize(instance.displayName, 50)}</p>
                <p><strong>Internal name:</strong> ${limitCharSize(instance.internalName, 50)}</p>
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
                    <input type="text" name="title" value="${object.title || ''}" placeholder="My amazing snippet" required>
                </label>
                <label>
                    <h2>Description:</h2>
                    <textarea name="description">${object.description || ''}</textarea>
                </label>
                <label>
                    <h2>Snippet:</h2>
                    <textarea name="snippet" required>${object.snippet || ''}</textarea>
                </label>
                <div>
                    <label for="tagSelector">Tags</label>
                    <select id="tagSelector" name="tags" multiple>
                        ${tagOptions}
                    </select>
                </div>
                <div>
                    <label for="languageSelector">Language</label>
                    <select id="languageSelector" name="language" required>
                        ${languageOption}
                    </select>
                </div>
            `;
        }
        case ("languages"): {
            return /*HTML*/`
                <label>
                    <h2>Display name:</h2>
                    <input type="text" name="displayName" value="${object.displayName || ''}" placeholder="Lorem Ipsum Language" required>
                </label>
                <label>
                    <h2>Internal name (automatically generated):</h2>
                    <input type="text" name="internalName" value="${object.internalName || ''}" readonly placeholder="loremipsum" required>
                </label>
            `;
        }
        case ("tags"): {
            return /*HTML*/`
                <label>
                    <h2>Label:</h2>
                    <input type="text" name="label" value="${object.label || ''}" placeholder="Cool Functions" required>
                </label>
            `;
        }
        default: {
            return /*HTML*/`<h1>INVALID MODEL</h1>`
        }
    }
}

function getTags(instance: any, db: any): string {
    // Limit the number of tags displayed to avoid cluttering the UI
    const quantity = 5;

    // Get the tags associated with the snippet from the database
    const tags = db.query(/*SQL*/`
        SELECT t.*
        FROM tags as t
        INNER JOIN snippet_tags AS st
            ON t.id = st.tag_id
        WHERE st.snippet_id = ?
        ORDER BY t.label ASC
    `, [instance.id])?.[0] || [];

    // If there are no tags, return "None"
    if (!tags || !tags.columns || !tags.values) {
        return 'None';
    }

    // Formating of tags to a more usable format + tags amount
    const formatedTags = databaseHelpers.formatRows(tags.columns, tags.values);
    const tagNum = formatedTags.length;

    // Max char size for each tag
    const maxSize = 20;

    // Html string to hold the tags
    let htmlTags: string = "";

    // Loop through the tags and add them to the htmlTags string, limiting the number of tags displayed to the quantity variable
    for (const [i, tag] of formatedTags.entries()) {
        // Limit the length of the tag label to avoid cluttering the UI
        if (tag.label.length > maxSize) {
            tag.label = limitCharSize(tag.label, maxSize);
        }

        // If the current index is equal to the quantity variable, add a "more" tag to the htmlTags string and break the loop
        if (i === quantity) {
            htmlTags += /*HTML*/`<span class="tag">+${tagNum - quantity} more</span>`;
            break;
        }

        // Add the tag to the htmlTags string
        htmlTags += /*HTML*/`<span class="tag">${tag.label}</span>`
    }
    return htmlTags;
}

function limitCharSize(str: string, maxSize: number): string {
    if (str.length > maxSize) {
        return str.substring(0, maxSize) + '...';
    }
    return str;
}