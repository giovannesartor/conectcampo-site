import { Suspense } from 'react';
import { QuantovaleCallbackView } from '@/components/quantovale/QuantovaleCallbackView';

export default function QuantovaleCallbackPage() {
  return (
    <Suspense>
      <QuantovaleCallbackView />
    </Suspense>
  );
}
