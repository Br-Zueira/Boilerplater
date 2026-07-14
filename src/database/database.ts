import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// Import the database type from node_modules to shut up tsc as it only matters during compiling
import type { Database, SqlJsStatic } from 'sql.js';

// Import actual sql.js code locally to avoid node-modules issues when compiling
const initSqlJs = require('./database/sql-js/sql-wasm.js') as (config?: any) => Promise<SqlJsStatic>;;

import { state } from '../controlers/stateControler.js';

export class dataBase {
    public async initialize(): Promise<void> {
        this.db = await sqlInit(state.context);
    }

    public save() {
        saveDB(this.db, state.context);
    }

    public getPages(table: string, perPage: number = 20): number {
        return getTotalPages(this.db, table, perPage);
    }

    public getLanguage(instance: any) {
        return this.db.exec(`SELECT displayName FROM languages WHERE id = ?`, [instance.language_id])[0]?.values?.[0]?.[0] || "UNKNOWN LANGUAGE";
    }

    public query(sql: string, params: any[] = []) {
        return this.db.exec(sql, params);
    }

    public alter(sql: string, params: any[] = []) {
        return this.db.run(sql, params);
    }

    private db: any;
}

export interface snippets {
    id: number;
    title: string;
    description: string;
    snippet: string;
    language_id: number;
}

export interface tags {
    id: number;
    label: string;
}

export interface languages {
    id: number;
    displayName: string;
    internalName: string;
}

export interface snippet_tags {
    id: number;
    tag_id: number;
    snippet_id: number;
}

async function sqlInit(context: vscode.ExtensionContext): Promise<Database> {
    // Mount database path
    const dbFolderPath = context.globalStorageUri.fsPath;
    const dbFilePath = path.join(dbFolderPath, 'boilerplater.db');
    
    // Prepare SQL instance
    await fs.promises.mkdir(dbFolderPath, { recursive: true });

    const raw = await fs.promises.readFile(path.join(context.extensionPath, 'out', 'database', 'sql-js', 'sql-wasm.wasm'));

    const SQL = await initSqlJs({ wasmBinary: raw });

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
function saveDB(db: Database, context: vscode.ExtensionContext) {
    // Get database path
    const dbFolderPath = context.globalStorageUri.fsPath;
    const dbFilePath = path.join(dbFolderPath, 'boilerplater.db');
    
    // Save into database
    fs.writeFileSync(dbFilePath, Buffer.from(db.export()));
}

function getTotalPages(db: any, tableName: string, perPage: number = 20): number {
    // 1. Get total row count from the table
    const countResult = db.exec(/*SQL*/`
        SELECT COUNT(*) AS total FROM ${tableName}
    `);
    
    // Safely extract the number from sql.js array structure
    const totalItems = countResult[0]?.values[0][0] || 0;

    // 2. Divide by items per page and round up
    // e.g., 41 items / 20 per page = 2.05 -> Rounds up to 3 pages
    const totalPages = Math.ceil(totalItems / perPage);

    // Always return at least 1 page, even if the database is completely empty
    return totalPages < 1 ? 1 : totalPages;
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