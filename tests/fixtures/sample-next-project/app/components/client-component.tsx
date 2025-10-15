'use client';

import React from 'react';
import { AnotherClientComponent } from './another-client-component';
import { Timestamp } from './common/Timestamp';

export const ClientComponent = () => {
  const [count, setCount] = React.useState(0);

  return (
    <div>
      <p>I am a client component.</p>
      <button onClick={() => setCount(count + 1)}>Click me: {count}</button>
      <AnotherClientComponent />
      <Timestamp />
    </div>
  );
};