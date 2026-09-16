import { NextResponse } from 'next/server';

const TEAM_ID = '594N6JQ75F';
const BUNDLE_ID = 'digital.conectcampo.app';

export const dynamic = 'force-static';

export function GET() {
  return NextResponse.json(
    {
      applinks: {
        apps: [],
        details: [
          {
            appIDs: [`${TEAM_ID}.${BUNDLE_ID}`],
            components: [
              { '/': '/dashboard*', comment: 'Jornadas autenticadas do ConectCampo' },
              { '/': '/cpr/*', comment: 'CPR e assinatura eletrônica' },
              { '/': '/verify-email*', comment: 'Confirmação de e-mail' },
              { '/': '/reset-password*', comment: 'Recuperação de conta' },
            ],
          },
        ],
      },
      webcredentials: {
        apps: [`${TEAM_ID}.${BUNDLE_ID}`],
      },
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'Content-Type': 'application/json',
      },
    },
  );
}
