const path = require('path');
const { build } = require('@vercel/python');
const { FileFsRef } = require('@vercel/build-utils');

async function testBuild() {
  const root = path.join(__dirname, '..');
  const entrypoint = 'scratch/dummy_index.py';
  
  console.log('Running @vercel/python builder on', entrypoint);
  
  try {
    const result = await build({
      files: {
        [entrypoint]: new FileFsRef({ fsPath: path.join(root, entrypoint) })
      },
      entrypoint,
      workPath: root,
      config: {},
      meta: {}
    });
    
    console.log('Build successful!');
    
    if (result.result) {
      console.log('Output properties:', Object.keys(result.result.output));
      console.log('Dependencies:', result.result.dependencies || result.dependencies);
      
      // If it's a ServerlessFunction or Lambda, it might have dependencies/files
      if (result.result.output.files) {
        const packagedFiles = Object.keys(result.result.output.files);
        console.log(`\nTotal Packaged Files: ${packagedFiles.length}`);
      }
    }
  } catch (err) {
    console.error('Build failed:', err);
  }
}

testBuild();
