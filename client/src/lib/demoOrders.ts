/**
 * Trade Ledger, Recut: persistence boundary for no-payment demo orders.
 * If Supabase is not configured, the order completion remains explicitly local.
 */
import type { CartItem } from "@/contexts/CartContext";
import { supabase } from "@/lib/supabase";

export type DemoOrderInput = {
  reference: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  address1: string;
  address2: string;
  city: string;
  postcode: string;
  subtotal: number;
  items: CartItem[];
};

export async function saveDemoOrder(input: DemoOrderInput) {
  if (!supabase) return { persisted: false, reason: "Supabase is not configured" };
  const { data: order, error: orderError } = await supabase.from("demo_orders").insert({
    order_reference: input.reference,
    customer_name: `${input.firstName} ${input.lastName}`.trim(),
    customer_email: input.email,
    company: input.company || null,
    address_line_1: input.address1,
    address_line_2: input.address2 || null,
    city: input.city,
    postcode: input.postcode,
    subtotal: input.subtotal,
    status: "Demo order",
  }).select("id").single();
  if (orderError || !order) return { persisted: false, reason: orderError?.message || "Order could not be saved" };
  const { error: itemsError } = await supabase.from("demo_order_items").insert(input.items.map((item) => ({
    demo_order_id: order.id,
    product_sku: item.sku,
    product_name: item.name,
    unit_price: item.price,
    quantity: item.quantity,
  })));
  return { persisted: !itemsError, reason: itemsError?.message };
}
