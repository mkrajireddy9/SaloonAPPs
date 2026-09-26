import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

export function ShellTitle({ eyebrow, title, copy, back, onBack, action }: { eyebrow: string; title: string; copy: ReactNode; back?: string; onBack?: () => void; action?: ReactNode }) {
  return <div className="page-title">{back && <button className="back" onClick={onBack}><ArrowLeft size={15}/>{back}</button>}<div><label>{eyebrow}</label><h1>{title}</h1><p>{copy}</p></div>{action}</div>;
}
