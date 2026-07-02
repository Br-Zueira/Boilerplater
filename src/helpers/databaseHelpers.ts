export function formatRows(columns: Array<any> | undefined, rows: Array<any> | undefined) {
    const formattedData = [];

    // Safety gate
    if (!columns || !rows || !Array.isArray(rows) || rows.length === 0) {
        return []; // Returns safe []
    }

    // Loop through each row of values
    for (const rowValues of rows) {
        const itemObject: Record<string, any> = {};
        
        // For the first row, rowValues is [1, "First Snippet"]
        columns.forEach((colName, index) => {
            // Index 0: itemObject["id"] = 1
            // Index 1: itemObject["title"] = "First Snippet"
            itemObject[colName] = rowValues[index];
        });
        
        formattedData.push(itemObject);
    }
    return formattedData;
}

export function sanitize(query: string) {
    // Safety gate
    if (!query || typeof query !== 'string') {
        return '';
    }
    
    // Trim whitespace from the beginning and end of the query
    const trimmedQuery = query.trim();

    // If the trimmed query is empty, return an empty string
    if (trimmedQuery === '') {
        return '';
    }

    return trimmedQuery;
}

export function sanitizeLike(query: string) {
    // Safety gate
    const trimmedQuery = sanitize(query);
    if (trimmedQuery === '') {
        return '';
    }

    // Escape special characters for SQL LIKE queries
    return trimmedQuery.replace(/\\/g, '\\\\\\\\' /* This creates "\\" to escape the own escape char*/).replace(/%/g, '\\\\%').replace(/_/g, '\\\\_');
}