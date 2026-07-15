import { execSync } from 'child_process';
try {
  const output = execSync('npx tsc --noEmit', { cwd: 'd:/lms', encoding: 'utf-8' });
  console.log(output);
} catch (error) {
  console.error(error.stdout);
}
