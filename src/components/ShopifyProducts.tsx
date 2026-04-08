import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchProducts, type ShopifyProduct } from "@/lib/shopify";
import { useLanguage } from "@/i18n/LanguageContext";
import pillowGrey from "@/assets/product-pillow-grey-new.png";
import pillowBlack from "@/assets/product-pillow-black.webp";
import pillowRed from "@/assets/product-pillow-red.webp";

const COLOR_IMAGES: Record<string, string> = {
  Grey: pillowGrey,
  Black: pillowBlack,
  Red: pillowRed,
};

const COLOR_MAP: Record<string, string> = {
  Grey: "#9CA3AF",
  Black: "#1F2937",
  Red: "#DC2626",
};

const COLORS = Object.keys(COLOR_MAP) as Array<keyof typeof COLOR_MAP>;

interface ProductCardProps {
  product: ShopifyProduct;
  selectedColor: string;
  t: (key: string) => string;
}

const ProductCard = ({ product, selectedColor, t }: ProductCardProps) => {
  const price = product.node.priceRange.minVariantPrice;
  const productUrl = `/product/${product.node.handle}?color=${selectedColor}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.5rem)] max-w-sm"
    >
      <Link to={productUrl}>
        <div className="aspect-square bg-muted/30 flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.img
              key={selectedColor}
              src={COLOR_IMAGES[selectedColor]}
              alt={`${product.node.title} - ${selectedColor}`}
              className="w-full h-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            />
          </AnimatePresence>
        </div>
      </Link>
      <div className="p-5 space-y-3">
        <Link to={productUrl}>
          <h3 className="font-semibold text-foreground text-lg hover:text-gold transition-colors">
            {product.node.title}
          </h3>
        </Link>
        <p className="text-muted-foreground text-sm line-clamp-2">
          {product.node.description}
        </p>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xl font-bold text-foreground">
            ${parseFloat(price.amount).toFixed(2)}
          </span>
          <Link to={productUrl}>
            <motion.span
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gold text-primary-foreground px-5 py-2 rounded-full text-sm font-semibold inline-flex items-center gap-2 shadow-gold-glow"
            >
              {t("products.shopNow")}
              <ArrowRight size={16} />
            </motion.span>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

const ShopifyProducts = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState("Grey");

  useEffect(() => {
    fetchProducts(20)
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <div className="w-8 h-8 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section id="products" className="py-20 gradient-section-warm">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("products.title")}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t("products.empty")}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="products" className="py-20 gradient-section-warm">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-4">
          {t("products.title")}
        </h2>

        {/* Global color selector */}
        <div className="flex items-center justify-center gap-3 mb-12">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all text-sm font-medium ${
                selectedColor === color
                  ? "border-gold bg-gold/10 text-foreground shadow-md scale-105"
                  : "border-border text-muted-foreground hover:border-gold/50 hover:scale-105"
              }`}
            >
              <span
                className="w-4 h-4 rounded-full border border-border/50"
                style={{ backgroundColor: COLOR_MAP[color] }}
              />
              {color}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-8">
          {products.map((product) => (
            <ProductCard
              key={product.node.id}
              product={product}
              selectedColor={selectedColor}
              t={t}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShopifyProducts;
