import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode'

// TomSelect CSS
export function getTomSelectLibCss(context: vscode.ExtensionContext): string {
    const tomSelectLibCssPath = path.join(context.extensionPath, 'node_modules', 'tom-select', 'dist', 'css', 'tom-select.css');
    return fs.readFileSync(tomSelectLibCssPath, 'utf8');
}

export const webviewCss = 
/*CSS*/`
/* ==========================================================================
VS CODE WEBVIEW EXTENSION OVERRIDES FOR DEFAULT STYLES
========================================================================== */
button {
    padding: 5px;
    font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, sans-serif);
    border: 1px solid var(--vscode-dropdown-border, #000);
    border-radius: 2px;
    color: var(--vscode-editor-foreground, #000);
}
`;

export const tomSelectCssOverride =
/*CSS*/`
/* ==========================================================================
VS CODE WEBVIEW EXTENSION OVERRIDES FOR TOM-SELECT
========================================================================== */

/* 1. Main Outer Wrapper */
.ts-wrapper {
    padding: 0 !important;
    font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, sans-serif);
    font-size: var(--vscode-font-size, 13px);
}

/* 2. The Input / Control Box (Closed State) */
.ts-control {
    background-color: var(--vscode-dropdown-background, #3c3c3c) !important;
    color: var(--vscode-dropdown-foreground, #cccccc) !important;
    border: 1px solid var(--vscode-dropdown-border, #3c3c3c) !important;
    border-radius: 2px;
    padding: 6px 8px !important;
    box-shadow: none !important;
    transition: border-color 0.1s ease;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
}

/* 3. Input Box Focus State (Matches VS Code interactive borders) */
.ts-wrapper.focus .ts-control {
    border-color: var(--vscode-focusBorder, #007acc) !important;
    outline: none !important;
    box-shadow: none !important;
}

/* 4. Inside the Input Box (Active cursor input) */
.ts-control input {
    color: var(--vscode-dropdown-foreground, #cccccc) !important;
    font-family: inherit;
}

.ts-control input::placeholder {
    color: var(--vscode-input-placeholderForeground, #a6a6a6) !important;
}

/* 5. Dropdown List Container (Floating Box) */
.ts-dropdown {
    background-color: var(--vscode-dropdown-background, #3c3c3c) !important;
    color: var(--vscode-dropdown-foreground, #cccccc) !important;
    border: 1px solid var(--vscode-dropdown-border, #3c3c3c) !important;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3) !important;
    border-radius: 0 0 2px 2px;
    z-index: 10000;
}

/* 6. Individual Options inside the Dropdown List */
.ts-dropdown .option {
    padding: 6px 8px !important;
    cursor: pointer;
}

/* Active Highlight / Hover over an Option */
.ts-dropdown .active {
    background-color: var(--vscode-quickInputList-focusBackground, #04395e) !important;
    color: var(--vscode-quickInputList-focusForeground, #ffffff) !important;
}

/* 7. MULTI-SELECT TOKEN BADGES (e.g., Snippet Tags) */
.ts-control .item {
    background: var(--vscode-badge-background, #4d4d4d) !important;
    color: var(--vscode-badge-foreground, #ffffff) !important;
    border: 1px solid var(--vscode-widget-border, transparent) !important;
    border-radius: 2px !important;
    padding: 2px 6px !important;
    margin: 0 !important;
    display: inline-flex;
    align-items: center;
    box-shadow: none !important;
}

/* Multi-select Token Close ("x") Button */
.ts-control .item .remove {
    border-left: 1px solid rgba(255, 255, 255, 0.15) !important;
    margin-left: 6px !important;
    padding-left: 4px !important;
    color: inherit !important;
    opacity: 0.7;
}

.ts-control .item .remove:hover {
    background: rgba(255, 255, 255, 0.1) !important;
    opacity: 1;
}

/* 8. Disabled State Layout */
.ts-wrapper.disabled .ts-control {
    background-color: var(--vscode-input-disabledBackground, #2d2d2d) !important;
    color: var(--vscode-input-disabledForeground, #7f7f7f) !important;
    opacity: 0.6;
    cursor: not-allowed;
}

/* 9. Seamless Caret/Dropdown Arrow styling */
.ts-wrapper.single .ts-control {
    padding-right: 24px !important;
}

.ts-wrapper.single .ts-control::after {
    border-color: var(--vscode-dropdown-foreground, #cccccc) transparent transparent transparent !important;
    right: 10px !important;
}

.ts-wrapper.single.open .ts-control::after {
    border-color: transparent transparent var(--vscode-dropdown-foreground, #cccccc) transparent !important;
}
`;