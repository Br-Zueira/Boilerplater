// build.mjs
import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';

// Detect if we are running in watch mode (for development)
const isWatch = process.argv.includes('--watch');

function copy(from, to) {
    try {
        // Ensures the files from 'from' are in an array format
        const files = Array.isArray(from) ? from : [from];

        // Creates the destination folder
        fs.mkdirSync(to, { recursive: true });

        // Iterates through each file
        for (const file of files) {
            // Extracts the name of the file
            const filename = path.basename(file);

            // Mounts the final path
            const destination = path.join(to, filename);

            // Copies the file
            fs.copyFileSync(file, destination);
        }
    } catch (err) {
        console.error("Esbuild: Copy error:", err);
    }
}

try {
    // Begin message
    console.log("Esbuild: Copying static files...");

    // Sql.js
    copy(['node_modules/sql.js/dist/sql-wasm.js', 'node_modules/sql.js/dist/sql-wasm.wasm'], 'out/database/sql-js');
    
    // Tom-Select
    copy(['node_modules/tom-select/dist/js/tom-select.complete.js', 'node_modules/tom-select/dist/css/tom-select.css'], 'out/views/static/tom-select');
    
    const context = await esbuild.context({
        // 1. Define your entry point (usually your main extension file)
        entryPoints: ['src/extension.ts'],
        bundle: true,
        outfile: 'out/extension.js',
        platform: 'node',     // Target Node.js (for VS Code extensions)
        target: 'node16',     // Or your target Node version
        format: 'cjs',        // CommonJS format
        external: ['vscode', './database/sql-js/sql-wasm.js'], // Don't bundle the 'vscode' library
        sourcemap: true,      // Keep sourcemaps for easy debugging
    });

    if (isWatch) {
        console.log("Esbuild: Watching for changes...")
        await context.watch();
    } else {
        console.log("Esbuild: Compiled successfully")
        await context.rebuild();
        await context.dispose();
    }
} catch (err) {
    console.error("Esbuild: Error:", err);
    process.exit(1);
}