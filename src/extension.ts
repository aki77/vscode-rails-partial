"use strict";

import * as vscode from "vscode";
import PartialDefinitionProvider from "./partial_definition_provider";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      ["erb", "haml"],
      new PartialDefinitionProvider()
    )
  );
}

export function deactivate() {}
