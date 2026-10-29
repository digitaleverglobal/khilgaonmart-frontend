"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCheckoutSession } from "@/lib/useCheckoutSession";
import { createOrder, saveIncompleteOrder } from "@/services/orderService";
import {
  getPixelClickData,
  trackPixelEvent,
  type PixelUserData,
} from "@/lib/pixel";
import type { CreateOrderPayload } from "@/types/api";
import { normalizePhoneNumber } from "@/lib/checkoutOptions";

export interface LandingVariant {
  variantId: number;
  label: string;
  price: number;
  originalPrice: number;
  image: string;
  inStock?: boolean;
}

export interface LandingOrderOption {
  id: string;
  productId: string | number;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  freeShipping?: boolean;
  // Admin-priced variations to pick from; a picked one is sent as variantId/variantLabel.
  variants?: LandingVariant[];
  variantId?: number;
  variantLabel?: string;
}

export interface SelectedProduct extends LandingOrderOption {
  qty: number;
}

export type LandingShipping = "inside" | "outside";

interface LandingCustomer {
  name: string;
  phone: string;
  address: string;
  note: string;
}

// A checkout-style form picks a real district/area instead of inside/outside Dhaka.
export interface LandingDelivery {
  charge: number;
  customerDistrict: string;
  deliveryAreaId?: number;
}

export interface LandingOrderExtras {
  deliveryDate?: string;
  paymentMethod?: CreateOrderPayload["paymentMethod"];
  // Applies only while the subtotal still equals the one the coupon was checked against.
  coupon?: { code: string; discount: number; subtotal: number } | null;
}

interface UseLandingOrderOptions {
  landingId: number;
  title: string;
  options: LandingOrderOption[];
  deliveryInside: number;
  deliveryOutside: number;
  initialShipping?: LandingShipping;
  delivery?: LandingDelivery;
  extras?: LandingOrderExtras;
  // Extra form checks; returns an error message or "".
  validate?: () => string;
  // Demo pages never track, save drafts or create orders.
  demo?: boolean;
  messages: {
    requiredError: string;
    phoneError?: string;
    productRequiredError: string;
    successMessage: string;
  };
}

const EMPTY_CUSTOMER: LandingCustomer = {
  name: "",
  phone: "",
  address: "",
  note: "",
};

export const formatMoney = (value: number) => value.toLocaleString("en-US");

export function imageSrc(value?: string) {
  const src = String(value || "").trim();
  if (!src) return "/placeholder.jpg";
  if (/^(https?:|data:|blob:)/i.test(src) || src.startsWith("/")) return src;
  return `/images/${src.replace(/^images\//, "")}`;
}

const normalizePhone = (value: string) => {
  const digits = normalizePhoneNumber(value);
  if (digits.startsWith("8801") && digits.length === 13)
    return `0${digits.slice(3)}`;
  if (digits.startsWith("01") && digits.length === 11) return digits;
  return "";
};

const LANDING_DEVICE_ID_KEY = "tokjhal_landing_device_id";

function getLandingDeviceId() {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(LANDING_DEVICE_ID_KEY);
  if (existing) return existing;

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  window.localStorage.setItem(LANDING_DEVICE_ID_KEY, generated);
  return generated;
}

