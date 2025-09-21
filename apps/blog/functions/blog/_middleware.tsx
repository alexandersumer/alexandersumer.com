import React from 'react';
import vercelOGPagesPlugin from '@cloudflare/pages-plugin-vercel-og';

export const onRequest = vercelOGPagesPlugin<{ ogTitle: string }>({
  imagePathSuffix: '/social-image.png',
  component: ({ ogTitle }) => (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 64,
        fontWeight: 600,
        background: '#0f172a',
        color: '#f8fafc',
        padding: '4rem',
        textAlign: 'center'
      }}
    >
      {ogTitle}
    </div>
  ),
  extractors: {
    on: {
      'meta[property="og:title"]': (props) => ({
        element(element) {
          props.ogTitle = element.getAttribute('content') || 'alexandersumer.com';
        }
      })
    }
  },
  autoInject: { openGraph: true }
});
