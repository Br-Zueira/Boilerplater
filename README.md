# Br-Zueira's Boilerplater

An extension that allows saving boilerplate code snippets for later use in a simple way. From a dev, to devs.

## Features

* **Saving snippets** by highlighting them and pressing ctrl+u (mac: cmd+u)
* **Snippet organizing** by language, tags, title and description
* **Further editing** if you want to edit or delete a snippet, tag or language after its creation, using a ->
* **Webview** displayed with ctrl+alt+u (mac: cmd+alt+u)
* **Easy use of the snippets:** Going to the webview, searchinhg a snippet and pressing "paste snippet" pastes it directly into your cursor position. No more jumping through old projects or searching into internet to copy boilerplate
* **Template variables** for snippet: [% %] for variables such as filename (compatible with simple JavaScript code inside, meant for string manipulation) and [# #] for tabstops (more info at extensions settings)
* **Custom macros for template variables** (Defined in the configs.json of the extension, uses sandboxed JavaScript)
* **100% local and self contained,** so no external dependencies or connections needed
* **Plug-and-play:** Zero login, zero configuration, zero headaches. Just download and enjoy!

## How it Works (Under the Hood)

Boilerplater uses an isolated virtual database instance that commits directly to a local `.db` file in your extension context, ensuring your editor UI stays completely smooth and throttle-free.

## Requirements

The extension was made to be 100% self contained, so no external requirements.

## Extension Settings

### Shortcuts

* Ctrl + u (Mac: cmd+u) => Save snippet from highlight
* Ctrl + alt + u (Mac: cmd+alt+u) => Access webview

### Variables

* BP_FILENAME: 'script'
* BP_FILENAME_EXT: 'script.lang'
* BP_EXT: '.lang'
* BP_DIRECTORY_NAME: '/home/user/vscode/my-project'
* BP_WORKSPACE_NAME: 'my-project'

* BP_YEAR: '1970'
* BP_MONTH: '01'
* BP_DAY: '01'

* BP_SELECTED_TEXT: 'print("I'm selected inside document!")'
* BP_CLIPBOARD: 'print("I'm at clipboard!")'

### Macros

Defined in the extension configs.json. Can be imported with snippet template syntax [% %] and its value can be accessed by the macros that come after it (the order is the JSON top-to-down order). It can return anything.

## Known Issues

* The search bar in list view may "glitch" a little bit (this would be misplaced cursor or missing chars) every time a search is sent.
* While trying to paste a snippet, sometimes the cursor will unfocus from document before it can be pasted, making it fail. Simply refocus cursor at document, then try again while cursor is still focused at document.