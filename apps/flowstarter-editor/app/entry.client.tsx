import { RemixBrowser } from '@remix-run/react';
import { startTransition } from 'react';
import { hydrateRoot } from 'react-dom/client';

// Flowstarter Console Banner
const showBanner = () => {
  const banner = `
%c╔════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                                        ║
║   ███████╗██╗      ██████╗ ██╗    ██╗███████╗████████╗ █████╗ ██████╗ ████████╗███████╗██████╗          ║
║   ██╔════╝██║     ██╔═══██╗██║    ██║██╔════╝╚══██╔══╝██╔══██╗██╔══██╗╚══██╔══╝██╔════╝██╔══██╗         ║
║   █████╗  ██║     ██║   ██║██║ █╗ ██║███████╗   ██║   ███████║██████╔╝   ██║   █████╗  ██████╔╝         ║
║   ██╔══╝  ██║     ██║   ██║██║███╗██║╚════██║   ██║   ██╔══██║██╔══██╗   ██║   ██╔══╝  ██╔══██╗         ║
║   ██║     ███████╗╚██████╔╝╚███╔███╔╝███████║   ██║   ██║  ██║██║  ██║   ██║   ███████╗██║  ██║         ║
║   ╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝ ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝         ║
║                                                                                                        ║
╠════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║  %c⚡ AI-Powered Site Creation Platform%c                                                                  ║
║  %c🚀 Build amazing apps with the power of AI%c                                                            ║
║  %c🔧 Version 1.0.0%c                                                                                       ║
╚════════════════════════════════════════════════════════════════════════════════════════════════════════╝
`;

  const mainStyle = 'color: #4D5DD9; font-family: monospace; font-weight: bold;';
  const accentStyle = 'color: #22d3ee; font-family: monospace; font-weight: bold;';
  const resetStyle = 'color: #4D5DD9; font-family: monospace; font-weight: bold;';

  console.log(banner, mainStyle, accentStyle, resetStyle, accentStyle, resetStyle, accentStyle, resetStyle);

  console.log(
    '%c💡 Welcome to Flowstarter Editor! Ready to build something amazing.',
    'color: #4D5DD9; font-size: 14px; font-weight: bold; padding: 8px 0;',
  );
};

// Show banner on startup
showBanner();

startTransition(() => {
  hydrateRoot(document.getElementById('root')!, <RemixBrowser />);
});
