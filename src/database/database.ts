import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import initSqlJs, { Database } from 'sql.js';

export async function sqlInit(context: vscode.ExtensionContext): Promise<Database> {
    const dbFolderPath = context.globalStorageUri.fsPath;
    const dbFilePath = path.join(dbFolderPath, 'boilerplater.db');

    console.log(`Database: ${dbFilePath}`);
    
    await fs.promises.mkdir(dbFolderPath, { recursive: true });

    const raw = await fs.promises.readFile(path.join(context.extensionPath, 'out', 'database', 'dist', 'sql-wasm.wasm'));

    const SQL = await initSqlJs({ wasmBinary: raw.buffer });

    let db: Database;
    if (fs.existsSync(dbFilePath)) {
        try {
            const dbData = await fs.promises.readFile(dbFilePath);
            db = new SQL.Database(new Uint8Array(dbData));
            db.run("PRAGMA foreign_keys = ON;");
        } catch {
            db = createFreshDB(SQL, context);
        }
    } else {
        db = createFreshDB(SQL, context);
    }

    return db;
}

// Commit changes to the hard drive
export function saveDB(db: Database, context: vscode.ExtensionContext) {
    const dbFolderPath = context.globalStorageUri.fsPath;
    const dbFilePath = path.join(dbFolderPath, 'boilerplater.db');
    
    fs.writeFileSync(dbFilePath, Buffer.from(db.export()));
}

function createFreshDB(SQL: any, context: vscode.ExtensionContext) {
    const db = new SQL.Database();
    db.run("PRAGMA foreign_keys = ON;");

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

    db.run("CREATE TABLE IF NOT EXISTS snippet_tags " +
        "(id INTEGER PRIMARY KEY AUTOINCREMENT, " +
        "tag_id INTEGER NOT NULL, " +
        "snippet_id INTEGER NOT NULL, " +
        "FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE, " +
        "FOREIGN KEY(snippet_id) REFERENCES snippets(id) ON DELETE CASCADE);");

    saveDB(db, context);
    return db;
}