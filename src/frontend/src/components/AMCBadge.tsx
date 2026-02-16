import { Badge } from '@/components/ui/badge';
import { getAMCTypeInfo } from '../lib/amc';
import type { AMCType } from '../backend';

interface AMCBadgeProps {
  type: AMCType;
  className?: string;
}

export default function AMCBadge({ type, className }: AMCBadgeProps) {
  const info = getAMCTypeInfo(type);

  return (
    <Badge 
      className={`${info.bgColor} ${info.textColor} hover:${info.bgColor} ${className || ''}`}
    >
      AMC: {info.label}
    </Badge>
  );
}
