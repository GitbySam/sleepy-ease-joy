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
