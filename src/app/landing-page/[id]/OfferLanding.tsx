import type { CSSProperties } from "react";
import type { LandingOrderOption } from "./useLandingOrder";
import type { DeliveryArea } from "@/services/deliveryAreaService";
import OfferCarousel from "./OfferCarousel";
import LandingCheckoutForm, {
  type CheckoutLabels,
  type CheckoutSettings,
} from "./LandingCheckoutForm";

// Defaults mirror the admin's Offer landing form so a half-filled page still reads well.
const DEFAULT_LABELS: CheckoutLabels = {
  formHeaderText:
    "বিস্তারিত তথ্য পূরণ করুন এবং 'অর্ডার কনফার্ম করুন' বাটনে ক্লিক করুন।",
  nameLabel: "আপনার নাম",
  phoneLabel: "ফোন নাম্বার",
  phonePlaceholder: "১১ সংখ্যার মোবাইল নম্বর",
  addressLabel: "আপনার পুরো ঠিকানা",
  districtLabel: "জেলা নির্বাচন করুন",
  districtPlaceholder: "-- জেলা বেছে নিন --",
  areaLabel: "এরিয়া নির্বাচন করুন",
  areaPlaceholder: "-- এরিয়া বেছে নিন --",
  deliveryDateLabel: "ডেলিভারি তারিখ ও সময়",
  noteLabel: "বিশেষ নোট (ঐচ্ছিক)",
  notePlaceholder: "ডেলিভারি সংক্রান্ত কোনো নির্দেশনা থাকলে লিখুন",
  paymentLabel: "পেমেন্ট মেথড",
  codLabel: "Cash on Delivery",
  codDescription: "পণ্য হাতে পেয়ে টাকা দিন",
  buttonText: "অর্ডার কনফার্ম করুন",
  placingText: "প্রসেস হচ্ছে...",
  policyTitle: "হোম ডেলিভারি পলিসি",
  summaryTitle: "অর্ডার বিবরণ",
  subtotalLabel: "মোট",
  deliveryLabel: "ডেলিভারি চার্জ",
  discountLabel: "ডিসকাউন্ট",
  totalLabel: "সর্বমোট",
  freeDeliveryText: "ফ্রি ডেলিভারি",
  couponPlaceholder: "Apply Coupon",
  couponButtonText: "APPLY",
  requiredError: "নাম, ফোন, জেলা এবং ঠিকানা পূরণ করুন।",
  areaRequiredError: "এরিয়া নির্বাচন করুন।",
  phoneError: "সঠিক ১১ সংখ্যার ফোন নাম্বার দিন।",
  productRequiredError: "অর্ডারের জন্য অন্তত একটি প্রোডাক্ট সিলেক্ট করুন।",
  successMessage: "আপনার অর্ডারটি নেওয়া হয়েছে।",
};

const DEFAULT_COLORS = {
  pageBg: "#000000",
  accentColor: "#e10600",
  headlineBg: "#f2f2f2",
  headlineText: "#111111",
  priceBg: "#000000",
  priceText: "#ffffff",
  sectionBg: "#ffffff",
  textColor: "#1e293b",
  checkColor: "#f97316",
  buttonTextColor: "#ffffff",
  formSectionBg: "#f7f4ef",
  footerBg: "#0f172a",
  footerText: "#ffffff",
  formHeaderBg: "#F07A22",
  confirmButtonBg: "#0E4A5F",
};

// Defaults of the short-lived "premium" layout; pages saved with them get the current defaults.
const PREVIOUS_DEFAULT_COLORS: Record<string, string> = {
  pageBg: "#f7f4ef",
  accentColor: "#e11d2a",
  headlineBg: "#0f172a",
  headlineText: "#ffffff",
  priceBg: "#111827",
  priceText: "#ffffff",
  checkColor: "#16a34a",
};

function resolveColors(saved: Record<string, string> = {}) {
  const untouched = ["pageBg", "headlineBg", "headlineText", "priceBg"].every(
    (key) => saved[key]?.toLowerCase() === PREVIOUS_DEFAULT_COLORS[key],
  );
  const kept = untouched
    ? Object.fromEntries(
        Object.entries(saved).filter(
          ([key, value]) =>
            value?.toLowerCase() !== PREVIOUS_DEFAULT_COLORS[key],
        ),
      )
    : saved;
  return { ...DEFAULT_COLORS, ...kept };
}

