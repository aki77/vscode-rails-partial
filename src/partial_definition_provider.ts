"use strict";

import * as path from "path";
import * as fs from "fs";
import {
  DefinitionProvider,
  TextDocument,
  Location,
  Position,
  Uri,
  workspace
} from "vscode";

export default class PartialDefinitionProvider implements DefinitionProvider {
  public async provideDefinition(document: TextDocument, position: Position) {
    const rootPath = workspace.workspaceFolders
      ? workspace.workspaceFolders[0].uri.fsPath
      : null;
    if (!rootPath) {
      return null;
    }

    const line = document.lineAt(position.line).text;
    if (!line.includes("render")) {
      return null;
    }

    const partialName = this.partialName(line);
    if (!partialName) {
      return null;
    }

    return this.partialLocation(rootPath, document.fileName, partialName);
  }

  private partialName(line: string) {
    const regex = line.includes("partial")
      ? /render\s*\(?\s*\:?partial(?:\s*=>|:*)\s*["'](.+?)["']/
      : /render\s*\(?\s*["'](.+?)["']/;
    const result = line.match(regex);
    return result ? result[1] : null;
  }

  private partialLocation(
    rootPath: string,
    currentFileName: string,
    partialName: string
  ) {
    const configExtensions = ["html.erb", "html.slim", "html.haml"];

    const fileBase = currentFileName.includes("/")
      ? path.join(path.dirname(currentFileName), `_${partialName}`)
      : path.join(
          rootPath,
          "app",
          "views",
          path.dirname(partialName),
          `_${path.basename(partialName)}`
        );

    const targetExt = configExtensions.find(ext => {
      return fs.existsSync(`${fileBase}.${ext}`);
    });

    return targetExt
      ? new Location(Uri.file(`${fileBase}.${targetExt}`), new Position(0, 0))
      : null;
  }
}