// Order state, draft capture, pixel events and submit shared by every landing page design.
export function useLandingOrder({
  landingId,
  title,
  options,
  deliveryInside,
  deliveryOutside,
  initialShipping = "inside",
  delivery,
  extras = {},
  validate,
  demo = false,
  messages,
}: UseLandingOrderOptions) {
  const [selected, setSelected] = useState<SelectedProduct[]>(() =>
    options[0] ? [{ ...options[0], qty: 1 }] : [],
  );
  const [customer, setCustomer] = useState<LandingCustomer>(EMPTY_CUSTOMER);
  const [shipping, setShipping] = useState<LandingShipping>(initialShipping);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [draftId, setDraftId] = useState<number | undefined>();
  const [deviceId, setDeviceId] = useState("");
  const checkout = useCheckoutSession();
  const router = useRouter();
  const addToCartTrackedRef = useRef(false);
  const beginCheckoutTrackedRef = useRef(false);
  const leadTrackedOrderIdRef = useRef<number | undefined>(undefined);

  // Matches the server: delivery is free only when every selected product ships free.
  const allFreeShipping =
    selected.length > 0 && selected.every((item) => item.freeShipping);
  const deliveryCharge = allFreeShipping
    ? 0
    : delivery
      ? delivery.charge
      : shipping === "inside"
        ? deliveryInside
        : deliveryOutside;
  const subtotal = useMemo(
    () => selected.reduce((sum, item) => sum + item.price * item.qty, 0),
    [selected],
  );
  const coupon =
    extras.coupon && extras.coupon.subtotal === subtotal ? extras.coupon : null;
  const discount = coupon?.discount || 0;
  const total = Math.max(0, subtotal + deliveryCharge - discount);
  const pixelData = useMemo(() => {
    const items = selected.length
      ? selected
      : options.slice(0, 1).map((item) => ({ ...item, qty: 1 }));
    return {
      content_ids: items.map((item) => item.productId || item.id),
      content_name: items.map((item) => item.name).join(", ") || title,
      content_type: "product",
      value:
        items.reduce((sum, item) => sum + item.price * item.qty, 0) ||
        subtotal ||
        0,
      currency: "BDT",
      num_items:
        items.reduce((sum, item) => sum + item.qty, 0) || items.length || 1,
    };
  }, [options, selected, subtotal, title]);

  const trackLandingEvent = (
    eventName: string,
    value = pixelData.value,
    orderId?: string | number,
    userData?: PixelUserData,
  ) => {
    if (demo) return;
    trackPixelEvent(
      eventName,
      { ...pixelData, value, order_id: orderId },
      userData,
    );
  };

  const trackAddToCartOnce = () => {
    if (addToCartTrackedRef.current) return;
    addToCartTrackedRef.current = true;
    trackLandingEvent("AddToCart");
  };

  const trackBeginCheckoutOnce = () => {
    trackAddToCartOnce();
    if (beginCheckoutTrackedRef.current) return;
    beginCheckoutTrackedRef.current = true;
    trackLandingEvent("InitiateCheckout", total);
  };

  useEffect(() => {
    setDeviceId(getLandingDeviceId());
    trackLandingEvent("ViewContent");
  }, []);

  function toggleOption(option: LandingOrderOption) {
    trackAddToCartOnce();
    setSelected((current) => {
      if (current.some((item) => item.id === option.id)) {
        const next = current.filter((item) => item.id !== option.id);
        return next.length ? next : current;
      }
      return [...current, { ...option, qty: 1 }];
    });
  }

  function changeQty(id: string, delta: number) {
    trackAddToCartOnce();
    setSelected((current) =>
      current.map((item) =>
        item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item,
      ),
    );
  }

  function updateCustomer(patch: Partial<LandingCustomer>) {
    setCustomer((prev) => ({ ...prev, ...patch }));
  }

  async function saveDraft(nextCustomer = customer) {
    const normalizedPhone = normalizePhone(nextCustomer.phone);
    if (!normalizedPhone || checkout.submitting.current) return;
    try {
      const draft = await saveIncompleteOrder(
        buildPayload("incomplete", normalizedPhone, nextCustomer),
      );
      setDraftId(draft.Id);
      if (draft.Id && leadTrackedOrderIdRef.current !== draft.Id) {
        leadTrackedOrderIdRef.current = draft.Id;
        trackLandingEvent("Lead", total, undefined, {
          name: nextCustomer.name.trim(),
          phone: normalizedPhone,
        });
      }
    } catch {
      // Draft capture is best-effort; final order still shows the user-facing error.
    }
  }

  useEffect(() => {
    const normalizedPhone = normalizePhone(customer.phone);
    if (demo || !normalizedPhone || success) return undefined;

    const timer = window.setTimeout(() => {
      void saveDraft(customer);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [
    customer.name,
    customer.phone,
    customer.address,
    customer.note,
    shipping,
    delivery?.customerDistrict,
    delivery?.deliveryAreaId,
    extras.deliveryDate,
    extras.paymentMethod,
    coupon?.code,
    selected,
    success,
  ]);

  function buildPayload(
    status: "pending" | "incomplete",
    normalizedPhone: string,
    customerData = customer,
  ): CreateOrderPayload {
    return {
      checkoutKey: checkout.getKey(normalizedPhone),
      ...(draftId ? { incompleteOrderId: draftId } : {}),
      deviceId,
      source: "Landing Page",
      orderSource: "Landing Page",
      customerName: customerData.name.trim() || "Landing Customer",
      customerPhone: normalizedPhone,
      customerAddress: customerData.address.trim(),
      customerDistrict: delivery?.customerDistrict || shipping,
      ...(delivery?.deliveryAreaId
        ? { deliveryAreaId: delivery.deliveryAreaId }
        : {}),
      ...(extras.deliveryDate ? { deliveryDate: extras.deliveryDate } : {}),
      ...(customerData.note.trim()
        ? { customerNote: customerData.note.trim().slice(0, 500) }
        : {}),
      paymentMethod: extras.paymentMethod || "cod",
      items: selected.map((item) => ({
        id: Number(item.productId || landingId) || landingId,
        name: item.name,
        image: item.image,
        price: item.price,
        qty: item.qty,
        ...(item.variantId
          ? { variantId: item.variantId, variant: item.variantLabel }
          : {}),
      })),
      subtotal,
      deliveryCharge,
      discount,
      couponCode: coupon?.code || null,
      advance: 0,
      total,
      tracking: {
        ...getPixelClickData(),
        source: "Landing Page",
        landingPageId: landingId,
        landingPage: title,
        status,
        shipping,
        note: customerData.note.trim(),
      },
    };
  }

  async function placeOrder() {
    if (checkout.submitting.current) return;
    setError("");
    setSuccess("");
    const normalizedPhone = normalizePhone(customer.phone);
    if (!customer.name.trim() || !customer.address.trim() || !customer.phone.trim()) {
      setError(messages.requiredError);
      return;
    }
    if (!normalizedPhone) {
      setError(messages.phoneError || messages.requiredError);
      return;
    }
    if (!selected.length) {
      setError(messages.productRequiredError);
      return;
    }
    const formError = validate?.();
    if (formError) {
      setError(formError);
      return;
    }
    if (demo) {
      setSuccess("এটি demo page — কোনো আসল order তৈরি হয়নি।");
      return;
    }

    checkout.submitting.current = true;
    setSaving(true);
    trackBeginCheckoutOnce();
    const pixelUser = { name: customer.name.trim(), phone: normalizedPhone };
    trackLandingEvent("AddPaymentInfo", total, undefined, pixelUser);
    try {
      const order = await createOrder(buildPayload("pending", normalizedPhone));
      trackLandingEvent("Purchase", total, order.Id, pixelUser);
      // invoiceId is the display number (KM-xxxx); orderId is the raw stored value.
      const invoiceId = order.invoiceId || order.orderId || String(order.Id);
      // Same hand-off as the cart checkout, so /order-success and re-confirm work alike.
      window.localStorage.setItem(
        "kafela_pending_reconfirm_order",
        JSON.stringify({
          orderId: order.Id,
          invoiceId,
          phone: normalizedPhone,
          name: customer.name.trim(),
          total,
        }),
      );
      setSuccess(`${messages.successMessage} Order ID: ${invoiceId}`);
      setCustomer(EMPTY_CUSTOMER);
      setDraftId(undefined);
      checkout.complete();
      router.push(`/order-success?invoiceId=${encodeURIComponent(invoiceId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order create failed.");
    } finally {
      checkout.submitting.current = false;
      setSaving(false);
    }
  }

  return {
    selected,
    customer,
    updateCustomer,
    shipping,
    setShipping,
    saving,
    error,
    success,
    allFreeShipping,
    deliveryCharge,
    discount,
    subtotal,
    total,
    toggleOption,
    changeQty,
    placeOrder,
    trackBeginCheckoutOnce,
  };
}
