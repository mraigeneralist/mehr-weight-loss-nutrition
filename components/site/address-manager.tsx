"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { INDIAN_STATES } from "@/lib/constants";
import type { Address } from "@/lib/types";

const Schema = z.object({
  label: z.string().optional(),
  recipient_name: z.string().min(2, "Required"),
  phone: z.string().min(10, "Phone required"),
  line1: z.string().min(3, "Required"),
  line2: z.string().optional(),
  city: z.string().min(2, "Required"),
  state: z.string().min(2, "Required"),
  pincode: z.string().regex(/^\d{6}$/, "6-digit PIN code"),
  is_default: z.boolean().default(false),
});

type Values = z.input<typeof Schema>;

export function AddressManager({
  initial,
  onSaved: onSavedProp,
  onDeleted: onDeletedProp,
}: {
  initial: Address[];
  onSaved?: (a: Address) => void;
  onDeleted?: (id: string) => void;
}) {
  const [list, setList] = useState<Address[]>(initial);
  const [editing, setEditing] = useState<Address | null>(null);
  const [showForm, setShowForm] = useState(initial.length === 0);

  function onSaved(addr: Address) {
    setList((prev) => {
      const exists = prev.some((a) => a.id === addr.id);
      const next = exists
        ? prev.map((a) => (a.id === addr.id ? addr : a))
        : [...prev, addr];
      // if newly default, unset others client-side too
      if (addr.is_default) {
        return next.map((a) =>
          a.id === addr.id ? a : { ...a, is_default: false },
        );
      }
      return next;
    });
    setEditing(null);
    setShowForm(false);
    onSavedProp?.(addr);
  }

  return (
    <div className="space-y-4">
      {list.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((a) => (
            <AddressCard
              key={a.id}
              address={a}
              onEdit={() => {
                setEditing(a);
                setShowForm(true);
              }}
              onDelete={(id) => {
                setList((prev) => prev.filter((x) => x.id !== id));
                onDeletedProp?.(id);
              }}
            />
          ))}
        </div>
      )}

      {showForm ? (
        <div className="rounded-2xl border border-border bg-card p-6">
          <AddressForm
            initial={editing}
            onSaved={onSaved}
            onCancel={() => {
              setEditing(null);
              setShowForm(false);
            }}
          />
        </div>
      ) : (
        <Button variant="outline" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Add address
        </Button>
      )}
    </div>
  );
}

function AddressCard({
  address,
  onEdit,
  onDelete,
}: {
  address: Address;
  onEdit: () => void;
  onDelete: (id: string) => void;
}) {
  const [pending, start] = useTransition();

  function remove() {
    start(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("addresses")
        .delete()
        .eq("id", address.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Address removed");
      onDelete(address.id);
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            {address.label || "Address"}
            {address.is_default && (
              <span className="rounded-full bg-sage/15 px-2 py-0.5 text-[11px] font-medium text-sage-deep">
                Default
              </span>
            )}
          </p>
          <p className="mt-2 text-sm">{address.recipient_name}</p>
          <p className="text-sm text-muted-foreground">{address.phone}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {address.line1}
            {address.line2 ? `, ${address.line2}` : ""}
            <br />
            {address.city}, {address.state} {address.pincode}
          </p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={remove}
            disabled={pending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function AddressForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial: Address | null;
  onSaved: (a: Address) => void;
  onCancel: () => void;
}) {
  const [pending, start] = useTransition();
  const form = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: {
      label: initial?.label ?? "Home",
      recipient_name: initial?.recipient_name ?? "",
      phone: initial?.phone ?? "",
      line1: initial?.line1 ?? "",
      line2: initial?.line2 ?? "",
      city: initial?.city ?? "",
      state: initial?.state ?? "",
      pincode: initial?.pincode ?? "",
      is_default: initial?.is_default ?? false,
    },
  });

  function onSubmit(values: Values) {
    start(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // If setting default, unset others first.
      if (values.is_default) {
        await supabase
          .from("addresses")
          .update({ is_default: false })
          .eq("user_id", user.id);
      }

      const payload = { ...values, user_id: user.id };
      const op = initial
        ? supabase
            .from("addresses")
            .update(payload)
            .eq("id", initial.id)
            .select()
            .single()
        : supabase.from("addresses").insert(payload).select().single();

      const { data, error } = await op;
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(initial ? "Address updated" : "Address saved");
      onSaved(data as Address);
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <h3 className="font-display text-lg font-semibold">
          {initial ? "Edit address" : "New address"}
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="label"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Label</FormLabel>
                <FormControl>
                  <Input placeholder="Home" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="recipient_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input inputMode="tel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="line1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address line 1</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="line2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address line 2 (optional)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {INDIAN_STATES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pincode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PIN code</FormLabel>
                <FormControl>
                  <Input inputMode="numeric" maxLength={6} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="is_default"
            checked={form.watch("is_default")}
            onCheckedChange={(v) =>
              form.setValue("is_default", Boolean(v), { shouldDirty: true })
            }
          />
          <Label htmlFor="is_default">Set as default</Label>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save address"}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
