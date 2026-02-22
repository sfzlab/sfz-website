/** @type {import('next').NextConfig} */
const withYaml = require('next-plugin-yaml');

const nextConfig = {
  output: 'export',
  basePath: (process.env.CI) ? '/sfz-website' : '',
  trailingSlash: true,
  generateBuildId: async () => {
    return 'latest'
  },
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
};

console.log('NODE_ENV', process.env.NODE_ENV);
console.log('CI', process.env.CI);

module.exports = withYaml(nextConfig);
