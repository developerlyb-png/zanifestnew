/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  
  // other settings
};
const path = require('path');
// next.config.js

// next.config.js
module.exports = {
  webpackDevMiddleware: (config) => {
   
    return config;
  },
};


module.exports = nextConfig;

module.exports = {
  webpackDevMiddleware: config => {
    config.watchOptions = {
      ignored: [
        '**/node_modules/**',
        '**/.next/**',
        
      ],
    };
    return config;
  },
};
module.exports = {
  outputFileTracingRoot: __dirname, // set root explicitly
}
