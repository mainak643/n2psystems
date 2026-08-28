/** @type {import('next').NextConfig} */
const nextConfig = {
  // `typescript.ignoreBuildErrors` was on, so `next build` printed "Skipping
  // validation of types" and shipped whatever compiled. The tree currently
  // passes `tsc --noEmit` clean, so type checking is back on as a build gate —
  // a broken data mapping between the portal and this site should fail the
  // build rather than reach the careers page. Re-add the flag if a dependency
  // upgrade makes it temporarily unavoidable.
};

export default nextConfig;
