import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "Sessões" passaram a se chamar "agendas"; links antigos continuam funcionando.
  async redirects() {
    return [
      { source: "/sessoes/:path*", destination: "/agendas/:path*", permanent: true },
      { source: "/admin/sessoes/:path*", destination: "/admin/agendas/:path*", permanent: true },
      { source: "/admin/sessoes", destination: "/admin/agendas", permanent: true },
    ];
  },
};

export default nextConfig;
