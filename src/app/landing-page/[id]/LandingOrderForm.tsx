"use client";

import {
  formatMoney,
  imageSrc,
  useLandingOrder,
  type LandingOrderOption,
} from "./useLandingOrder";

export type { LandingOrderOption } from "./useLandingOrder";

interface LandingOrderFormProps {
  landingId: number;
  title: string;
  options: LandingOrderOption[];
  phone: string;
  deliveryInside: number;
  deliveryOutside: number;
  orderTitle: string;
  ctaText: string;
  orderForm?: Record<string, unknown>;
}

const textValue = (
  source: Record<string, unknown> | undefined,
  key: string,
  fallback: string,
) => String(source?.[key] || fallback);

export default function LandingOrderForm({
  landingId,
  title,
  options,
  deliveryInside,
  deliveryOutside,
  orderTitle,
  ctaText,
  orderForm,
}: LandingOrderFormProps) {
  const labels = {
    productSelectTitle: textValue(
      orderForm,
      "productSelectTitle",
      "আপনার প্রোডাক্টটি সিলেক্ট করুন",
    ),
    billingTitle: textValue(orderForm, "billingTitle", "Billing details"),
    nameLabel: textValue(orderForm, "nameLabel", "আপনার নাম *"),
    phoneLabel: textValue(orderForm, "phoneLabel", "আপনার ফোন নাম্বার *"),
    addressLabel: textValue(orderForm, "addressLabel", "আপনার ঠিকানা *"),
    noteLabel: textValue(orderForm, "noteLabel", "Order Notes (optional)"),
    notePlaceholder: textValue(
      orderForm,
      "notePlaceholder",
      "অর্ডার এবং কলার সম্পর্কে কিছু বলার থাকলে এখানে লিখুন",
    ),
    summaryTitle: textValue(orderForm, "summaryTitle", "Your order"),
    insideDhakaLabel: textValue(orderForm, "insideDhakaLabel", "ঢাকার ভিতরে"),
    outsideDhakaLabel: textValue(orderForm, "outsideDhakaLabel", "ঢাকার বাইরে"),
    subtotalLabel: textValue(orderForm, "subtotalLabel", "Subtotal"),
    totalLabel: textValue(orderForm, "totalLabel", "Total"),
    codTitle: textValue(
      orderForm,
      "codTitle",
      "🎁 পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন ✅",
    ),
    codDescription: textValue(
      orderForm,
      "codDescription",
      "ডেলিভারি ম্যানের কাছে টাকা দিয়ে পার্সেল রিসিভ করে নিবেন। সাধারণত ১-২ দিন সময় লাগতে পারে।",
    ),
    requiredError: textValue(
      orderForm,
      "requiredError",
      "আপনার নাম, সঠিক ফোন নম্বর এবং ঠিকানা দিন।",
    ),
    productRequiredError: textValue(
      orderForm,
      "productRequiredError",
      "অর্ডারের জন্য অন্তত একটি প্রোডাক্ট সিলেক্ট করুন।",
    ),
    successMessage: textValue(
      orderForm,
      "successMessage",
      "আপনার অর্ডারটি নেওয়া হয়েছে।",
    ),
  };
  const {
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
    subtotal,
    total,
    toggleOption,
    changeQty,
    placeOrder,
    trackBeginCheckoutOnce,
  } = useLandingOrder({
    landingId,
    title,
    options,
    deliveryInside,
    deliveryOutside,
    messages: labels,
  });

  return (
    <section
      id="order-now"
      className="bg-slate-100 px-4 py-20"
      onFocusCapture={trackBeginCheckoutOnce}
    >
      <div className="mx-auto max-w-5xl rounded-md border-2 border-[#05a925] bg-white p-6 shadow-sm md:p-8">
        <h2 className="text-center text-3xl font-black leading-tight text-slate-800 md:text-4xl">
          {orderTitle}
        </h2>

        <div className="mt-8">
          <h3 className="mb-3 text-sm font-black text-[#38651f]">
            {labels.productSelectTitle}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {options.map((option) => {
              const item = selected.find((entry) => entry.id === option.id);
              return (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleOption(option)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleOption(option);
                    }
                  }}
                  key={option.id}
                  className={`grid grid-cols-[22px_64px_1fr] gap-3 rounded-md border p-3 text-left transition ${
                    item
                      ? "border-emerald-400 bg-emerald-50/30"
                      : "border-slate-200 bg-white hover:border-emerald-300"
                  }`}
                >
                  <span
                    className={`mt-5 h-4 w-4 rounded-full border ${
                      item
                        ? "border-emerald-600 bg-emerald-600"
                        : "border-slate-300"
                    }`}
                  />
                  <img
                    src={imageSrc(option.image)}
                    alt={option.name}
                    className="h-16 w-16 rounded object-cover"
                  />
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-black text-slate-800">
                      {option.name}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      {item ? (
                        <span className="inline-flex overflow-hidden rounded border border-gray-300 bg-white">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              changeQty(option.id, -1);
                            }}
                            className="px-3 py-1"
                          >
                            -
                          </button>
                          <span className="border-x border-gray-300 px-4 py-1">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              changeQty(option.id, 1);
                            }}
                            className="px-3 py-1"
                          >
                            +
                          </button>
                        </span>
                      ) : null}
                      {option.originalPrice > option.price ? (
                        <span className="text-sm text-gray-400 line-through">
                          {formatMoney(option.originalPrice)}৳
                        </span>
                      ) : null}
                      <span className="text-sm font-bold text-neutral-800">
                        {formatMoney(option.price)}৳
                      </span>
                      {option.freeShipping ? (
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                          ফ্রি ডেলিভারি
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-[1.15fr_0.85fr]">
          <div>
            <h3 className="mb-4 text-base font-black text-red-600">
              আপনার নাম,মোবাইল নাম্বার এবং ঠিকানা লিখে সাবমিট করুন
            </h3>
            <LandingInput
              label={labels.nameLabel}
              value={customer.name}
              onChange={(name) => updateCustomer({ name })}
            />
            <LandingInput
              label={labels.phoneLabel}
              value={customer.phone}
              onChange={(nextPhone) => updateCustomer({ phone: nextPhone })}
              inputMode="tel"
            />
            <LandingInput
              label={labels.addressLabel}
              value={customer.address}
              onChange={(address) => updateCustomer({ address })}
            />
            <label className="mt-4 block text-sm font-bold text-neutral-700">
              {labels.noteLabel}
              <textarea
                value={customer.note}
                onChange={(event) => updateCustomer({ note: event.target.value })}
                placeholder={labels.notePlaceholder}
                className="mt-2 min-h-24 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500"
              />
            </label>

            <div className="mt-4 divide-y divide-slate-200 overflow-hidden rounded border border-slate-200">
              <button
                type="button"
                onClick={() => setShipping("inside")}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold"
              >
                <span>
                  <span
                    className={
                      shipping === "inside"
                        ? "text-emerald-600"
                        : "text-slate-300"
                    }
                  >
                    ●
                  </span>{" "}
                  {labels.insideDhakaLabel}{" "}
                  {allFreeShipping
                    ? "ফ্রি ডেলিভারি"
                    : `${formatMoney(deliveryInside)} টাকা`}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setShipping("outside")}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold"
              >
                <span>
                  <span
                    className={
                      shipping === "outside"
                        ? "text-emerald-600"
                        : "text-slate-300"
                    }
                  >
                    ●
                  </span>{" "}
                  {labels.outsideDhakaLabel}{" "}
                  {allFreeShipping
                    ? "ফ্রি ডেলিভারি"
                    : `${formatMoney(deliveryOutside)} টাকা`}
                </span>
              </button>
            </div>

            {error ? (
              <p className="mt-4 rounded bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="mt-4 rounded bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
                {success}
              </p>
            ) : null}

            <button
              type="button"
              onClick={placeOrder}
              disabled={saving}
              className="mt-6 w-full rounded bg-[#14883b] px-5 py-4 text-lg font-black text-white transition hover:bg-[#0f7432] disabled:opacity-60"
            >
              🔒 {saving ? "Place Order..." : ctaText}
            </button>
          </div>

          <aside>
            <div className="overflow-hidden rounded border border-slate-200 bg-white">
              <div className="grid grid-cols-[1fr_92px_88px] bg-slate-100 px-3 py-4 text-base font-black text-slate-900">
                <span>Product</span>
                <span className="text-center">Amount</span>
                <span className="text-right">Price</span>
              </div>
              {selected.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_92px_88px] items-center gap-2 bg-slate-200/80 p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src={imageSrc(item.image)}
                      alt={item.name}
                      className="h-12 w-12 rounded object-cover"
                    />
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-bold">
                        {item.name}
                      </p>
                    </div>
                  </div>
                  <span className="mx-auto rounded border border-slate-600 px-3 py-1 text-sm font-black">
                    {item.qty} x
                  </span>
                  <strong className="text-right">
                    {formatMoney(item.price * item.qty)}৳
                  </strong>
                </div>
              ))}
              <SummaryRow label={labels.subtotalLabel} value={subtotal} />
              <SummaryRow
                label="Delivery Charge"
                value={deliveryCharge}
                text={allFreeShipping ? "ফ্রি" : undefined}
              />
              <SummaryRow label={labels.totalLabel} value={total} strong />
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function LandingInput({
  label,
  value,
  onChange,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: "tel";
}) {
  return (
    <label className="mb-4 block text-sm font-bold text-neutral-700">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode={inputMode}
        className="mt-2 h-11 w-full rounded border border-gray-300 px-3 outline-none focus:border-orange-500"
      />
    </label>
  );
}

function SummaryRow({
  label,
  value,
  text,
  strong,
}: {
  label: string;
  value: number;
  text?: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between p-3 ${strong ? "text-lg font-black" : "text-sm font-bold"}`}
    >
      <span>{label}</span>
      <span>{text ?? `${formatMoney(value)}৳`}</span>
    </div>
  );
}
