import { memo } from 'react';
import { ResponderCard } from '@/components/sos/ResponderCard';
import type { Responder } from '@/types';

export const ResponderList = memo(function ResponderList({
  responders,
}: {
  responders: Responder[];
}) {
  if (responders.length === 0) return null;

  return (
    <>
      {responders.map((responder) => (
        <ResponderCard key={responder.id} responder={responder} />
      ))}
    </>
  );
});
