'use client'

import 'react-quill-new/dist/quill.snow.css'

interface BlogArticleProps {
  content: string
}

export default function BlogArticle({ content }: BlogArticleProps) {
  if (!content) return null

  const hasHtml = /<\/?[a-z][\s\S]*>/i.test(content)

  return (
    <article className="max-w-none w-full break-words overflow-visible">
      <div className="blog-content-renderer">
        <div className="ql-editor !p-0 !overflow-visible !h-auto">
          {hasHtml ? (
            <div dangerouslySetInnerHTML={{ __html: content }} />
          ) : (
            <pre className="whitespace-pre-wrap font-sans leading-relaxed text-[17px] break-words">
              {content}
            </pre>
          )}
        </div>
        <style jsx global>{`
          .blog-content-renderer {
            font-family: inherit;
            color: hsl(var(--foreground));
            line-height: 1.8;
          }
          .ql-editor {
            padding: 0 !important;
            height: auto !important;
            font-size: 1.1rem;
            line-height: 1.8;
            color: hsl(var(--foreground));
          }
          .ql-editor p { margin-bottom: 1.5rem; }
          .ql-editor h1,
          .ql-editor h2,
          .ql-editor h3 {
            color: hsl(var(--foreground));
            font-weight: 700;
            line-height: 1.3;
            margin-top: 2.5rem;
            margin-bottom: 1.25rem;
            scroll-margin-top: 100px;
          }
          .ql-editor h1 { font-size: 2.25rem; }
          .ql-editor h2 { font-size: 1.875rem; }
          .ql-editor h3 { font-size: 1.5rem; }
          .ql-editor ul,
          .ql-editor ol {
            padding-left: 1.5rem;
            margin-bottom: 1.5rem;
          }
          .ql-editor ul { list-style-type: disc; }
          .ql-editor ol { list-style-type: decimal; }
          .ql-editor li { margin-bottom: 0.5rem; padding-left: 0.5rem; }
          .ql-align-center { text-align: center; }
          .ql-align-right { text-align: right; }
          .ql-align-justify { text-align: justify; }
          .ql-editor img {
            max-width: 100%;
            height: auto;
            border-radius: 1rem;
            margin: 2.5rem 0;
            display: block;
          }
          .ql-editor blockquote {
            border-left: 4px solid hsl(var(--primary));
            padding-left: 1.5rem;
            margin: 2rem 0;
            font-style: italic;
            color: hsl(var(--muted-foreground));
          }
          .ql-indent-1 { padding-left: 3rem; }
          .ql-indent-2 { padding-left: 6rem; }
          .ql-indent-3 { padding-left: 9rem; }
        `}</style>
      </div>
    </article>
  )
}
