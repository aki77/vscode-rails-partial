"use strict";

import * as path from "path";
import { pathExistsSync } from "fs-extra";
import {
  DefinitionProvider,
  TextDocument,
  Location,
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

    return this.partialLocation(document.fileName, partialName);
  }

  private partialName(line: string) {
    const regex = line.includes("partial")
      ? /render\s*\(?\s*\:?partial(?:\s*=>|:*)\s*["'](.+?)["']/
      : /render\s*\(?\s*["'](.+?)["']/;
    const result = line.match(regex);
    return result ? result[1] : null;
  }

  private partialLocation(currentFileName: string, partialName: string) {
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
      return pathExistsSync(`${fileBase}.${ext}`);
    });

    // TODO: Definition link API
    // https://github.com/Microsoft/vscode/pull/52230
    return targetExt
      ? new Location(Uri.file(`${fileBase}.${targetExt}`), new Position(0, 0))
      : null;
  }
}
