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
  const { error } = await supabase.rpc("create_demo_order_with_items", {
    p_order_reference: input.reference,
    p_customer_name: `${input.firstName} ${input.lastName}`.trim(),
    p_customer_email: input.email,
    p_company: input.company,
    p_address_line_1: input.address1,
    p_address_line_2: input.address2,
    p_city: input.city,
    p_postcode: input.postcode,
    p_subtotal: input.subtotal,
    p_items: input.items.map((item) => ({ product_sku: item.sku, product_name: item.name, unit_price: item.price, quantity: item.quantity })),
  });
  return { persisted: !error, reason: error?.message };
}
