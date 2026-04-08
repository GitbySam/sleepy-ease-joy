import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchProducts, type ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
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
  onAddToCart: (product: ShopifyProduct) => void;
  isLoading: boolean;
  t: (key: string) => string;
}

const ProductCard = ({ product, onAddToCart, isLoading, t }: ProductCardProps) => {
  const [selectedColor, setSelectedColor] = useState("Grey");
  const price = product.node.priceRange.minVariantPrice;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.5rem)] max-w-sm"
    >
      <Link to={`/product/${product.node.handle}`}>
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
        <Link to={`/product/${product.node.handle}`}>
          <h3 className="font-semibold text-foreground text-lg hover:text-gold transition-colors">
            {product.node.title}
          </h3>
        </Link>
        <p className="text-muted-foreground text-sm line-clamp-2">
          {product.node.description}
        </p>

        {/* Color selector */}
        <div className="flex items-center gap-2">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={(e) => {
                e.preventDefault();
                setSelectedColor(color);
              }}
              className={`w-7 h-7 rounded-full border-2 transition-all ${
                selectedColor === color
                  ? "border-gold scale-110 shadow-md"
                  : "border-border hover:scale-105"
              }`}
              style={{ backgroundColor: COLOR_MAP[color] }}
              title={color}
            />
          ))}
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xl font-bold text-foreground">
            {parseFloat(price.amount).toFixed(2).replace(".", ",")} {price.currencyCode === "EUR" ? "€" : price.currencyCode}
          </span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onAddToCart(product)}
            disabled={isLoading}
            className="bg-gold text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-gold-glow disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ShoppingBag size={16} />
            )}
            {t("products.add")}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

const ShopifyProducts = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);

  useEffect(() => {
    fetchProducts(20)
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleAddToCart = async (product: ShopifyProduct) => {
    const variant = product.node.variants.edges[0]?.node;
    if (!variant) return;
    await addItem({
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions || [],
    });
    toast.success(`${product.node.title} ${t("products.addedToCart")}`);
  };

  if (loading) {
    return (
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
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
        <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
          {t("products.title")}
        </h2>
        <div className="flex flex-wrap justify-center gap-8">
          {products.map((product) => (
            <ProductCard key={product.node.id} product={product} onAddToCart={handleAddToCart} isLoading={isLoading} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShopifyProducts;
