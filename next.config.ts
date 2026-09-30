import type { NextConfig } from "next";

// "Sessões" viraram "agendas" e depois "eventos"; links antigos continuam funcionando.
const OLD_EVENT_ROOTS = ["sessoes", "agendas"];

const nextConfig: NextConfig = {
  async redirects() {
    return [
      ...OLD_EVENT_ROOTS.flatMap((old) => [
        { source: `/admin/${old}/nova`, destination: "/eventos/novo", permanent: true },
        { source: `/admin/${old}/:id/editar`, destination: "/eventos/:id/editar", permanent: true },
        { source: `/admin/${old}`, destination: "/admin/eventos", permanent: true },
        { source: `/${old}/:path*`, destination: "/eventos/:path*", permanent: true },
      ]),
      { source: "/admin/templates/:path*", destination: "/modelos/:path*", permanent: true },
      { source: "/admin/templates", destination: "/modelos", permanent: true },
    ];
  },
};

export default nextConfig;
