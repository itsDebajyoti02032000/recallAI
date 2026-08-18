const MAX_CONTENT_LENGTH = 8000;

const STRIP_SELECTORS = 'script, style, nav, header, footer, aside, iframe, noscript, svg';
const CONTENT_SELECTORS = 'p, h1, h2, h3, h4, h5, h6, li, td, th, blockquote, figcaption, dt, dd';

export interface ExtractedContent {
  title: string;
  content: string;
  truncated: boolean;
}

export async function extractPageContent(url: string): Promise<ExtractedContent> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; RecallAI/1.0; +https://recallai-5ru.pages.dev)',
      Accept: 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: HTTP ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
    throw new Error(`Unsupported content type: ${contentType}. Only HTML pages are supported.`);
  }

  let title = '';
  const textChunks: string[] = [];

  const rewriter = new HTMLRewriter()
    .on(STRIP_SELECTORS, {
      element(el) {
        el.remove();
      },
    })
    .on('title', {
      text(text) {
        title += text.text;
      },
    })
    .on(CONTENT_SELECTORS, {
      text(text) {
        const t = text.text.trim();
        if (t) {
          textChunks.push(t);
        }
      },
    });

  const transformed = rewriter.transform(response);
  await transformed.text();

  let content = textChunks.join(' ').replace(/\s+/g, ' ').trim();
  const truncated = content.length > MAX_CONTENT_LENGTH;
  if (truncated) {
    content = content.slice(0, MAX_CONTENT_LENGTH) + '...';
  }

  return { title: title.trim(), content, truncated };
}
