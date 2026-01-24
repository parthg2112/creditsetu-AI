/** @type {import('next').NextConfig} */
const nextConfig = {
    rewrites: async () => [
        {
            source: '/api/python/:path*',
            destination: 'http://127.0.0.1:8000/:path*',
        },
    ],
};

export default nextConfig;
