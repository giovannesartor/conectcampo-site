/**
 * /oauth/callback — alias de /callback para o OAuth2 do QuantoVale.
 */
import { Suspense } from 'react';
import { QuantovaleCallbackView } from '@/components/quantovale/QuantovaleCallbackView';

export default function OAuthCallbackPage() {
  return (
    <Suspense>
      <QuantovaleCallbackView />
    </Suspense>
  );
}

