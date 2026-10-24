import { useEffect, useState } from 'react';
export default function App() {
  const [status, setStatus] = useState('Checking backend...');
  useEffect(() => {
    fetch('/api/system/status').then(r => { if(!r.ok) throw new Error('API unavailable'); return r.json(); })
      .then(data => setStatus(`${data.service}: ${data.status}`))
      .catch(() => setStatus('Backend unavailable'));
  }, []);
  return <main className="container"><span className="eyebrow">PHASE 0 · FOUNDATION</span><h1>Student AI Project</h1><p>Learn by teaching an AI student.</p><div className="panel"><h2>Local infrastructure</h2><p><strong>API:</strong> {status}</p><p><strong>Database:</strong> PostgreSQL (managed by Spring Boot + Flyway)</p><p><strong>Model:</strong> Llama 3.1 8B via native Ollama (configured; no chat feature yet)</p></div><small>Chat, lessons and personas will be implemented in later phases.</small></main>;
}
