import * as fs from "fs-extra";
import * as path from "path";
import * as vscode from "vscode";
import PartialDefinitionProvider from "./PartialDefinitionProvider";
import PartialCompletionProvider from "./PartialCompletionProvider";
import PartialCodeActionProvider, {
  createPartialFromSelection
} from "./PartialCodeActionProvider";

const isRailsWorkSpace = async (rootPath: string) => {
  return await fs.pathExists(path.join(rootPath, "config", "environment.rb"));
};

const SELECTOR = ["erb", "haml", "slim"];

export async function activate(context: vscode.ExtensionContext) {
  const rootPath = vscode.workspace.workspaceFolders
    ? vscode.workspace.workspaceFolders[0].uri.fsPath
    : null;

  if (!rootPath || (await !isRailsWorkSpace(rootPath))) {
    return;
  }

  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      SELECTOR,
      new PartialDefinitionProvider(rootPath)
    )
  );

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      SELECTOR,
      new PartialCompletionProvider(),
      '"',
      "'"
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "railsPartial.createFromSelection",
      createPartialFromSelection
    )
  );

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      SELECTOR,
      new PartialCodeActionProvider(),
      {
        providedCodeActionKinds: [vscode.CodeActionKind.RefactorExtract]
      }
    )
  );
}

export function deactivate() {}
