/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@conectcampo/types', '@conectcampo/utils'],
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return [];
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiUrl}/api/v1/:path*`,
      },
      // Documentação interativa (Swagger UI) e especificação OpenAPI,
      // servidas pela API mas acessíveis no domínio do site.
      { source: '/docs', destination: `${apiUrl}/docs` },
      { source: '/docs/:path*', destination: `${apiUrl}/docs/:path*` },
      { source: '/docs-json', destination: `${apiUrl}/docs-json` },
      { source: '/docs-yaml', destination: `${apiUrl}/docs-yaml` },
    ];
  },
};

module.exports = nextConfig;