// Earlier default texts that no longer fit small phones; saved pages still holding them
// get the current default.
const OLD_DEFAULT_LABELS: Partial<CheckoutLabels> = {
  phonePlaceholder: "০ দিয়ে শুরু করে ১১ সংখ্যার মোবাইল নম্বর দিন",
};

function withoutOldDefaults(labels: CheckoutLabels): CheckoutLabels {
  const next = { ...labels };
  (Object.keys(OLD_DEFAULT_LABELS) as (keyof CheckoutLabels)[]).forEach(
    (key) => {
      if (next[key] === OLD_DEFAULT_LABELS[key])
        next[key] = DEFAULT_LABELS[key];
    },
  );
  return next;
}

interface OfferLandingProps {
  page: { Id: number; title: string; price?: unknown; originalPrice?: unknown };
  data: Record<string, unknown>;
  logoUrl: string;
  bannerUrl: string;
  carouselImages: string[];
  reviewImages: string[];
  siteName: string;
  options: LandingOrderOption[];
  deliveryInside: number;
  deliveryOutside: number;
  deliveryAreas: DeliveryArea[];
  settings: CheckoutSettings;
  demo?: boolean;
}

const text = (value: unknown, fallback = "") =>
  typeof value === "string" ? value.trim() : fallback;

const textList = (value: unknown) =>
  (Array.isArray(value) ? value : []).map((line) => text(line)).filter(Boolean);

const toBanglaDigits = (value: number) =>
  value.toLocaleString("en-US").replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);

