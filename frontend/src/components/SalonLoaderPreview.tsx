import { useEffect, useState } from 'react';
import '../loader-preview.css';

const loaders = [['signature', 'Halo Signature', 'The Halo mark rotating like a salon stamp.']] as const;

export function SalonLoaderPreview() {
  const [selected, setSelected] = useState(0);
  useEffect(() => { const timer = window.setInterval(() => setSelected(value => (value + 1) % loaders.length), 2600); return () => window.clearInterval(timer); }, []);
  return <main className="loader-preview-page"><div className="loader-preview-head"><div><label>SALON MOTION STUDY</label><h1>Choose your signature loader.</h1><p>Preview the five Halo-inspired loading directions before assigning one to the app.</p></div><span className="loader-preview-pill">Auto preview</span></div><div className="loader-preview-grid">{loaders.map(([key, title, copy], index) => <button type="button" className={selected === index ? 'loader-preview-card selected' : 'loader-preview-card'} key={key} onClick={() => setSelected(index)}><span className={`salon-loader-art loader-${key}`} aria-hidden="true"><i/><b/></span><strong>{title}</strong><small>{copy}</small></button>)}</div><p className="loader-preview-note">Selected: <b>{loaders[selected][1]}</b></p></main>;
}
