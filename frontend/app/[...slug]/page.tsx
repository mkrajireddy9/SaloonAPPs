'use client';

import dynamic from 'next/dynamic';

const ClientApp = dynamic(() => import('../../src/App').then((module) => module.App), { ssr: false });

export default function CatchAllPage() {
  return <ClientApp />;
}
