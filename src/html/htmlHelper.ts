export function page404(message: string) {
    return boiler(`
        <h1>Error 404:</h1>
        <p>${message}</p>
    `);
}

// HTML boilerplate
export function boiler(body: string, head?: string) {
    return `
        <!DOCTYPE html>

        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Boilerplater</title>
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
            const lang = db.exec(`SELECT displayName FROM languages WHERE id = ?`, [instance.language_id])[0]?.values?.[0]?.[0] || "UNKNOWN LANGUAGE";
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