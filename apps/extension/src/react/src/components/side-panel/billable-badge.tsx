import { Badge } from '@repo/ui/components/badge';
import { DollarSign } from 'lucide-react';

export function BillableBadge({ isBillable }: { isBillable: boolean }) {
  return (
    <Badge
      variant={isBillable ? 'default' : 'secondary'}
      className="w-fit flex items-center gap-1.5"
    >
      <DollarSign className="h-3 w-3" />
      {isBillable ? 'Billable' : 'Non-billable'}
    </Badge>
  );
}
