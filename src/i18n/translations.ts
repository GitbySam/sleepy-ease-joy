export type Lang = "en";

// Helper to strip fr/es from existing entries
type EnOnly = { en: string };

export const translations: Record<string, EnOnly> = {
  // Header
  "nav.products": { en: "Products" },
  "nav.benefits": { en: "Benefits" },
  "nav.results": { en: "Results" },
  "nav.reviews": { en: "Reviews" },
  "nav.faq": { en: "FAQ" },
  "nav.shopNow": { en: "Shop Now" },
  "header.marquee": { en: "Limited Offer -50% \u00a0•\u00a0 Free Shipping \u00a0•\u00a0 Secure Payment" },

  // Hero
  "hero.subtitle": { en: "The anti-embarrassment travel pillow" },
  "hero.title1": { en: "Drool-free. Lean-free." },
  "hero.title2": { en: "Shame-free." },
  "hero.desc": { en: "Sleepzy holds your head upright while you sleep — no awkward leaning, no drool disasters, no stranger's shoulder." },
  "hero.cta": { en: "Shop Now — 50% OFF" },
  "hero.price.from": { en: "From" },
  "hero.reviews": { en: "2,000+ Happy Sleepers" },

  // Marquee
  "marquee.no_drool": { en: "No More Drool" },
  "marquee.no_lean": { en: "No Leaning" },
  "marquee.no_shame": { en: "No Shame" },
  "marquee.360_support": { en: "360° Support" },
  "marquee.travel_ready": { en: "Travel-Ready" },
  "marquee.washable": { en: "Washable" },

  // Comparison / Problem
  "comparison.badge": { en: "We've All Been There" },
  "comparison.title": { en: "The problem with falling asleep in public" },
  "comparison.without": { en: "Without Sleepzy" },
  "comparison.with": { en: "With Sleepzy" },

  // In Action
  "inAction.badge": { en: "Sleep with dignity. Everywhere." },
  "inAction.title": { en: "Works anywhere you sit" },
  "inAction.plane": { en: "On the plane" },
  "inAction.train": { en: "On the train" },
  "inAction.car": { en: "In the car" },
  "inAction.planeDesc": { en: "No leaning on strangers. No neck cramps at 35,000 feet." },
  "inAction.trainDesc": { en: "Sleep through your commute — and still look composed." },
  "inAction.carDesc": { en: "Passenger seat naps, upgraded. No head-bobbing." },

  // Benefits
  "benefits.badge": { en: "Why Sleepzy?" },
  "benefits.title": { en: "Designed to solve every travel sleep nightmare" },
  "benefits.upright.title": { en: "Keeps You Upright" },
  "benefits.upright.desc": { en: "360° support prevents head drop. No more awkward leaning or neck strain." },
  "benefits.nodrool.title": { en: "No Drool Disasters" },
  "benefits.nodrool.desc": { en: "Chin support keeps your mouth closed. Wake up dignified." },
  "benefits.portable.title": { en: "Ultra-Portable" },
  "benefits.portable.desc": { en: "Compact & lightweight. Fits in any carry-on, backpack or tote." },
  "benefits.washable.title": { en: "Machine Washable" },
  "benefits.washable.desc": { en: "Removable cover, easy to clean. Always fresh for your next trip." },
  "benefits.universal.title": { en: "Universal Fit" },
  "benefits.universal.desc": { en: "Adjustable design fits all neck sizes comfortably." },
  "benefits.premium.title": { en: "Premium Memory Foam" },
  "benefits.premium.desc": { en: "Soft yet supportive. Adapts to your unique shape." },

  // CTA Bridge
  "ctaBridge.title": { en: "Ready to sleep without embarrassment?" },
  "ctaBridge.desc": { en: "Join 2,000+ travelers who've upgraded their sleep game. Free shipping on every order." },
  "ctaBridge.cta": { en: "Get Sleepzy — 50% OFF" },
  "ctaBridge.savings": { en: "you save 50%" },

  // Testimonials
  "testimonials.badge": { en: "Real Reviews" },
  "testimonials.title": { en: "Join 2,000+ happy sleepers" },

  // FAQ
  "faq.badge": { en: "Got Questions?" },
  "faq.title": { en: "Everything you need to know" },
  "faq.q1": { en: "How does Sleepzy keep my head upright?" },
  "faq.a1": { en: "Sleepzy uses a 360° ergonomic support system with premium memory foam that cradles your neck from all angles, preventing your head from dropping forward or sideways." },
  "faq.q2": { en: "Is it comfortable for long flights?" },
  "faq.a2": { en: "Absolutely. The memory foam adapts to your neck shape and the breathable fabric prevents overheating, even on 12+ hour flights." },
  "faq.q3": { en: "Can I wash it?" },
  "faq.a3": { en: "Yes! The outer cover is removable and machine washable. We recommend washing it after every few trips." },
  "faq.q4": { en: "Will it fit in my carry-on?" },
  "faq.a4": { en: "Sleepzy is designed to be ultra-portable. It compresses to half its size and fits easily in any carry-on, backpack, or tote bag." },
  "faq.q5": { en: "What if it doesn't fit my neck?" },
  "faq.a5": { en: "Sleepzy features an adjustable design with a secure clasp system that fits neck sizes from 12\" to 18\" comfortably." },
  "faq.q6": { en: "What's your return policy?" },
  "faq.a6": { en: "We offer a 30-day satisfaction guarantee. If you're not happy with your Sleepzy, return it for a full refund — no questions asked." },

  // Footer
  "footer.tagline": { en: "Sleep anywhere. Without the shame." },
  "footer.shop": { en: "Shop" },
  "footer.support": { en: "Support" },
  "footer.legal": { en: "Legal" },
  "footer.products": { en: "All Products" },
  "footer.bundle": { en: "Bundle & Save" },
  "footer.reviews": { en: "Reviews" },
  "footer.contact": { en: "Contact Us" },
  "footer.shipping": { en: "Shipping Info" },
  "footer.returns": { en: "Returns" },
  "footer.terms": { en: "Terms" },
  "footer.privacy": { en: "Privacy" },
  "footer.rights": { en: "All rights reserved." },
  "footer.disclaimer": { en: "Results may vary. Sleepzy is designed for seated sleeping support." },

  // Bundle
  "bundle.badge": { en: "Most Popular" },
  "bundle.title": { en: "Bundle & Save" },
  "bundle.single": { en: "Single Sleepzy" },
  "bundle.duo": { en: "Duo Pack" },
  "bundle.family": { en: "Family Pack" },
  "bundle.save": { en: "Save" },
  "bundle.addToCart": { en: "Add to Cart" },
  "bundle.bestValue": { en: "Best Value" },
  "bundle.freeShipping": { en: "Free Shipping" },

  // Product page
  "product.back": { en: "Back" },
  "product.reviews": { en: "reviews" },
  "product.price.now": { en: "Now" },
  "product.price.was": { en: "Was" },
  "product.addToCart": { en: "Add to Cart" },
  "product.buyNow": { en: "Buy Now" },
  "product.freeShipping": { en: "Free Shipping" },
  "product.guarantee": { en: "30-Day Guarantee" },
  "product.secure": { en: "Secure Checkout" },
  "product.description": { en: "Description" },
  "product.shipping": { en: "Shipping" },
  "product.returnPolicy": { en: "Returns" },

  // Trust
  "trust.shipping": { en: "Free Shipping" },
  "trust.guarantee": { en: "30-Day Guarantee" },
  "trust.secure": { en: "Secure Payment" },
  "trust.customers": { en: "2,000+ Customers" },

  // Inactivity popup
  "inactivity.title": { en: "Still thinking?" },
  "inactivity.desc": { en: "Your 50% discount expires soon. Don't miss out!" },
  "inactivity.cta": { en: "Claim My 50% OFF" },
  "inactivity.dismiss": { en: "No thanks" },

  // Upsell
  "upsell.title": { en: "Great choice!" },
  "upsell.desc": { en: "Add a second Sleepzy for your travel buddy and save an extra 15%." },
  "upsell.cta": { en: "Add Duo Pack" },
  "upsell.dismiss": { en: "Just one, thanks" },

  // Social proof toasts
  "toast.purchased": { en: "just purchased Sleepzy" },
  "toast.timeAgo": { en: "minutes ago" },

  // Stock
  "product.lowStock": { en: "Low Stock — Only 8 left" },
  "product.inStock": { en: "In Stock" },
};

export type TranslationKey = keyof typeof translations;
