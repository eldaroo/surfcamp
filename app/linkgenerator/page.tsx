import type { Metadata } from 'next';

const linkGeneratorUrl =
  process.env.NEXT_PUBLIC_LINK_GENERATOR_URL || 'http://localhost:3010';

export const metadata: Metadata = {
  title: 'Link Generator',
  description: 'Embedded WeTravel link generator',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LinkGeneratorPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '24px',
        background:
          'linear-gradient(180deg, rgba(248,244,237,1) 0%, rgba(238,228,210,1) 100%)',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'grid',
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(2rem, 4vw, 3.5rem)',
              lineHeight: 1,
            }}
          >
            Link Generator
          </h1>
          <p
            style={{
              marginTop: 10,
              color: '#5f5748',
              fontSize: 16,
            }}
          >
            This page embeds the standalone WeTravel links generator.
          </p>
          <p
            style={{
              marginTop: 8,
              color: '#5f5748',
              fontSize: 14,
            }}
          >
            If the embedded app does not load, make sure the standalone project is running on{' '}
            <a href={linkGeneratorUrl} target="_blank" rel="noreferrer">
              {linkGeneratorUrl}
            </a>
            .
          </p>
        </div>

        <div
          style={{
            borderRadius: 24,
            overflow: 'hidden',
            border: '1px solid rgba(75, 54, 24, 0.12)',
            boxShadow: '0 24px 60px rgba(75, 54, 24, 0.12)',
            background: '#fffaf2',
          }}
        >
          <iframe
            src={linkGeneratorUrl}
            title="WeTravel Link Generator"
            style={{
              width: '100%',
              minHeight: 'calc(100vh - 160px)',
              border: 0,
              display: 'block',
            }}
          />
        </div>
      </div>
    </main>
  );
}
