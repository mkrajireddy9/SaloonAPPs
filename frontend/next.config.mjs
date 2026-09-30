/**
 * Keep development and production artifacts separate. Running `next build`
 * while `next dev` is active must not replace the dev server's chunks.
 */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
};

export default nextConfig;
