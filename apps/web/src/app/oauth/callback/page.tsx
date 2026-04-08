/**
 * /oauth/callback — alias de /callback para o OAuth2 do QuantoVale.
 * Ambas as URLs estão registradas no painel do QuantoVale:
 *   https://conectcampo.digital/callback
 *   https://conectcampo.digital/oauth/callback
 */
import { QuantovaleCallbackView } from '@/components/quantovale/QuantovaleCallbackView';

export default function OAuthCallbackPage() {
  return <QuantovaleCallbackView />;
}

