const { execSync } = require('child_process');

// Get git hash with fallback
const getGitHash = () => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'no-git-info';
  }
};

let commitJson = {
  hash: JSON.stringify(getGitHash()),
  version: JSON.stringify(process.env.npm_package_version),
};

console.log(`
\x1b[36m╔════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                                        ║
║   ███████╗██╗      ██████╗ ██╗    ██╗███████╗████████╗ █████╗ ██████╗ ████████╗███████╗██████╗          ║
║   ██╔════╝██║     ██╔═══██╗██║    ██║██╔════╝╚══██╔══╝██╔══██╗██╔══██╗╚══██╔══╝██╔════╝██╔══██╗         ║
║   █████╗  ██║     ██║   ██║██║ █╗ ██║███████╗   ██║   ███████║██████╔╝   ██║   █████╗  ██████╔╝         ║
║   ██╔══╝  ██║     ██║   ██║██║███╗██║╚════██║   ██║   ██╔══██║██╔══██╗   ██║   ██╔══╝  ██╔══██╗         ║
║   ██║     ███████╗╚██████╔╝╚███╔███╔╝███████║   ██║   ██║  ██║██║  ██║   ██║   ███████╗██║  ██║         ║
║   ╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝ ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝         ║
║                                                                                                        ║
║                              \x1b[35m⚡ AI-Powered Site Creation Platform ⚡\x1b[36m                                   ║
╚════════════════════════════════════════════════════════════════════════════════════════════════════════╝\x1b[0m
`);
console.log('\x1b[33m📍 Version:\x1b[0m', `v${commitJson.version}`);
console.log('\x1b[33m📍 Commit:\x1b[0m', commitJson.hash);
console.log('\x1b[32m🚀 Starting development server...\x1b[0m');
console.log(
  '\x1b[36m════════════════════════════════════════════════════════════════════════════════════════════════════════\x1b[0m',
);
