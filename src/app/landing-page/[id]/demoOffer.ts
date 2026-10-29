import type { LandingOrderOption } from "./useLandingOrder";

// Sample content for /landing-page/demo, a preview of the Offer design that needs no saved page.
export const DEMO_OFFER_PAGE = {
  Id: 0,
  title: "Mini Air Cooler — Demo Offer",
  price: 1150,
  originalPrice: 2300,
};

export const DEMO_OFFER_BANNER = "/demo/offer-banner.jpg";

export const DEMO_OFFER_REVIEWS = [
  "/demo/review-1.svg",
  "/demo/review-2.svg",
  "/demo/review-3.svg",
];

export const DEMO_OFFER_CAROUSEL = [
  "/demo/offer-mist.jpg",
  "/demo/offer-glass.jpg",
  "/demo/offer-product.jpg",
  "/demo/offer-banner.jpg",
];

export const DEMO_OFFER_DATA: Record<string, unknown> = {
  headlines: [
    "মিস্ট এয়ার কুলার, জাদুর এই এসি বাংলাদেশে এখন পাচ্ছেন খিলগাঁও মার্টে",
    "বিদ্যুৎ ছাড়া চলবে ৬-৮ ঘণ্টা, সাথে বিদ্যুৎ দিয়েও চালানো যাবে।",
    "আজ অর্ডার করলে পাচ্ছেন ৫০% ডিসকাউন্ট বিশেষ ছাড়! সারা বাংলাদেশে ফ্রি হোম ডেলিভারি",
  ],
  carouselTitle: "এক নজরে মিনি এয়ার কুলার",
  reviewCarouselTitle: "আমাদের সন্তুষ্ট ক্রেতাদের মতামত",
  featureTitle: "ফ্যানটির আকর্ষণীয় বিবরন",
  features: [
    "ডাবল কুলিং সিস্টেম – বাতাস + পানি মিস্ট একসাথে দেয়, ফলে দ্রুত ঠান্ডা লাগে।",
    "ডাবল ব্যাটারি বিদ্যুৎ ছাড়া চলবে বেশি সময় ধরে।",
    "USB / ব্যাটারি চালিত – বিদ্যুৎ না থাকলেও ব্যবহার করা যায়।",
    "কম বিদ্যুৎ খরচ – AC এর তুলনায় অনেক সাশ্রয়ী।",
    "নিম্ন শব্দ (Low Noise) – ঘুম বা পড়াশোনায় সমস্যা করে না।",
    "অ্যাডজাস্টেবল মিস্ট লেভেল – পানি স্প্রে কম-বেশি করা যায়।",
    "মাল্টিপল স্পিড সেটিংস – নিজের মতো বাতাসের গতি ঠিক করা যায়।",
    "পোর্টেবল ডিজাইন – সহজে এক জায়গা থেকে অন্য জায়গায় নেওয়া যায়।",
  ],
  ctaText: "অর্ডার করতে চাই",
  priceLabel: "অফার মূল্য-",
  currencyText: "টাকা",
  orderTitle: "অর্ডার করতে নিচের ফর্মটি সঠিক ভাবে পুরন করুন।",
};

export const DEMO_OFFER_OPTIONS: LandingOrderOption[] = [
  {
    id: "demo-1",
    productId: 0,
    name: "Mini Air Cooler",
    price: 1150,
    originalPrice: 2300,
    image: "/demo/offer-product.jpg",
    variants: [
      {
        variantId: 1,
        label: "Double Battery",
        price: 1150,
        originalPrice: 2300,
        image: "",
      },
      {
        variantId: 2,
        label: "Single Battery",
        price: 990,
        originalPrice: 1800,
        image: "",
      },
    ],
  },
  {
    id: "demo-2",
    productId: 0,
    name: "Cooling Fan Single Battery",
    price: 890,
    originalPrice: 1600,
    image: "/demo/offer-product.jpg",
  },
];
