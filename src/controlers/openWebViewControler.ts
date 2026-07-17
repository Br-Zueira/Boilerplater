import * as vscode from 'vscode';
import * as layouts from '../views/templates/layouts.js';
import * as routes from '../routes/routes.js';
import { state } from './stateControler.js'; 

export async function openWebViewControler() {
    // Create web panel
    const panel = vscode.window.createWebviewPanel(
        'boilerplater.managerView', // Internal name
        "Br-Zueira's Boilerplater", // Display name
        vscode.ViewColumn.Beside, // How to display the panel
        {
            enableScripts: true, // Important: lets JavaScript to be executed inside the panel
            retainContextWhenHidden: true // Panel is not killed when closed
        }
    );

    // Puts icon into webview
    const iconPath = vscode.Uri.joinPath(state.context.extensionUri, 'assets', 'logo_32x32.png');
    panel.iconPath = iconPath;

    // Defines panel html content
    panel.webview.html = layouts.index(panel);

    // Sets up panel-backend connection
    panel.webview.onDidReceiveMessage(
        (message) => {
            routes.routes(message.payload, panel, message.command);
        },
        undefined,
        state.context.subscriptions
    );
}