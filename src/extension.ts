import * as fs from "fs";
import * as util from "util";
import * as path from "path";
import * as vscode from "vscode";
import PartialDefinitionProvider from "./PartialDefinitionProvider";
import PartialCompletionProvider from "./PartialCompletionProvider";
import PartialCodeActionProvider, {
  createPartialFromSelection
} from "./PartialCodeActionProvider";

const accessAsync = util.promisify(fs.access);

const isRailsWorkSpace = async (rootPath: string) => {
  try {
    await accessAsync(path.join(rootPath, "config", "environment.rb"), fs.constants.R_OK);
    return true;
  } catch (error) {
    return false;
  }
};

const SELECTOR = ["erb", "haml", "slim"];

export async function activate(context: vscode.ExtensionContext) {
  const rootPath = vscode.workspace.workspaceFolders
    ? vscode.workspace.workspaceFolders[0].uri.fsPath
    : null;

  if (!rootPath || !(await isRailsWorkSpace(rootPath))) {
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
