"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import Select, { type StylesConfig } from "react-select";
import {
  BD_DISTRICTS,
  DEFAULT_DELIVERY_POLICY,
  DELIVERY_TIME_OPTIONS,
  getCouponErrorMessage,
  toDateInputValue,
} from "@/lib/checkoutOptions";
import {
  getDeliveryAreaCharge,
  getDeliveryDistricts,
  type DeliveryArea,
} from "@/services/deliveryAreaService";
import { validateCoupon, type AppliedCoupon } from "@/services/couponService";
import type { CreateOrderPayload } from "@/types/api";
import {
  imageSrc,
  useLandingOrder,
  type LandingOrderOption,
  type LandingVariant,
  type SelectedProduct,
} from "./useLandingOrder";

// Same form as the website checkout, fed with the landing page's own products and prices.
export type CheckoutLabels = Record<
  | "formHeaderText"
  | "nameLabel"
  | "phoneLabel"
  | "phonePlaceholder"
  | "addressLabel"
  | "districtLabel"
  | "districtPlaceholder"
  | "areaLabel"
  | "areaPlaceholder"
  | "deliveryDateLabel"
  | "noteLabel"
  | "notePlaceholder"
  | "paymentLabel"
  | "codLabel"
  | "codDescription"
  | "buttonText"
  | "placingText"
  | "policyTitle"
  | "summaryTitle"
  | "subtotalLabel"
  | "deliveryLabel"
  | "discountLabel"
  | "totalLabel"
  | "freeDeliveryText"
  | "couponPlaceholder"
  | "couponButtonText"
  | "requiredError"
  | "areaRequiredError"
  | "phoneError"
  | "productRequiredError"
  | "successMessage",
  string
>;

export interface CheckoutSettings {
  bkashNumber?: string | null;
  nagadNumber?: string | null;
  rocketNumber?: string | null;
  deliveryPolicyTitle?: string | null;
  deliveryPolicy?: string | null;
}

export interface CheckoutOptions {
  showDeliveryDate: boolean;
  showNote: boolean;
  showCoupon: boolean;
  showPolicy: boolean;
}

export interface CheckoutColors {
  formHeaderBg: string;
  confirmButtonBg: string;
  accentColor: string;
  buttonTextColor: string;
  pageBg: string;
  formSectionBg: string;
}

interface LandingCheckoutFormProps {
  landingId: number;
  title: string;
  options: LandingOrderOption[];
  deliveryAreas: DeliveryArea[];
  deliveryInside: number;
  deliveryOutside: number;
  settings: CheckoutSettings;
  labels: CheckoutLabels;
  show: CheckoutOptions;
  colors: CheckoutColors;
  // Title box with the product picker, styled like the page's other boxes.
  orderTitle: string;
  boxStyle: CSSProperties;
  demo?: boolean;
}

type SelectOption = { value: string; label: string };
type PaymentId = CreateOrderPayload["paymentMethod"];

const fmt = (value: number) => value.toLocaleString("en-US");

