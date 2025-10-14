import { ServerSideUtility } from '../lib/server-utils';

export const ServerComponent = () => {
  const message = ServerSideUtility();
  return (
    <div>
      <p>I am a server component.</p>
      <p>Message from server: {message}</p>
    </div>
  );
};