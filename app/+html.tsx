import React from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

const serviceWorkerRegistration = `
  if ('serviceWorker' in navigator && !navigator.webdriver) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js');
    });
  }
`;

// The page background before the app paints, matching src/theme/theme.ts.
const pageStyle =
  'html,body{background:#fafaee}body{margin:0}*{box-sizing:border-box}' +
  '@media (prefers-color-scheme: dark){html,body{background:#1d1d1b}}';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content="#10130d" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1d1d1b" media="(prefers-color-scheme: dark)" />
        <meta name="description" content="Campeonatos, tabelas, partidas e resultados no Go Champs." />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: pageStyle }} />
      </head>
      <body>
        {children}
        <script dangerouslySetInnerHTML={{ __html: serviceWorkerRegistration }} />
      </body>
    </html>
  );
}
