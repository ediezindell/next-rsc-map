'use client';

import { myAction } from '../actions/server-action';
import ServerComponent from './server-component';

export default function ClientButton() {
  return (
    <div>
      <button onClick={() => myAction()}>Click Me</button>
      <ServerComponent />
    </div>
  );
}