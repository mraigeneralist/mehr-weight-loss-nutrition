import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

const VARIANTS: Record<OrderStatus, string> = {
  created: "bg-muted text-muted-foreground border-transparent",
  paid: "bg-sage/15 text-sage-deep border-transparent",
  shipped: "bg-[#d9b16d]/25 text-[#7a5e1f] border-transparent",
  delivered: "bg-sage-deep text-cream border-transparent",
  cancelled: "bg-destructive/15 text-destructive border-transparent",
  failed: "bg-destructive/15 text-destructive border-transparent",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant="outline" className={cn("capitalize", VARIANTS[status])}>
      {ORDER_STATUS_LABELS[status]}
    </Badge>
  );
}
