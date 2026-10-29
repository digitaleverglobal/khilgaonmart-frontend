"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import { categoryHref } from "@/lib/storeNav";
import { productHref } from "@/lib/productUrl";
import type { Product } from "@/data/products";
import styles from "./CategoryHero.module.css";

interface CategoryHeroProps {
  menu: string;
  sub?: string;
  child?: string;
  /** The category's own image from the admin, shown on the left. */
  imageUrl?: string | null;
  /** Products of this category; their images rotate in the carousel. */
  products: Product[];
}

const SLIDE_MS = 3500;

// Category page header: title, breadcrumb and a rotating strip of the category's products.
export default function CategoryHero({ menu, sub, child, imageUrl, products }: CategoryHeroProps) {
  const slides = products.filter((product) => product.image && product.image !== "/placeholder.jpg").slice(0, 8);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const current = slides.length ? active % slides.length : 0;

  useEffect(() => {
    if (slides.length < 2 || paused) return undefined;
    const timer = window.setInterval(() => setActive((index) => index + 1), SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [slides.length, paused]);

  const title = child || sub || menu;
  const crumbs = [
    { label: "Home", href: "/" },
    { label: menu, href: categoryHref(menu) },
    ...(sub ? [{ label: sub, href: categoryHref(menu, sub) }] : []),
    ...(sub && child ? [{ label: child, href: categoryHref(menu, sub, child) }] : []),
  ];

  const breadcrumb = (
    <nav className={styles.crumbs} aria-label="Breadcrumb">
      {crumbs.map((crumb, index) => {
        const last = index === crumbs.length - 1;
        return (
          <span key={crumb.href} className={styles.crumb}>
            {last ? (
              <span className={styles.crumbCurrent}>{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className={styles.crumbLink}>
                {index === 0 ? "⌂ " : ""}
                {crumb.label}
              </Link>
            )}
            {!last && <span className={styles.crumbSep}>›</span>}
          </span>
        );
      })}
    </nav>
  );

  return (
    <section className={styles.hero}>
      <span className={`${styles.blob} ${styles.blobLeft}`} aria-hidden="true" />
      <span className={`${styles.blob} ${styles.blobRight}`} aria-hidden="true" />
      <span className={styles.dots} aria-hidden="true" />

      <div className={styles.side}>
        {imageUrl && (
          <div className={styles.categoryImage}>
            <SafeImage sources={[imageUrl]} alt={menu} fill sizes="200px" className={styles.contain} />
          </div>
        )}
      </div>

      <div className={styles.center}>
        <h1 className={styles.title}>{title}</h1>
        {breadcrumb}
        <span className={styles.count}>{products.length} টি পণ্য</span>
      </div>

      <div className={styles.side} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        {slides.length > 0 && (
          <div className={styles.carousel}>
            {slides.map((product, index) => (
              <Link
                key={product.id}
                href={productHref(product)}
                className={`${styles.slide} ${index === current ? styles.slideActive : ""}`}
                aria-hidden={index !== current}
                tabIndex={index === current ? 0 : -1}
              >
                <span className={styles.slideImage}>
                  <SafeImage sources={[product.image, ...(product.gallery || [])]} alt={product.name} fill sizes="220px" className={styles.contain} />
                </span>
                <span className={styles.slideName}>{product.name}</span>
              </Link>
            ))}
            {slides.length > 1 && (
              <div className={styles.dotsNav}>
                {slides.map((product, index) => (
                  <button
                    key={product.id}
                    type="button"
                    aria-label={`Slide ${index + 1}`}
                    onClick={() => setActive(index)}
                    className={`${styles.dot} ${index === current ? styles.dotActive : ""}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
