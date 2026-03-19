import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchProducts, type ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";

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
            Our Products
          </h2>
          <p className="text-muted-foreground text-lg">
            No products available at the moment. Check back soon!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="products" className="py-20 gradient-section-warm">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
          Our Products
        </h2>
        <div className="flex flex-wrap justify-center gap-8">
          {products.map((product) => {
            const image = product.node.images.edges[0]?.node;
            const price = product.node.priceRange.minVariantPrice;
            return (
              <motion.div
                key={product.node.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.5rem)] max-w-sm"
              >
                <Link to={`/product/${product.node.handle}`}>
                  <div className="aspect-square bg-muted/30 flex items-center justify-center overflow-hidden">
                    {image ? (
                      <img
                        src={image.url}
                        alt={image.altText || product.node.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-muted-foreground text-sm">No image</span>
                    )}
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
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xl font-bold text-foreground">
                      {parseFloat(price.amount).toFixed(2).replace(".", ",")} {price.currencyCode === "EUR" ? "€" : price.currencyCode}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAddToCart(product)}
                      disabled={isLoading}
                      className="bg-gold text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-gold-glow disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <ShoppingBag size={16} />
                      )}
                      Add
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ShopifyProducts;
