"use strict";

import * as fs from "fs-extra";
import * as path from "path";
import * as vscode from "vscode";
import PartialDefinitionProvider from "./partial_definition_provider";
import PartialCompletionProvider from "./PartialCompletionProvider";

const isRailsWorkSpace = async (rootPath: string) => {
  return await fs.pathExists(path.join(rootPath, "config", "environment.rb"));
};

export async function activate(context: vscode.ExtensionContext) {
  const rootPath = vscode.workspace.workspaceFolders
    ? vscode.workspace.workspaceFolders[0].uri.fsPath
    : null;

  if (!rootPath || (await !isRailsWorkSpace(rootPath))) {
    return;
  }

  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      ["erb", "haml", "slim"],
      new PartialDefinitionProvider(rootPath)
    )
  );

  const triggerCharacters = ".abcdefghijklmnopqrstuvwxyz'\"".split("");
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      ["erb", "haml", "slim"],
      new PartialCompletionProvider(),
      ...triggerCharacters
    )
  );
}

export function deactivate() {}
