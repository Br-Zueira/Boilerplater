import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import initSqlJs, { Database } from 'sql.js';

export async function sqlInit(context: vscode.ExtensionContext): Promise<Database> {
    const dbFolderPath = context.globalStorageUri.fsPath;
    const dbFilePath = path.join(dbFolderPath, 'boilerplater.db');
    
    fs.mkdirSync(dbFolderPath, { recursive: true });

    const raw = fs.readFileSync(path.join(context.extensionPath, 'out', 'database', 'sql-wasm.wasm'));
    const wasmBinary = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) as ArrayBuffer;

    const SQL = await initSqlJs({ wasmBinary });

    let db: Database;
    if (fs.existsSync(dbFilePath)) {
        try {
            db = new SQL.Database(new Uint8Array(fs.readFileSync(dbFilePath)));
            db.run("PRAGMA foreign_keys = ON;");
        } catch {
            db = new SQL.Database();
            db.run("PRAGMA foreign_keys = ON;");

            db.run("CREATE TABLE IF NOT EXISTS tags " +
                "(id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "label TEXT UNIQUE NOT NULL);");

            db.run("CREATE TABLE IF NOT EXISTS languages " + 
                "(id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "name TEXT UNIQUE NOT NULL);");

            db.run("CREATE TABLE IF NOT EXISTS snippets " +
                "(id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "title TEXT NOT NULL, " +
                "description TEXT, " +
                "snippet TEXT NOT NULL, " +
                "language_id INTEGER NOT NULL, " +
                "FOREIGN KEY(language_id) REFERENCES languages(id) ON DELETE CASCADE);");

            db.run("CREATE TABLE IF NOT EXISTS tts_otm " +
                "(id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "tag_id INTEGER NOT NULL, " +
                "snippet_id INTEGER NOT NULL, " +
                "FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE, " +
                "FOREIGN KEY(snippet_id) REFERENCES snippets(id) ON DELETE CASCADE);");

            fs.writeFileSync(dbFilePath, Buffer.from(db.export()));
        }
    } else {
        db = new SQL.Database();
        db.run("PRAGMA foreign_keys = ON;");

        db.run("CREATE TABLE IF NOT EXISTS tags " +
            "(id INTEGER PRIMARY KEY AUTOINCREMENT, " +
            "label TEXT UNIQUE NOT NULL);");

        db.run("CREATE TABLE IF NOT EXISTS languages " + 
            "(id INTEGER PRIMARY KEY AUTOINCREMENT, " +
            "displayName TEXT UNIQUE NOT NULL, " + 
            "internalName TEXT UNIQUE NOT NULL);");

        db.run("CREATE TABLE IF NOT EXISTS snippets " +
            "(id INTEGER PRIMARY KEY AUTOINCREMENT, " +
            "title TEXT NOT NULL, " +
            "description TEXT, " +
            "snippet TEXT NOT NULL, " +
            "language_id INTEGER NOT NULL, " +
            "FOREIGN KEY(language_id) REFERENCES languages(id) ON DELETE CASCADE);");

        db.run("CREATE TABLE IF NOT EXISTS tts_otm " +
            "(id INTEGER PRIMARY KEY AUTOINCREMENT, " +
            "tag_id INTEGER NOT NULL, " +
            "snippet_id INTEGER NOT NULL, " +
            "FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE, " +
            "FOREIGN KEY(snippet_id) REFERENCES snippets(id) ON DELETE CASCADE);");

        fs.writeFileSync(dbFilePath, Buffer.from(db.export()));
    }

    return db;
}