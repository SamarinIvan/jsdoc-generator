import * as vscode from 'vscode';

import {
  CompletionItem,
  TextDocument,
  Position,
  CancellationToken,
  ExtensionContext,
  Range,
  CompletionItemKind
} from 'vscode';

import {JsdocGenerator} from './JsdocGenerator';

/**
 * JsdocGenerator object.
 *
 * @type {JsdocGenerator}
 */
let jsdocGenerator: JsdocGenerator;

/**
 * JSDoc Autocompletion item.
 *
 * @class
 * @typedef {GenerateJsdocCompletionItem}
 * @extends {CompletionItem}
 */
class GenerateJsdocCompletionItem extends CompletionItem {
  /**
   * @constructor
   * @param {string} line
   * @param {Position} position
   */
  constructor(line: string, position: Position) {
    super('/** Autogenerated JSDoc */', CompletionItemKind.Snippet);

    this.insertText = '';
    this.sortText = '\0';
    this.range = this.retrieveRange(line, position);
    this.command = {
      title: 'Generate JSDoc',
      command: 'jsdoc-generator.generateJsdoc'
    };
  }

  /**
   * Retrieves the range of the JSDoc comment from the current line and the {@link Position} parameter.
   *
   * @private
   * @param {string} line
   * @param {Position} position
   * @returns {Range}
   */
  private retrieveRange(line: string, position: Position): Range {
    const prefix = line.slice(0, position.character).match(/\/\**\s*$/);
    const suffix = line.slice(position.character).match(/^\s*\**\//);
    const start = position.translate(0, prefix ? -prefix[0].length : 0);
    return new Range(start, position.translate(0, suffix ? suffix[0].length : 0));
  }
}

/**
 * Lazy instantiates the JsdocGenerator object.
 */
function lazyInstantiateJsdocGenerator() {
  if(!jsdocGenerator) {
    jsdocGenerator = new JsdocGenerator();
  }
}

/**
 * Called when the extension is activated.
 * Subscribes the autocompletion item and the commands in the context.
 * Lazy initializes the JsdocGenerator object.
 *
 * @export
 * @param {ExtensionContext} context
 */
export function activate(context: ExtensionContext) {
  // Generates JSDoc with auto completion.
  const generateJsdocAutocompletion = vscode.languages.registerCompletionItemProvider(
    [
      {
        scheme: 'file',
        language: 'javascript'
      }, {
        scheme: 'file',
        language: 'typescript'
      }
    ],
    {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken) {
        const line = document.lineAt(position.line).text;
        const prefix = line.slice(0, position.character);
        if(prefix.match(/^\s*\/\*\*\s*$/)) {
          return [new GenerateJsdocCompletionItem(line, position)];
        }
        return null;
      }
    },
    '/',
    '*'
  );
  // Generates JSDoc for the current selection.
  const generateJsdoc = vscode.commands.registerCommand('jsdoc-generator.generateJsdoc', () => {
    lazyInstantiateJsdocGenerator();
    if(vscode.window.activeTextEditor) {
      jsdocGenerator.generateJsdoc(vscode.window.activeTextEditor);
    } else {
      vscode.window.showErrorMessage('Unable to generate JSDoc: no editor has been selected.');
    }
  });
  // Generates JSDoc for every suitable element in the current file.
  const generateJsdocFile = vscode.commands.registerCommand('jsdoc-generator.generateJsdocFile', () => {
    lazyInstantiateJsdocGenerator();
    if(vscode.window.activeTextEditor) {
      jsdocGenerator.generateJsdocFile(vscode.window.activeTextEditor);
    } else {
      vscode.window.showErrorMessage('Unable to generate JSDoc: no editor has been selected.');
    }
  });
  // Generates JSDoc for every suitable element in every ts or js file.
  const generateJsdocFiles = vscode.commands.registerCommand('jsdoc-generator.generateJsdocFiles', () => {
    lazyInstantiateJsdocGenerator();
    // TODO: implement
    vscode.window.showWarningMessage('This function is not available yet.');
  });
  context.subscriptions.push(generateJsdoc, generateJsdocFile, generateJsdocFiles, generateJsdocAutocompletion);
}

/**
 * This method is called when the extension is deactivated
 *
 * @export
 */
export function deactivate() {
  // Empty on purpose
}

/**
 * Returns the value of the specified configuration.
 *
 * @export
 * @template T
 * @param {string} configurationName - Configuration name, supports dotted names.
 * @param {T} defaultValue - A value should be returned when no value could be found.
 * @returns {T} The value from the configuration or the default.
 */
export function getConfig<T>(configurationName: string, defaultValue: T): T {
  return vscode.workspace.getConfiguration().get(configurationName, defaultValue);
}
