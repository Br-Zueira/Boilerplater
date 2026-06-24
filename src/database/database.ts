import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import initSqlJs, { Database } from 'sql.js';

export async function sqlInit(context: vscode.ExtensionContext): Promise<Database> {
    // Mount database path
    const dbFolderPath = context.globalStorageUri.fsPath;
    const dbFilePath = path.join(dbFolderPath, 'boilerplater.db');
    
    // Prepare SQL instance
    await fs.promises.mkdir(dbFolderPath, { recursive: true });

    const raw = await fs.promises.readFile(path.join(context.extensionPath, 'out', 'database', 'dist', 'sql-wasm.wasm'));

    const SQL = await initSqlJs({ wasmBinary: raw.buffer });

    // Set up database object
    let db: Database;
    if (fs.existsSync(dbFilePath)) {
        try {
            const dbData = await fs.promises.readFile(dbFilePath);
            db = new SQL.Database(new Uint8Array(dbData));
            // Enforce foreign keys constraint
            db.run("PRAGMA foreign_keys = ON;");
        } catch {
            // If file is corrupted, recreate from scratch
            db = createFreshDB(SQL, context);
        }
    } else {
        // Brand new file
        db = createFreshDB(SQL, context);
    }

    return db;
}

// Commit changes to the hard drive
export function saveDB(db: Database, context: vscode.ExtensionContext) {
    // Get database path
    const dbFolderPath = context.globalStorageUri.fsPath;
    const dbFilePath = path.join(dbFolderPath, 'boilerplater.db');
    
    // Save into database
    fs.writeFileSync(dbFilePath, Buffer.from(db.export()));
}

// Internal helper to create new BD
function createFreshDB(SQL: any, context: vscode.ExtensionContext) {
    // Database object from SQL instance
    const db = new SQL.Database();

    // Enforce foreign keys constraint
    db.run("PRAGMA foreign_keys = ON;");

    // Creating tables
    db.run("CREATE TABLE IF NOT EXISTS tags " +
        "(id INTEGER PRIMARY KEY AUTOINCREMENT, " +
        "label TEXT UNIQUE NOT NULL);");

    db.run("CREATE TABLE IF NOT EXISTS languages " + 
        "(id INTEGER PRIMARY KEY AUTOINCREMENT, " +
        "displayName TEXT UNIQUE NOT NULL," + 
        "internalName TEXT UNIQUE NOT NULL);");

    db.run("CREATE TABLE IF NOT EXISTS snippets " +
        "(id INTEGER PRIMARY KEY AUTOINCREMENT, " +
        "title TEXT NOT NULL, " +
        "description TEXT, " +
        "snippet TEXT NOT NULL, " +
        "language_id INTEGER NOT NULL, " +
        "FOREIGN KEY(language_id) REFERENCES languages(id) ON DELETE CASCADE);");

    // Many-to-many middleman
    db.run("CREATE TABLE IF NOT EXISTS snippet_tags " +
        "(id INTEGER PRIMARY KEY AUTOINCREMENT, " +
        "tag_id INTEGER NOT NULL, " +
        "snippet_id INTEGER NOT NULL, " +
        "FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE, " +
        "FOREIGN KEY(snippet_id) REFERENCES snippets(id) ON DELETE CASCADE);");

    saveDB(db, context);
    return db;
}