import { ClientComponent } from './components/client-component';
import { ServerComponent } from './components/server-component';

export default function Page() {
  return (
    <div>
      <h1>Hello, Next.js!</h1>
      <ClientComponent />
      <ServerComponent />
    </div>
  );
}