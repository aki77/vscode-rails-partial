import {
  CodeActionProvider,
  TextDocument,
  Range,
  workspace,
  CodeAction,
  CodeActionKind,
  window,
  Uri,
  WorkspaceEdit,
  Position
} from "vscode";
import * as path from "path";

const PAIRS_BY_LANGUAGE = {
  haml: ["= ", ""],
  slim: ["== ", ""],
  erb: ["<%= ", " %>"]
};

export default class PartialCodeActionProvider implements CodeActionProvider {
  public provideCodeActions(document: TextDocument, range: Range) {
    if (range.isSingleLine) {
      return null;
    }
    const relativePath = workspace.asRelativePath(document.uri);
    if (!relativePath.startsWith(path.join("app", "views"))) {
      return null;
    }
    const action = new CodeAction(
      "Create partial view",
      CodeActionKind.RefactorExtract
    );
    action.command = {
      command: "railsPartial.createFromSelection",
      title: "Create partial view"
    };
    return [action];
  }
}

export async function createPartialFromSelection() {
  const editor = window.activeTextEditor;
  if (!editor || editor.selection.isEmpty) {
    return;
  }

  const name = await window.showInputBox({
    prompt: "Input partial name:"
  });
  if (!name) {
    return;
  }

  const language = editor.document.languageId as "haml" | "slim" | "erb";
  const filePath = path.join(
    path.dirname(editor.document.uri.path),
    `_${name}.html.${language}`
  );
  const relativePath = workspace.asRelativePath(editor.document.uri);
  const [, , ...parts] = path.dirname(relativePath).split(path.sep);
  const partialName = path.join(...parts, name);
  const uri = Uri.file(filePath);
  const text = editor.document.getText(editor.selection);
  const renderText = PAIRS_BY_LANGUAGE[language].join(
    `render '${partialName}'`
  );

  const edit = new WorkspaceEdit();
  edit.createFile(uri);
  edit.insert(uri, new Position(0, 0), text);
  edit.replace(editor.document.uri, editor.selection, renderText);
  workspace.applyEdit(edit);
}
