import * as fs from 'fs';
import * as path from 'path';

export interface TemplateVariables {
  [key: string]: string | number;
}

export function renderTemplate(templateName: string, variables: TemplateVariables): string {
  // Path to the templates directory
  const templatesDir = path.join(__dirname, '../templates');

  // Reading the template file
  const templatePath = path.join(templatesDir, `${templateName}.template.html`);
  let template = fs.readFileSync(templatePath, 'utf8');

  // Replacing placeholders with actual values
  for (const [key, value] of Object.entries(variables)) {
    template = template.replace(new RegExp(`{{${key}}}`, 'g'), value.toString());
  }

  return template;
}