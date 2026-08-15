// Mirrors server/src/lib/templateEngine.ts — kept in sync manually since the client
// only needs it to render preview thumbnails, not to generate real certificates.
export type TemplateScalar = string | number | undefined | null;
export type TemplateContext = Record<string, TemplateScalar | Record<string, TemplateScalar>[]>;

const EACH_BLOCK = /\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
const IF_BLOCK = /\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
const VARIABLE = /\{\{(\w+)\}\}/g;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderScalars(template: string, context: Record<string, TemplateScalar>): string {
  return template.replace(VARIABLE, (_match, key: string) => {
    const value = context[key];
    if (value === undefined || value === null) {
      return '';
    }
    return escapeHtml(String(value));
  });
}

export function renderTemplate(template: string, context: TemplateContext): string {
  let output = template.replace(EACH_BLOCK, (_match, key: string, inner: string) => {
    const items = context[key];
    if (!Array.isArray(items)) {
      return '';
    }
    return items
      .map((item) => {
        const withConditionals = inner.replace(IF_BLOCK, (_m, condKey: string, innerBlock: string) =>
          item[condKey] ? innerBlock : '',
        );
        return renderScalars(withConditionals, item);
      })
      .join('');
  });

  output = output.replace(IF_BLOCK, (_match, key: string, inner: string) => {
    const value = context[key];
    return value ? inner : '';
  });

  return renderScalars(output, context as Record<string, TemplateScalar>);
}