export default function LandingCheckoutForm({
  landingId,
  title,
  options,
  deliveryAreas,
  deliveryInside,
  deliveryOutside,
  settings,
  labels,
  show,
  colors,
  orderTitle,
  boxStyle,
  demo,
}: LandingCheckoutFormProps) {
  const [district, setDistrict] = useState("");
  const [deliveryAreaId, setDeliveryAreaId] = useState("");
  const [deliveryDay, setDeliveryDay] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const [payment, setPayment] = useState<PaymentId>("cod");
  const [coupon, setCoupon] = useState("");
  // A coupon counts only for the subtotal it was checked against.
  const [couponResult, setCouponResult] = useState<{
    coupon: AppliedCoupon | null;
    message: string;
    subtotal: number;
  }>({ coupon: null, message: "", subtotal: 0 });
  const [couponLoading, setCouponLoading] = useState(false);
  // The field wrapper clips overflow, so menus render on <body>.
  const menuPortalTarget =
    typeof document !== "undefined" ? document.body : null;

  // With delivery areas configured they price delivery, like the website checkout;
  // otherwise Dhaka uses the page's inside charge and every other district the outside one.
  const usesDeliveryAreas = deliveryAreas.length > 0;
  const districtOptions = usesDeliveryAreas
    ? getDeliveryDistricts(deliveryAreas)
    : BD_DISTRICTS;
  const areaOptions = deliveryAreas.filter(
    (area) => area.district === district,
  );
  const selectedArea = areaOptions.find(
    (area) => String(area.Id) === deliveryAreaId,
  );
  const deliveryChosen = usesDeliveryAreas
    ? Boolean(selectedArea)
    : Boolean(district);
  const locationCharge = !deliveryChosen
    ? 0
    : usesDeliveryAreas
      ? getDeliveryAreaCharge(selectedArea)
      : district.toLowerCase() === "dhaka"
        ? deliveryInside
        : deliveryOutside;
  const deliveryDate = deliveryDay
    ? [deliveryDay, deliveryTime].filter(Boolean).join(" ")
    : "";

  const order = useLandingOrder({
    landingId,
    title,
    options: options.map((option) =>
      withVariant(option, firstAvailable(option.variants)),
    ),
    deliveryInside,
    deliveryOutside,
    delivery: {
      charge: locationCharge,
      customerDistrict: district,
      deliveryAreaId: selectedArea?.Id,
    },
    extras: {
      deliveryDate: deliveryDate || undefined,
      paymentMethod: payment,
      coupon: couponResult.coupon
        ? {
            code: couponResult.coupon.code,
            discount: couponResult.coupon.discount,
            subtotal: couponResult.subtotal,
          }
        : null,
    },
    validate: () => {
      if (!district) return labels.requiredError;
      if (usesDeliveryAreas && !selectedArea) return labels.areaRequiredError;
      return "";
    },
    demo,
    messages: {
      requiredError: labels.requiredError,
      phoneError: labels.phoneError,
      productRequiredError: labels.productRequiredError,
      successMessage: labels.successMessage,
    },
  });
  const { selected, customer, updateCustomer, subtotal } = order;
  const couponCurrent = couponResult.subtotal === subtotal;
  const appliedCoupon = couponCurrent ? couponResult.coupon : null;
  const couponMessage = couponCurrent ? couponResult.message : "";

  async function applyCoupon() {
    const code = coupon.trim();
    if (!code) {
      setCouponResult({ coupon: null, message: "কুপন কোড লিখুন।", subtotal });
      return;
    }
    setCouponLoading(true);
    try {
      const result = await validateCoupon(code, subtotal);
      setCouponResult({
        coupon: result,
        message: `কুপন applied: ৳${fmt(result.discount)} discount`,
        subtotal,
      });
    } catch (error) {
      setCouponResult({
        coupon: null,
        message: getCouponErrorMessage(error),
        subtotal,
      });
    } finally {
      setCouponLoading(false);
    }
  }

  const paymentMethods = [
    { id: "cod" as const, label: labels.codLabel, number: null, bg: "#F07A22" },
    {
      id: "bkash" as const,
      label: "bKash",
      number: settings.bkashNumber,
      bg: "#E2136E",
    },
    {
      id: "nagad" as const,
      label: "Nagad",
      number: settings.nagadNumber,
      bg: "#F7941D",
    },
    {
      id: "rocket" as const,
      label: "Rocket",
      number: settings.rocketNumber,
      bg: "#7A1FA2",
    },
  ].filter((method) => method.id === "cod" || method.number);

  const districtSelectOptions: SelectOption[] = districtOptions.map((name) => ({
    value: name,
    label: name,
  }));
  const areaSelectOptions: SelectOption[] = areaOptions.map((area) => ({
    value: String(area.Id),
    label: `${area.area} (৳${fmt(getDeliveryAreaCharge(area))})`,
  }));

  return (
    <div id="order-now" onFocusCapture={order.trackBeginCheckoutOnce}>
      <div style={{ backgroundColor: colors.pageBg }}>
        <div className="mx-auto max-w-[1140px] pt-2 sm:px-4">
          <div
            className="border-t-[6px] px-4 py-6 md:px-8 md:py-8"
            style={{ ...boxStyle, borderColor: colors.accentColor }}
          >
            <h2
              className="text-center text-2xl font-black leading-snug md:text-4xl"
              style={{ color: colors.accentColor }}
            >
              {orderTitle}
            </h2>
            <div className="mt-6 flex flex-wrap justify-center gap-2.5 md:mt-8">
              {options.map((option) => (
                <ProductTile
                  key={option.id}
                  option={option}
                  selected={selected}
                  freeDeliveryText={labels.freeDeliveryText}
                  onToggle={order.toggleOption}
                  onChangeQty={order.changeQty}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      <section
        className="landing-checkout px-3 py-8 md:px-4"
        style={{ backgroundColor: colors.formSectionBg }}
      >
        <div className="checkout-main-grid mx-auto max-w-6xl">
          <div className="overflow-hidden rounded-[10px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            <div
              className="px-7 py-[18px]"
              style={{ background: colors.formHeaderBg }}
            >
              <p className="m-0 text-[15px] font-semibold text-white">
                {labels.formHeaderText}
              </p>
            </div>

            <div className="flex flex-col gap-5 px-5 py-7 md:px-7">
              <FieldLabel label={labels.nameLabel} required>
                <IconField icon={<UserIcon />}>
                  <input
                    type="text"
                    value={customer.name}
                    onChange={(event) =>
                      updateCustomer({ name: event.target.value })
                    }
                    className={INPUT_CLASS}
                  />
                </IconField>
              </FieldLabel>

              <FieldLabel label={labels.phoneLabel} required>
                <IconField icon={<PhoneIcon />}>
                  <input
                    type="tel"
                    value={customer.phone}
                    onChange={(event) =>
                      updateCustomer({ phone: event.target.value })
                    }
                    placeholder={labels.phonePlaceholder}
                    className={INPUT_CLASS}
                  />
                </IconField>
              </FieldLabel>

              <FieldLabel label={labels.addressLabel} required>
                <IconField icon={<PinIcon />}>
                  <input
                    type="text"
                    value={customer.address}
                    onChange={(event) =>
                      updateCustomer({ address: event.target.value })
                    }
                    className={INPUT_CLASS}
                  />
                </IconField>
              </FieldLabel>

              <div>
                <div
                  className={`grid gap-4 ${usesDeliveryAreas ? "md:grid-cols-2" : ""}`}
                >
                  <FieldLabel label={labels.districtLabel} required>
                    <IconField icon={<HomeIcon />}>
                      <Select<SelectOption>
                        instanceId={`landing-${landingId}-district`}
                        options={districtSelectOptions}
                        value={
                          districtSelectOptions.find(
                            (o) => o.value === district,
                          ) ?? null
                        }
                        onChange={(option) => {
                          setDistrict(option?.value ?? "");
                          setDeliveryAreaId("");
                        }}
                        placeholder={labels.districtPlaceholder}
                        noOptionsMessage={() => "কোনো জেলা পাওয়া যায়নি"}
                        styles={SELECT_STYLES}
                        menuPortalTarget={menuPortalTarget}
                      />
                    </IconField>
                  </FieldLabel>
                  {usesDeliveryAreas ? (
                    <FieldLabel label={labels.areaLabel} required>
                      <IconField icon={<PinIcon />}>
                        <Select<SelectOption>
                          instanceId={`landing-${landingId}-area`}
                          options={areaSelectOptions}
                          value={
                            areaSelectOptions.find(
                              (o) => o.value === deliveryAreaId,
                            ) ?? null
                          }
                          onChange={(option) =>
                            setDeliveryAreaId(option?.value ?? "")
                          }
                          isDisabled={!district}
                          placeholder={
                            district
                              ? labels.areaPlaceholder
                              : "-- আগে জেলা বেছে নিন --"
                          }
                          noOptionsMessage={() => "কোনো এরিয়া পাওয়া যায়নি"}
                          styles={SELECT_STYLES}
                          menuPortalTarget={menuPortalTarget}
                        />
                      </IconField>
                    </FieldLabel>
                  ) : null}
                </div>
                {deliveryChosen ? (
                  <p className="mt-1.5 text-[13px] font-medium text-[#F07A22]">
                    {order.allFreeShipping
                      ? labels.freeDeliveryText
                      : `${labels.deliveryLabel}: ৳${fmt(order.deliveryCharge)}`}
                  </p>
                ) : null}
              </div>

              {show.showDeliveryDate ? (
                <FieldLabel label={labels.deliveryDateLabel} optional>
                  <div className="grid gap-4 md:grid-cols-2">
                    <IconField icon={<CalendarIcon />}>
                      <input
                        type="date"
                        value={deliveryDay}
                        min={toDateInputValue(0)}
                        onChange={(event) => {
                          setDeliveryDay(event.target.value);
                          if (!event.target.value) setDeliveryTime("");
                        }}
                        className={`${INPUT_CLASS} cursor-pointer`}
                      />
                    </IconField>
                    <IconField icon={<ClockIcon />}>
                      <Select<SelectOption>
                        instanceId={`landing-${landingId}-time`}
                        options={DELIVERY_TIME_OPTIONS}
                        value={
                          DELIVERY_TIME_OPTIONS.find(
                            (o) => o.value === deliveryTime,
                          ) ?? null
                        }
                        onChange={(option) =>
                          setDeliveryTime(option?.value ?? "")
                        }
                        isDisabled={!deliveryDay}
                        isClearable
                        placeholder={
                          deliveryDay
                            ? "-- সময় বেছে নিন --"
                            : "-- আগে তারিখ বেছে নিন --"
                        }
                        noOptionsMessage={() => "কোনো সময় পাওয়া যায়নি"}
                        styles={SELECT_STYLES}
                        menuPortalTarget={menuPortalTarget}
                      />
                    </IconField>
                  </div>
                </FieldLabel>
              ) : null}

              {show.showNote ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setNoteOpen((open) => !open)}
                    className="flex w-full items-center justify-between rounded-lg border border-[#ddd] bg-[#f5f5f5] px-4 py-[13px] text-sm font-semibold text-[#333]"
                  >
                    {labels.noteLabel}
                    <span className="flex items-center gap-1.5 text-[13px]">
                      {noteOpen ? "Hide" : "Show"}
                      <ChevronIcon open={noteOpen} />
                    </span>
                  </button>
                  {noteOpen ? (
                    <textarea
                      value={customer.note}
                      onChange={(event) =>
                        updateCustomer({ note: event.target.value })
                      }
                      rows={3}
                      maxLength={500}
                      placeholder={labels.notePlaceholder}
                      className="mt-2.5 w-full resize-y rounded-lg border border-[#ddd] px-4 py-3 text-sm text-[#333] outline-none"
                    />
                  ) : null}
                </div>
              ) : null}

              <div>
                <p className="mb-3 text-sm font-semibold text-[#333]">
                  {labels.paymentLabel}{" "}
                  <span className="text-[#D7262E]">*</span>
                </p>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
                  {paymentMethods.map((method) => {
                    const active = payment === method.id;
                    return (
                      <button
                        type="button"
                        key={method.id}
                        onClick={() => setPayment(method.id)}
                        className="rounded-[10px] border-2 px-3.5 py-[13px] text-left transition"
                        style={{
                          borderColor: active ? method.bg : "#e5e7eb",
                          background: active ? `${method.bg}12` : "#fff",
                        }}
                      >
                        <span
                          className="block text-sm font-extrabold"
                          style={{ color: active ? method.bg : "#333" }}
                        >
                          {method.label}
                        </span>
                        <span className="mt-1 block text-xs leading-snug text-gray-500">
                          {method.number
                            ? `Send money: ${method.number}`
                            : labels.codDescription}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {payment !== "cod" ? (
                  <p className="mt-2 text-[13px] leading-relaxed text-gray-500">
                    selected number-এ পেমেন্ট করে অর্ডার কনফার্ম করুন। প্রয়োজনে
                    আমাদের প্রতিনিধি ফোনে যাচাই করবে।
                  </p>
                ) : null}
              </div>

              {order.error ? (
                <p className="m-0 rounded-md border border-red-300 bg-[#fff1f1] px-3.5 py-2.5 text-[13px] text-[#D7262E]">
                  {order.error}
                </p>
              ) : null}
              {order.success ? (
                <p className="m-0 rounded-md border border-green-300 bg-green-50 px-3.5 py-2.5 text-[13px] text-green-700">
                  {order.success}
                </p>
              ) : null}

              <button
                type="button"
                onClick={order.placeOrder}
                disabled={order.saving}
                className="flex items-center justify-center gap-2.5 rounded-lg py-4 text-base font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-80"
                style={{
                  background: order.saving ? "#aaa" : colors.confirmButtonBg,
                }}
              >
                <CheckIcon />
                {order.saving ? labels.placingText : labels.buttonText}
              </button>

              {show.showPolicy ? (
                <details className="delivery-policy">
                  <summary>
                    {settings.deliveryPolicyTitle || labels.policyTitle}
                  </summary>
                  <div
                    className="delivery-policy-body"
                    dangerouslySetInnerHTML={{
                      __html:
                        settings.deliveryPolicy || DEFAULT_DELIVERY_POLICY,
                    }}
                  />
                </details>
              ) : null}
            </div>
          </div>

          <aside className="order-first overflow-hidden rounded-[10px] lg:order-none bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            <div className="border-b-2 border-[#f0f0f0] px-[22px] py-[18px]">
              <h2 className="m-0 text-lg font-bold text-[#222]">
                {labels.summaryTitle}
              </h2>
            </div>

            <div className="border-b border-[#eee]">
              {selected.map((item) => {
                const option = item;
                return (
                  <div
                    key={option.id}
                    className="flex gap-3 border-b border-[#f0f0f0] px-[22px] py-4 last:border-b-0"
                  >
                    <img
                      src={imageSrc(option.image)}
                      alt={option.name}
                      className="h-16 w-16 shrink-0 rounded-lg border border-[#eee] bg-[#f8f8f8] object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2.5">
                        <p className="m-0 text-sm font-semibold leading-snug text-[#222]">
                          {option.name}
                          {option.variantLabel ? (
                            <span className="mt-0.5 block text-xs font-normal text-[#777]">
                              {option.variantLabel}
                            </span>
                          ) : null}
                        </p>
                        {selected.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => order.toggleOption(option)}
                            aria-label="Remove"
                            title="মুছে ফেলুন"
                            className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md border border-red-200 bg-[#fff5f5] text-[#D7262E]"
                          >
                            <TrashIcon />
                          </button>
                        ) : null}
                      </div>
                      {option.freeShipping ? (
                        <p className="mt-1 text-[11px] font-bold text-green-600">
                          {labels.freeDeliveryText}
                        </p>
                      ) : null}
                      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                        <div className="inline-flex items-center overflow-hidden rounded-md border border-[#ddd]">
                          <QtyButton
                            label="−"
                            disabled={item.qty <= 1}
                            onClick={() => order.changeQty(option.id, -1)}
                          />
                          <span className="min-w-9 border-x border-[#ddd] text-center text-sm font-semibold leading-[30px]">
                            {item.qty}
                          </span>
                          <QtyButton
                            label="+"
                            onClick={() => order.changeQty(option.id, 1)}
                          />
                        </div>
                        <div className="ml-auto whitespace-nowrap text-right">
                          {option.originalPrice > option.price ? (
                            <span className="mr-1.5 text-xs text-gray-400 line-through">
                              ৳{fmt(option.originalPrice * item.qty)}
                            </span>
                          ) : null}
                          <span className="text-[15px] font-bold text-[#222]">
                            ৳{fmt(option.price * item.qty)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-2.5 px-[22px] py-4 text-sm">
              <PriceRow
                label={labels.subtotalLabel}
                value={`৳${fmt(subtotal)}`}
              />
              <PriceRow
                label={labels.deliveryLabel}
                value={
                  order.allFreeShipping
                    ? "Free"
                    : `৳${fmt(order.deliveryCharge)}`
                }
              />
              <PriceRow
                label={labels.discountLabel}
                value={`৳${fmt(order.discount)}`}
              />
              <div className="mt-1.5 flex justify-between border-t border-[#eee] pt-3.5 text-base font-bold text-[#222]">
                <span>{labels.totalLabel}</span>
                <span>৳{fmt(order.total)}</span>
              </div>
            </div>

            {show.showCoupon ? (
              <div className="px-[22px] pb-5">
                <div className="flex gap-2">
                  <input
                    value={coupon}
                    onChange={(event) => setCoupon(event.target.value)}
                    placeholder={labels.couponPlaceholder}
                    className="min-w-0 flex-1 rounded-lg border border-[#ddd] px-3.5 py-2.5 text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={couponLoading}
                    className="rounded-lg bg-[#F07A22] px-4 text-sm font-bold text-white disabled:opacity-60"
                  >
                    {couponLoading ? "..." : labels.couponButtonText}
                  </button>
                </div>
                {couponMessage ? (
                  <p
                    className={`mt-2 text-[13px] ${appliedCoupon ? "text-green-600" : "text-[#D7262E]"}`}
                  >
                    {couponMessage}
                  </p>
                ) : null}
              </div>
            ) : null}
          </aside>
        </div>
      </section>
    </div>
  );
}

const TILE_PRIMARY = "#0E4A5F";

// Like the shop tile, a card starts on its first variation that is in stock.
function firstAvailable(variants: LandingVariant[] = []) {
  return variants.find((variant) => variant.inStock !== false) || variants[0];
}

// One order line per product + variation, priced from the variation.
function withVariant(
  option: LandingOrderOption,
  variant?: LandingVariant,
): LandingOrderOption {
  if (!variant) return option;
  return {
    ...option,
    id: `${option.id}:${variant.variantId}`,
    price: variant.price,
    originalPrice: variant.originalPrice,
    image: variant.image || option.image,
    variantId: variant.variantId,
    variantLabel: variant.label,
  };
}

// Same look as the shop's ProductTile: variation chips pick the line, + selects it and
// then turns into a stepper for that variation.
function ProductTile({
  option: base,
  selected,
  freeDeliveryText,
  onToggle,
  onChangeQty,
}: {
  option: LandingOrderOption;
  selected: SelectedProduct[];
  freeDeliveryText: string;
  onToggle: (option: LandingOrderOption) => void;
  onChangeQty: (id: string, delta: number) => void;
}) {
  const variants = base.variants || [];
  const [variant, setVariant] = useState<LandingVariant | undefined>(() =>
    firstAvailable(variants),
  );
  const option = withVariant(base, variant);
  const item = selected.find((entry) => entry.id === option.id);
  const qty = item?.qty || 0;
  const inStock = variant?.inStock !== false;
  const onAdd = () => {
    if (!inStock) return;
    if (item) onChangeQty(option.id, 1);
    else onToggle(option);
  };
  const onDecrease = () =>
    item && item.qty > 1 ? onChangeQty(option.id, -1) : onToggle(option);

  const percentOff =
    option.originalPrice > option.price
      ? Math.round(
          ((option.originalPrice - option.price) / option.originalPrice) * 100,
        )
      : 0;
  return (
    <div
      className="flex w-[calc(50%-5px)] flex-col border bg-white text-left transition-shadow hover:shadow-md sm:w-[calc(33.333%-7px)] lg:w-[calc(25%-7.5px)]"
      style={{
        borderRadius: 6,
        padding: "clamp(8px, 1.6vw, 14px)",
        borderColor: qty ? TILE_PRIMARY : "#e5e7eb",
        boxShadow: qty ? `0 0 0 1px ${TILE_PRIMARY}` : undefined,
      }}
    >
      <div className="relative">
        <button
          type="button"
          onClick={qty ? undefined : onAdd}
          className="block w-full"
          aria-label={option.name}
        >
          <img
            src={imageSrc(option.image)}
            alt={option.name}
            className="aspect-square w-full object-contain"
          />
        </button>
        {!inStock ? (
          <span
            className="absolute left-0 top-0 rounded-full px-[7px] py-0.5 text-[11px] font-bold text-white"
            style={{ background: "#6b7280" }}
          >
            Stock Out
          </span>
        ) : percentOff > 0 ? (
          <span
            className="absolute left-0 top-0 rounded-full px-[7px] py-0.5 text-[11px] font-bold text-white"
            style={{ background: "#D7262E" }}
          >
            -{percentOff}%
          </span>
        ) : null}
        {qty > 0 ? (
          <div
            className="absolute bottom-0 left-1/2 flex h-[30px] -translate-x-1/2 items-center rounded-full font-bold text-white shadow"
            style={{ background: TILE_PRIMARY }}
          >
            <button
              type="button"
              onClick={onDecrease}
              className="flex h-full w-8 items-center justify-center"
              aria-label={`Decrease ${option.name} quantity`}
            >
              <svg
                width="13"
                height="13"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.8"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path d="M5 12h14" />
              </svg>
            </button>
            <span className="min-w-6 text-center text-sm">{qty}</span>
            <button
              type="button"
              onClick={onAdd}
              disabled={!inStock}
              className="flex h-full w-8 items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`Increase ${option.name} quantity`}
            >
              <svg
                width="13"
                height="13"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.8"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onAdd}
            disabled={!inStock}
            title="Add"
            aria-label={`Add ${option.name}`}
            className="absolute bottom-0 right-0 flex h-[30px] w-[30px] items-center justify-center rounded-full text-white shadow transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: TILE_PRIMARY }}
          >
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.8"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        )}
      </div>

      <p
        className="mt-2.5 min-h-9 text-[13px] leading-[18px] text-[#222]"
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {option.name}
      </p>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="text-[15px] font-bold text-gray-900">
          ৳{fmt(option.price)}
        </span>
        {option.originalPrice > option.price ? (
          <span className="text-[11px] text-gray-400 line-through">
            ৳{fmt(option.originalPrice)}
          </span>
        ) : null}
      </div>
      {option.freeShipping ? (
        <p className="mt-1 text-[11px] font-bold text-green-600">
          {freeDeliveryText}
        </p>
      ) : null}
      {variants.length ? (
        <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
          {variants.map((entry) => {
            const active = entry.variantId === variant?.variantId;
            return (
              <button
                key={entry.variantId}
                type="button"
                onClick={() => setVariant(entry)}
                className="rounded-[3px] border px-2 py-1 text-[11px] leading-4 transition-colors"
                style={{
                  borderColor: active ? TILE_PRIMARY : "#d1d5db",
                  color: active
                    ? TILE_PRIMARY
                    : entry.inStock !== false
                      ? "#6b7280"
                      : "#c0c4cc",
                  background: active ? "#eef6f9" : "#fff",
                  textDecoration:
                    entry.inStock !== false ? "none" : "line-through",
                }}
              >
                {entry.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

const INPUT_CLASS =
  "min-w-0 flex-1 border-none bg-transparent px-3 py-[13px] text-sm text-[#333] outline-none sm:px-4";

const SELECT_STYLES: StylesConfig<SelectOption, false> = {
  container: (base) => ({ ...base, flex: 1 }),
  control: (base, state) => ({
    ...base,
    minHeight: 46,
    border: "none",
    boxShadow: "none",
    background: "transparent",
    cursor: state.isDisabled ? "not-allowed" : "pointer",
  }),
  valueContainer: (base) => ({ ...base, padding: "0 10px" }),
  // One line on narrow phones; long placeholders end in "…" instead of wrapping.
  placeholder: (base) => ({
    ...base,
    fontSize: 14,
    color: "#888",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  }),
  singleValue: (base) => ({ ...base, fontSize: 14, color: "#333" }),
  input: (base) => ({ ...base, fontSize: 14 }),
  indicatorSeparator: () => ({ display: "none" }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  option: (base, state) => ({
    ...base,
    fontSize: 14,
    cursor: "pointer",
    background: state.isSelected
      ? "#0F4C5C"
      : state.isFocused
        ? "#FFF1E6"
        : "#fff",
    color: state.isSelected ? "#fff" : "#333",
  }),
};

function FieldLabel({
  label,
  required,
  optional,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-[#333]">
        {label}
        {required ? <span className="text-[#D7262E]"> *</span> : null}
        {optional ? (
          <span className="font-normal text-[#888]"> (ঐচ্ছিক)</span>
        ) : null}
      </p>
      {children}
    </div>
  );
}

function IconField({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative flex overflow-hidden rounded-lg border border-[#ddd] bg-white">
      <span className="flex items-center border-r border-[#e0e0e0] bg-[#f5f5f5] px-3 sm:px-4">
        {icon}
      </span>
      {children}
    </div>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[#666]">{label}</span>
      <span className="font-semibold text-[#333]">{value}</span>
    </div>
  );
}

function QtyButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-[30px] w-[30px] bg-[#f8f8f8] text-base text-[#333] disabled:cursor-not-allowed disabled:text-[#bbb]"
    >
      {label}
    </button>
  );
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="18"
      height="18"
      fill="none"
      stroke="#888"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      aria-hidden
    >
      {children}
    </svg>
  );
}

const UserIcon = () => (
  <Icon>
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Icon>
);
const PhoneIcon = () => (
  <Icon>
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.82 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z" />
  </Icon>
);
const PinIcon = () => (
  <Icon>
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </Icon>
);
const HomeIcon = () => (
  <Icon>
    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
  </Icon>
);
const CalendarIcon = () => (
  <Icon>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </Icon>
);
const ClockIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </Icon>
);

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      fill="none"
      stroke="#888"
      strokeWidth="2"
      viewBox="0 0 24 24"
      style={{ transform: open ? "rotate(180deg)" : "none" }}
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
    </svg>
  );
}
