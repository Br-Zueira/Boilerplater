# Br-Zueira's Boilerplater

An extension that allows saving boilerplate code snippets for later use in a simple way. From a dev, to devs.

## Features

* **Saving snippets** by highlighting them and pressing ctrl+u (mac: cmd+u)
* **Snippet organizing** by language, tags, title and description
* **Further editing** if you want to edit or delete a snippet, tag or language after its creation, using a ->
* **Webview** displaued with ctrl+alt+u (mac: cmd+alt+u)
* **Easy use of the snippets** by pressing ctrl+shift+u (mac: cmd+shift+u), selecting a snippet and pasting it directly into your cursor position. No more jumping through old projects or searching into internet to copy boilerplate
* **100% local and self contained,** so no external dependencies or connections needed
* **Plug-and-play:** Zero login, zero configuration, zero headaches. Just download and enjoy!

## How it Works (Under the Hood)

Boilerplater uses an isolated virtual database instance that commits directly to a local `.db` file in your extension context via asynchronous tasks, ensuring your editor UI stays completely smooth and throttle-free.

## Requirements

The extension was made to be 100% self contained, so no external requirements.

## Extension Settings

None for now

## Known Issues

None for now