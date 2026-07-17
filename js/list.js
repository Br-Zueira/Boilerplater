export default function search(api) {
    const vscode = api;

    // Set up model here in an unrelated function just to make sure DOM is loaded when this function is called
    const modelEl = document.getElementById("model");
    if (!modelEl) return;
    const model = modelEl.value;

    // Debounce timeout variable to limit the number of search requests
    let debounceTimeout;
    
    const rawCursorPosEl = document.getElementById("cursorPos");
    let cursorStart = 0
    let cursorEnd = 0
    if (rawCursorPosEl) {
        const rawCursorPos = rawCursorPosEl.value; // Gets like '0,0'
        const cursorPos = rawCursorPos.split(',').map(Number); // Becomes actual array: [0, 0]
        cursorStart = cursorPos[0];
        cursorEnd = cursorPos[1];
    }

    // Get the search bar element
    const searchBar = document.getElementById("searchBar");
    if (!searchBar) return;
    searchBar.focus();
    searchBar.setSelectionRange(cursorStart, cursorEnd);

    // Function to emit the search message to the extension
    function emitSearch(searchQuery, bar) {
        // Recover cursor position
        const start = bar.selectionStart ?? 0;
        const end = bar.selectionEnd ?? 0;
        vscode.postMessage({
            command: "search",
            payload: { model: model, searchQuery: searchQuery, cursorPos: [start, end] }
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