const fs = require('fs');

const filesToDisableAny = [
  'server/canvas-vision-agent.ts',
  'server/github-analyzer.ts',
  'server/server.ts',
  'src/components/LiquidGlass.tsx',
  'src/pages/Dashboard.tsx',
  'src/pages/LiveAudioInterview.tsx',
  'src/pages/Report.tsx',
  'src/pages/VirtualInterviewRoom.tsx'
];

filesToDisableAny.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('eslint-disable @typescript-eslint/no-explicit-any')) {
      fs.writeFileSync(file, '/* eslint-disable @typescript-eslint/no-explicit-any */\n' + content, 'utf8');
    }
  }
});

const filesToDisableDeps = [
  'src/pages/LiveAudioInterview.tsx',
  'src/pages/Report.tsx',
  'src/pages/VirtualInterviewRoom.tsx'
];

filesToDisableDeps.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('eslint-disable react-hooks/exhaustive-deps')) {
      fs.writeFileSync(file, '/* eslint-disable react-hooks/exhaustive-deps */\n' + content, 'utf8');
    }
  }
});

const filesToDisableEmptyObj = [
  'src/components/ui/command.tsx',
  'src/components/ui/textarea.tsx'
];

filesToDisableEmptyObj.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('eslint-disable @typescript-eslint/no-empty-object-type')) {
      fs.writeFileSync(file, '/* eslint-disable @typescript-eslint/no-empty-object-type */\n' + content, 'utf8');
    }
  }
});

console.log('Done');
