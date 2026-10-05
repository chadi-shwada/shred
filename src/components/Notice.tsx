import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

type Tone = 'info' | 'warn' | 'ok' | 'danger';

const ICONS: Record<Tone, IconName> = { info: 'info', warn: 'alert', ok: 'check', danger: 'alert' };

interface NoticeProps {
  tone?: Tone;
  children: ReactNode;
  role?: 'status' | 'alert';
}

export function Notice({ tone = 'info', children, role }: NoticeProps) {
  return (
    <div className={`notice${tone === 'info' ? '' : ` notice--${tone}`}`} role={role}>
      <Icon name={ICONS[tone]} />
      <div>{children}</div>
    </div>
  );
}
