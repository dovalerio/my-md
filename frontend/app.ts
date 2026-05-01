// UMD globals injected via <script> tags before this file loads
declare const DOMPurify: { sanitize(dirty: string): string };
declare const marked: { parse(src: string): string };

const DEBOUNCE_MS = 100;

const INITIAL_CONTENT = `# Welcome to Markdown Editor

Start typing on the left to see the preview update in real time.

## Features

- **Bold text** with \`**asterisks**\`
- *Italic text* with \`*asterisks*\`
- \`Inline code\` with backticks
- Unordered lists with \`-\`

### Code blocks

\`\`\`
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
\`\`\`

> No data is saved. Everything lives in memory only.
`;

function renderMarkdown(source: string, target: HTMLElement): void {
  const rawHtml = marked.parse(source);
  target.innerHTML = DOMPurify.sanitize(rawHtml);
}

function createDebounce(fn: () => void, delay: number): () => void {
  let timer: number;
  return () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(fn, delay);
  };
}

function togglePreviewMode(
  editorPane: HTMLElement,
  divider: HTMLElement,
  editor: HTMLTextAreaElement,
  subtitle: HTMLElement,
  previewTitle: HTMLElement
): void {
  const isPreviewOnly = document.body.classList.toggle('preview-only');

  editorPane.hidden = isPreviewOnly;
  divider.hidden = isPreviewOnly;
  previewTitle.textContent = isPreviewOnly ? 'Reading' : 'Preview';
  subtitle.innerHTML = isPreviewOnly
    ? '<kbd>Ctrl</kbd>+<kbd>Enter</kbd> — back to editor'
    : 'No data is stored — <kbd>Ctrl</kbd>+<kbd>Enter</kbd> toggles preview mode';

  if (!isPreviewOnly) {
    editor.focus();
  }
}

function init(): void {
  const editor = document.getElementById('editor') as HTMLTextAreaElement | null;
  const preview = document.getElementById('preview') as HTMLElement | null;
  const editorPane = document.querySelector<HTMLElement>('.editor-pane');
  const divider = document.querySelector<HTMLElement>('.pane-divider');
  const subtitle = document.getElementById('app-subtitle');
  const previewTitle = document.getElementById('preview-heading');

  if (!editor || !preview || !editorPane || !divider || !subtitle || !previewTitle) {
    return;
  }

  const debouncedRender = createDebounce(
    () => renderMarkdown(editor.value, preview),
    DEBOUNCE_MS
  );

  editor.addEventListener('input', debouncedRender);

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      togglePreviewMode(editorPane, divider, editor, subtitle, previewTitle);
    }
  });

  editor.value = INITIAL_CONTENT;
  renderMarkdown(INITIAL_CONTENT, preview);
  editor.focus();
}

document.addEventListener('DOMContentLoaded', init);
