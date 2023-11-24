const vscode = require('vscode');
const fs = require('fs');

function activate(context) {
  let disposable = vscode.commands.registerCommand('testingPlugin.helloWorld', () => {
    testAccessibility(context);
  });

  context.subscriptions.push(disposable);
}

function addTableRow(testResult, ...cells) {
  testResult += '<tr>';
  cells.forEach(cell => {
    testResult += `<td>${cell}</td>`;
  });
  testResult += '</tr>\n';
  return testResult;
}

function testAccessibility(context) {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    const document = editor.document;

    // Retrieve the HTML content from the active document
    const htmlContent = document.getText();

    // Variables to store the test results
    let testResult = '<h1>Accessibility Test Results</h1>\n';
    testResult += '<table border="1"><tr><th>Test Case</th><th>Result</th></tr>\n';

    // Validating Skip to content link at top
    const skipLink = htmlContent.match(/<a[^>]+href=['"]#content['"][^>]*>(.*?)<\/a>/i);
    if (!skipLink) {
      testResult = addTableRow(testResult, 'Skip to content link', 'Missing or has an incorrect href value');
    }

    // Each anchor tag will be validated with href as not null
    const anchorTags = htmlContent.match(/<a[^>]+>/gi);
    if (anchorTags) {
      anchorTags.forEach((anchorTag, index) => {
        const hrefMatch = anchorTag.match(/href=['"]([^'"]+)['"]/i);
        if (!hrefMatch || !hrefMatch[1]) {
          testResult = addTableRow(testResult, `Anchor tag at index ${index + 1}`, 'Does not have href property or it is empty');
        }
      });
    }

    // Link text should be present
    const linkTexts = htmlContent.match(/<a[^>]*>(.*?)<\/a>/gi);
    if (linkTexts) {
      linkTexts.forEach((linkText, index) => {
        if (!linkText.match(/<a[^>]*>[^<]+<\/a>/i)) {
          testResult = addTableRow(testResult, `Link text at index ${index + 1}`, 'Is empty or has incorrect format');
        }
      });
    }

    // Unique id validation for all elements like input, link, image
    const elementsWithId = htmlContent.match(/<[^>]+id=['"]([^'"]+)['"]/gi);
    if (elementsWithId) {
      const ids = new Set();
      elementsWithId.forEach((element) => {
        const idMatch = element.match(/id=['"]([^'"]+)['"]/i);
        if (idMatch && idMatch[1]) {
          if (ids.has(idMatch[1])) {
            testResult = addTableRow(testResult, `Duplicate id found: ${idMatch[1]}`);
          } else {
            ids.add(idMatch[1]);
          }
        }
      });
    }

    // Validate Name, Role, and value for all input elements
    const inputElements = htmlContent.match(/<input[^>]+>/gi);
    if (inputElements) {
      inputElements.forEach((inputElement, index) => {
        const nameMatch = inputElement.match(/name=['"]([^'"]+)['"]/i);
        if (!nameMatch || !nameMatch[1]) {
          testResult = addTableRow(testResult, `Input element at index ${index + 1}`, 'Does not have name property or it is empty');
        }

        const roleMatch = inputElement.match(/role=['"]([^'"]+)['"]/i);
        if (!roleMatch || !roleMatch[1]) {
          testResult = addTableRow(testResult, `Input element at index ${index + 1}`, 'Does not have role property or it is empty');
        }

        const valueMatch = inputElement.match(/value=['"]([^'"]+)['"]/i);
        if (!valueMatch || !valueMatch[1]) {
          testResult = addTableRow(testResult, `Input element at index ${index + 1}`, 'Does not have value property or it is empty');
        }
      });
    }

    testResult += '</table>\n';

    // Save the test results to an HTML file
    const filePath = vscode.Uri.file(context.extensionPath + '/test_results.html');
    fs.writeFileSync(filePath.fsPath, testResult);

    // Open the HTML file in the default web browser
    vscode.env.openExternal(filePath);

    // Display a success message to the user
    vscode.window.showInformationMessage(`Accessibility test results saved to ${filePath.fsPath}`);
  }
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
