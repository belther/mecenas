import { ConvexAuthNextjsServerProvider } from '../../lib/server-auth';
import './workspace.css';
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) return <main className="workspace"><h1>Primeiro, conecte o ateliê.</h1><p>Configure NEXT_PUBLIC_CONVEX_URL no arquivo local e execute a configuração Convex descrita no README.</p><a href="/">Voltar ao início</a></main>;
  return <ConvexAuthNextjsServerProvider>{children}</ConvexAuthNextjsServerProvider>;
}
