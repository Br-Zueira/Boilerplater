export function index() {
    return boiler(`
        <p>Hello, Boilerplater!</p>
    `);
}

function boiler(body: string, head?: string) {
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