import * as path from "path";
import * as fs from "fs";
import {
  DefinitionProvider,
  Range,
  TextDocument,
  LocationLink,
  Position,
  Uri,
  workspace
} from "vscode";

export default class PartialDefinitionProvider implements DefinitionProvider {
  constructor(private rootPath: string) {}

  public async provideDefinition(document: TextDocument, position: Position) {
    const line = document.lineAt(position.line).text;
    if (!line.includes("render")) {
      return null;
    }

    const partialName = this.partialName(line);
    if (!partialName) {
      return null;
    }

    const range = document.getWordRangeAtPosition(position, /[\w/]+/);
    if (!range) {
      return null;
    }

    return this.partialLocation(document.fileName, partialName, range);
  }

  private partialName(line: string) {
    const regex = line.includes("partial")
      ? /render\s*\(?\s*\:?partial(?:\s*=>|:*)\s*["'](.+?)["']/
      : /render\s*\(?\s*["'](.+?)["']/;
    const result = line.match(regex);
    return result ? result[1] : null;
  }

  private partialLocation(
    currentFileName: string,
    partialName: string,
    originSelectionRange: Range
  ): LocationLink[] | null {
    const viewFileExtensions: string[] = workspace.getConfiguration(
      "railsPartial"
    ).viewFileExtensions;

    const fileBase = partialName.includes("/")
      ? path.join(
          this.rootPath,
          "app",
          "views",
          path.dirname(partialName),
          `_${path.basename(partialName)}`
        )
      : path.join(path.dirname(currentFileName), `_${partialName}`);

    const targetExt = viewFileExtensions.find(ext => {
      try {
        fs.accessSync(`${fileBase}.${ext}`, fs.constants.R_OK);
        return true;
      } catch (error) {
        return false;
      }
    });

    if (!targetExt) {
      return null;
    }

    return [
      {
        originSelectionRange,
        targetUri: Uri.file(`${fileBase}.${targetExt}`),
        targetRange: new Range(new Position(0, 0), new Position(0, 0))
      }
    ];
  }
}