export default function OfferLanding({
  page,
  data,
  logoUrl,
  bannerUrl,
  carouselImages,
  reviewImages,
  siteName,
  options,
  deliveryInside,
  deliveryOutside,
  deliveryAreas,
  settings,
  demo,
}: OfferLandingProps) {
  const colors = resolveColors(data.colors as Record<string, string>);
  const labels = withoutOldDefaults({
    ...DEFAULT_LABELS,
    ...((data.checkoutForm as Partial<CheckoutLabels>) || {}),
  });
  const headlines = textList(data.headlines);
  const features = textList(data.features);
  const featureTitle = text(data.featureTitle);
  const carouselTitle = text(data.carouselTitle);
  const reviewTitle = text(data.reviewCarouselTitle);
  const ctaText = text(data.ctaText) || "অর্ডার করতে চাই";
  const price = Number(page.price) || options[0]?.price || 0;
  const originalPrice =
    Number(page.originalPrice) || options[0]?.originalPrice || 0;
  const priceLabel = text(data.priceLabel, "অফার মূল্য-");
  const currencyText = text(data.currencyText, "টাকা");
  const orderTitle =
    text(data.orderTitle) || "অর্ডার করতে নিচের ফর্মটি সঠিক ভাবে পুরন করুন।";
  const footerText =
    text(data.footerText) ||
    `Copyright © ${new Date().getFullYear()} ${siteName}`;
  const showLogo = data.showLogo !== false && Boolean(logoUrl);

  const sectionStyle = {
    backgroundColor: colors.sectionBg,
    color: colors.textColor,
  };
  const accentButton = {
    backgroundColor: colors.accentColor,
    color: colors.buttonTextColor,
  };
  const formatPrice = (value: number) =>
    `${toBanglaDigits(value)} ${currencyText}`;

  return (
    <main
      className="landing-root min-h-screen pb-20 md:pb-0"
      style={{ backgroundColor: colors.pageBg, color: colors.textColor }}
    >
      <div className="mx-auto max-w-[1140px] space-y-2 pt-2 sm:px-4 md:pt-3">
        {showLogo ? (
          <div className="px-4 py-3 md:py-4" style={sectionStyle}>
            <img
              src={logoUrl}
              alt={siteName}
              className="mx-auto h-12 max-w-60 object-contain md:h-16"
            />
          </div>
        ) : null}

        {headlines.map((line, index) => (
          <h2
            key={`headline-${index}`}
            className="px-4 py-2.5 text-center text-lg font-bold leading-snug md:py-3 md:text-[28px]"
            style={{
              backgroundColor: colors.headlineBg,
              color: colors.headlineText,
            }}
          >
            {line}
          </h2>
        ))}

        {bannerUrl ? (
          <img src={bannerUrl} alt={page.title} className="block w-full" />
        ) : null}

        {data.showCarousel !== false ? (
          <CarouselSection
            title={carouselTitle}
            images={carouselImages}
            accentColor={colors.accentColor}
            style={sectionStyle}
          />
        ) : null}

        {featureTitle || features.length ? (
          <section className="px-4 py-7 md:px-8 md:py-10" style={sectionStyle}>
            {featureTitle ? (
              <h2
                className="text-center text-2xl font-black md:text-4xl"
                style={{ color: colors.accentColor }}
              >
                {featureTitle}
              </h2>
            ) : null}
            {features.length ? (
              <ul className="mt-5 divide-y divide-slate-200 md:mt-7">
                {features.map((line, index) => (
                  <li
                    key={`feature-${index}`}
                    className="flex items-start gap-2.5 py-2.5 text-[15px] md:py-3 md:text-lg"
                  >
                    <CheckIcon color={colors.checkColor} />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-6 text-center md:mt-8">
              <a
                href="#order-now"
                className="inline-block rounded-sm px-7 py-2.5 text-base font-bold transition hover:opacity-90 md:px-9 md:py-3 md:text-lg"
                style={accentButton}
              >
                {ctaText}
              </a>
            </div>
          </section>
        ) : null}

        {data.showReviewCarousel !== false ? (
          <CarouselSection
            title={reviewTitle}
            images={reviewImages}
            accentColor={colors.accentColor}
            style={sectionStyle}
          />
        ) : null}

        {price > 0 ? (
          <section
            className="px-4 py-8 text-center text-2xl font-black md:py-12 md:text-5xl"
            style={{ backgroundColor: colors.priceBg, color: colors.priceText }}
          >
            {priceLabel}
            {originalPrice > price ? (
              <span
                className="mx-1 inline-block rounded-[50%] border-2 px-2 py-0.5 line-through md:mx-2 md:border-[3px] md:px-3"
                style={{
                  borderColor: colors.accentColor,
                  color: colors.accentColor,
                }}
              >
                {formatPrice(originalPrice)}
              </span>
            ) : null}
            {formatPrice(price)}
          </section>
        ) : null}
      </div>

      <LandingCheckoutForm
        landingId={page.Id}
        title={page.title}
        options={options}
        deliveryAreas={deliveryAreas}
        deliveryInside={deliveryInside}
        deliveryOutside={deliveryOutside}
        settings={settings}
        labels={labels}
        show={{
          showDeliveryDate: data.showDeliveryDate !== false,
          showNote: data.showNote !== false,
          showCoupon: data.showCoupon !== false,
          showPolicy: data.showPolicy !== false,
        }}
        colors={colors}
        orderTitle={orderTitle}
        boxStyle={sectionStyle}
        demo={demo}
      />

      <footer
        className="px-4 py-6 text-center text-sm"
        style={{ backgroundColor: colors.footerBg, color: colors.footerText }}
      >
        <span className="opacity-80">{footerText}</span>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-black/10 bg-white px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] md:hidden">
        {price > 0 ? (
          <div className="leading-tight text-slate-900">
            <p className="text-lg font-black">{formatPrice(price)}</p>
            {originalPrice > price ? (
              <p className="text-xs text-slate-400 line-through">
                {formatPrice(originalPrice)}
              </p>
            ) : null}
          </div>
        ) : null}
        <a
          href="#order-now"
          className="flex-1 rounded-full px-5 py-3 text-center text-base font-bold"
          style={accentButton}
        >
          {ctaText}
        </a>
      </div>
    </main>
  );
}

// A titled image carousel box (product gallery or customer reviews); hidden when empty.
function CarouselSection({
  title,
  images,
  accentColor,
  style,
}: {
  title: string;
  images: string[];
  accentColor: string;
  style: CSSProperties;
}) {
  if (!title && !images.length) return null;
  return (
    <section className="px-4 py-7 md:px-8 md:py-10" style={style}>
      {title ? (
        <h2
          className="text-center text-2xl font-black md:text-4xl"
          style={{ color: accentColor }}
        >
          {title}
        </h2>
      ) : null}
      {images.length ? (
        <div className={title ? "mt-6 md:mt-8" : ""}>
          <OfferCarousel images={images} accentColor={accentColor} />
        </div>
      ) : null}
    </section>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mt-1 h-4 w-4 shrink-0 md:h-5 md:w-5"
      fill="none"
      stroke={color}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 13l4 4L16 7" />
      <path d="M10 15l2 2L22 7" />
    </svg>
  );
}
