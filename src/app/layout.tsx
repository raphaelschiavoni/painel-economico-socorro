import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Painel de Desenvolvimento Econômico — Socorro/SP',
  description:
    'Indicadores econômicos, empresariais, agropecuários e fiscais de Socorro/SP a partir de dados públicos do IBGE e do Tesouro Nacional.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/*
          Aplica o tema salvo antes da primeira pintura, para não haver
          um piscar de tela clara em quem escolheu o tema escuro.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('painel-tema');if(t&&t!=='sistema')document.documentElement.setAttribute('data-tema',t)}catch(e){}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
