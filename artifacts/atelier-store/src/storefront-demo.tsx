import { type FormEvent, type ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { products, getProduct, getProducts, type ProductVariant, type StoreCategory, type StoreProduct } from '@/data/products';
import AdminPage from '@/pages/admin';
import { createOrder } from '@workspace/api-client-react';
import type { OrderInput } from '@workspace/api-client-react';
import { useForm } from 'react-hook-form';
import { ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, Check, Instagram, LockKeyhole, Mail, Minus, Plus, ShoppingBag } from 'lucide-react';
import { Link, Route, Switch, useLocation, useParams, Router as WouterRouter } from 'wouter';

const CART_STORAGE_KEY = 'iglifestyles-cart-v2';

type CartLine = {
  id: string;
  productId: string;
  handle: string;
  title: string;
  variantTitle: string;
  size: string;
  image: string;
  quantity: number;
  unitPrice: number;
};

type CartContextValue = {
  items: CartLine[];
  count: number;
  subtotal: number;
  addItem: (product: StoreProduct, variant: ProductVariant) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('Cart is only available inside the storefront.');
  return value;
}

function money(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function SiteHeader() {
  const { count } = useCart();
  return <header className="header">
      <div className="nav-wrap">
        <Link href="/" className="brand brand-mark" aria-label="ig.lifestyles home" data-testid="link-home"><img src={`${import.meta.env.BASE_URL}ig-lifestyles-wordmark.png`} alt="ig. lifestyles" /></Link>
        <nav className="nav-links" aria-label="Main navigation">
          <Link href="/" data-testid="link-nav-home">Home</Link>
          <Link href="/shop" data-testid="link-nav-shop">Shop</Link>
          <Link href="/about" data-testid="link-nav-about">About</Link>
          <Link href="/contact" data-testid="link-nav-contact">Contact</Link>
        </nav>
        <Link href="/cart" className="cart-link" data-testid="link-cart">
          <ShoppingBag size={16} strokeWidth={1.5} />
          <span>Bag{count > 0 ? ` (${count})` : ''}</span>
        </Link>
      </div>
    </header>;
}

function Newsletter() {
  const [message, setMessage] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('Thanks for your interest. Newsletter signup is not connected in this preview.');
    event.currentTarget.reset();
  };

  return <section className="newsletter" data-reveal>
    <span className="eyebrow">A note from ig.lifestyles</span>
    <h2>Only the good things.</h2>
    <p>New arrivals, thoughtful ideas, and a little inspiration for the everyday.</p>
    <form className="newsletter-form" onSubmit={submit}>
      <label className="sr-only" htmlFor="newsletter-email">Email address</label>
      <input id="newsletter-email" type="email" placeholder="Your email address" required autoComplete="email" data-testid="input-newsletter-email" />
      <button type="submit" aria-label="Join the ig.lifestyles newsletter" data-testid="button-newsletter-submit"><ArrowRight size={17} /></button>
    </form>
    {message && <p className="newsletter-message" role="status" data-testid="status-newsletter">{message}</p>}
  </section>;
}

function SiteFooter() {
  return <footer className="footer">
    <div className="footer-brand">
      <Link href="/" className="brand brand-mark" data-testid="footer-link-home"><img src={`${import.meta.env.BASE_URL}ig-lifestyles-wordmark.png`} alt="ig. lifestyles" /></Link>
      <span>Considered clothes for real life.</span>
    </div>
    <nav className="footer-links" aria-label="Footer navigation">
      <Link href="/shop" data-testid="footer-link-shop">Shop</Link>
      <Link href="/about" data-testid="footer-link-about">About</Link>
      <Link href="/contact" data-testid="footer-link-contact">Contact</Link>
    </nav>
    <div className="social-links" aria-label="Social media">
      <a href="https://www.instagram.com/ig.lifestyles/" target="_blank" rel="noreferrer" aria-label="Instagram" data-testid="link-social-instagram"><Instagram size={17} /></a>
    </div>
    <span className="footer-copyright">© ig.lifestyles</span>
  </footer>;
}

function ProductCard({ product }: { product: StoreProduct }) {
  const image = product.images[0];
  const secondImage = product.images[1] ?? image;
  const price = Number(product.variants[0]?.price ?? 0);
  const quickAddVariant = product.variants.find((variant) =>
    variant.selectedOptions.some((option) => option.name === 'Size' && option.value === 'M'),
  ) ?? product.variants[0];
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  return <article className="product-card" data-reveal data-testid={`card-product-${product.id}`}>
    <div className="product-image-wrap">
      <Link href={`/product/${product.handle}`} className="product-image" data-testid={`link-product-${product.handle}`}>
        {image && <img className="product-image-primary" src={image.url} alt={image.altText || product.title} loading="lazy" data-testid={`img-product-${product.id}`} />}
        {secondImage && <img className="product-image-secondary" src={secondImage.url} alt="" loading="lazy" aria-hidden="true" />}
        <span className="product-view-label">View piece <ArrowUpRight size={13} /></span>
      </Link>
      <button type="button" className="product-quick-add" disabled={!quickAddVariant} onClick={() => {
        if (!quickAddVariant) return;
        addItem(product, quickAddVariant);
        setAdded(true);
      }} aria-label={`Add ${product.title} in size M to bag`} data-testid={`button-quick-add-${product.id}`}>
        {added ? <><Check size={14} /> Added</> : <>Add to bag · M <ShoppingBag size={14} /></>}
      </button>
    </div>
    <div className="product-meta">
      <Link href={`/product/${product.handle}`} data-testid={`text-product-title-${product.id}`}>{product.title}</Link>
      <span data-testid={`text-product-price-${product.id}`}>{money(price)}</span>
    </div>
    <div className="product-type" data-testid={`text-product-category-${product.id}`}>{product.productType}</div>
  </article>;
}

function ProductGrid({ items, emptyTitle }: { items: StoreProduct[]; emptyTitle: string }) {
  if (!items.length) {
    return <div className="empty-state" data-testid="status-catalog-empty">
      <span className="eyebrow">A little space for what’s next</span>
      <h2>{emptyTitle}</h2>
      <p>We couldn’t find a piece to match. Try another search or browse the ig.lifestyles collection.</p>
      <Link className="text-link" href="/shop" data-testid="link-empty-reset">Explore the full collection <ArrowRight size={13} /></Link>
    </div>;
  }
  return <div className="product-grid" data-testid="grid-products">{items.map((product) => <ProductCard key={product.id} product={product} />)}</div>;
}

function HomePage() {
  const featured = getProducts({ limit: 4 });
  const categoryTiles: { category: StoreCategory; label: string; image?: string }[] = [
    { category: 'men', label: 'Men’s', image: products[0]?.images[0]?.url },
    { category: 'women', label: 'Women’s' },
    { category: 'kids', label: 'Kids' },
    { category: 'shoes', label: 'Shoes' },
  ];

  return <main className="page">
    <section className="home-hero" data-reveal>
      <div className="hero-copy">
        <span className="eyebrow">A wardrobe, made simpler</span>
        <h1>Wear what<br />feels like you.</h1>
        <p>Thoughtful everyday pieces, made to be worn on repeat. Easy in feel, considered in every detail.</p>
        <Link href="/shop" className="button-dark" data-testid="button-home-shop">Explore the collection <ArrowRight size={15} /></Link>
      </div>
      <span className="hero-caption">A softer kind of everyday</span>
    </section>
    <section className="section category-section" aria-label="Shop by category">
      <div className="category-strip">
        {categoryTiles.map(({ category, label, image }) => <Link
            key={category}
            href={`/shop/${category}`}
            className={`category-tile category-${category}`}
            style={image ? { backgroundImage: `linear-gradient(0deg, rgba(20, 20, 18, .56), rgba(20, 20, 18, .05) 75%), url(${image})` } : undefined}
            data-testid={`tile-category-${category}`}
            data-reveal
          >
            {category !== 'men' && <span className="dropping-badge">Dropping Soon</span>}
            <span className="category-label">{label} <ArrowDownRight size={16} /></span>
          </Link>)}
      </div>
    </section>
    <section className="section">
      <div className="section-heading">
        <div><span className="eyebrow">A good place to begin</span><h2>Find your everyday.</h2></div>
        <Link href="/shop" className="text-link" data-testid="link-home-view-all">Shop all <ArrowUpRight size={13} /></Link>
      </div>
      <p className="intro-copy">Pieces that make getting dressed feel a little more like you.</p>
    </section>
    <section className="section featured-section">
      <div className="section-heading">
        <div><span className="eyebrow">Made to be reached for</span><h2>In the rotation.</h2></div>
        <Link href="/shop" className="text-link" data-testid="link-home-shop-products">Discover all <ArrowRight size={13} /></Link>
      </div>
      <ProductGrid items={featured} emptyTitle="Good things take their time" />
    </section>
    <section className="story-band" data-reveal>
      <div><span className="eyebrow">Less, but better</span><h2>Clothes for the life you’re actually living.</h2><p>ig.lifestyles is a considered wardrobe for the everyday: comfortable, quietly confident pieces that make getting dressed feel a little easier.</p><Link href="/about" className="text-link" data-testid="link-home-our-story">Get to know us <ArrowRight size={13} /></Link></div>
      <div className="story-mark" aria-label="ig. wordmark">ig.</div>
    </section>
    <Newsletter />
  </main>;
}

function ShopPage({ category }: { category?: StoreCategory }) {
  const [search, setSearch] = useState('');
  const items = useMemo(() => getProducts({ category, search, limit: 50 }), [category, search]);
  if (category && category !== 'men') {
    const label = { women: 'Women’s', kids: 'Kids', shoes: 'Shoes' }[category];
    const copy = category === 'kids'
      ? 'Everyday pieces for little lives are on their way.'
      : category === 'shoes'
        ? 'A considered collection of everyday shoes is on its way.'
        : 'A considered women’s collection is on its way.';
    return <main className={`page kids-coming-soon coming-soon-${category}`} data-testid={`status-${category}-dropping-soon`}>
      <span className="eyebrow">A little more time</span>
      <span className="dropping-badge">Dropping Soon</span>
      <h1>{label}</h1>
      <p>{copy}</p>
      <Link href="/shop/men" className="text-link" data-testid={`link-${category}-back-shop`}><ArrowLeft size={13} /> Explore Men’s</Link>
    </main>;
  }
  const title = category === 'men' ? 'Men’s collection' : 'All essentials';
  return <main className="page">
    <section className="catalog-head" data-reveal><span className="eyebrow">The ig.lifestyles collection</span><h1>{title}</h1><p>Easy pieces for every day, thoughtfully chosen for real life. Preview prices are placeholders.</p></section>
    <div className="catalog-tools">
      <nav className="category-pills" aria-label="Shop by category">
        <Link className={`pill ${!category ? 'active' : ''}`} href="/shop" data-testid="filter-category-all">Everything</Link>
        <Link className={`pill ${category === 'men' ? 'active' : ''}`} href="/shop/men" data-testid="filter-category-men">Men</Link>
        <Link className={`pill ${category === 'women' ? 'active' : ''}`} href="/shop/women" data-testid="filter-category-women">Women</Link>
        <Link className={`pill ${category === 'kids' ? 'active' : ''}`} href="/shop/kids" data-testid="filter-category-kids">Kids</Link>
        <Link className={`pill ${category === 'shoes' ? 'active' : ''}`} href="/shop/shoes" data-testid="filter-category-shoes">Shoes</Link>
      </nav>
      <label className="search-wrap"><span className="sr-only">Search the collection</span><input className="search-input" type="search" placeholder="Search the collection" value={search} onChange={(event) => setSearch(event.target.value)} data-testid="input-product-search" /></label>
    </div>
    <ProductGrid items={items} emptyTitle={search ? `No pieces found for “${search}”` : 'A little space for what’s next'} />
  </main>;
}

function ProductPage() {
  const { handle = '' } = useParams<{ handle: string }>();
  const product = getProduct(handle);
  const { addItem } = useCart();
  const [, setLocation] = useLocation();
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);
  useEffect(() => {
    const firstAvailable = product?.variants.find((variant) => variant.availableForSale);
    setSelected(Object.fromEntries((firstAvailable?.selectedOptions ?? []).map(({ name, value }) => [name, value])));
    setActiveImage(0);
    setAdded(false);
  }, [product?.id]);
  const variant = product?.variants.find((candidate) =>
    candidate.availableForSale && candidate.selectedOptions.every((option) => selected[option.name] === option.value),
  );

  if (!product) return <main className="page error-state" data-testid="status-product-not-found"><span className="eyebrow">Not on this rail</span><h2>We couldn’t find that piece.</h2><p>It may have moved on. Browse the collection to find something else.</p><Link className="button-dark" href="/shop" data-testid="link-product-error-shop">Browse the collection <ArrowRight size={14} /></Link></main>;

  const addToBag = () => {
    if (!variant) return;
    addItem(product, variant);
    setAdded(true);
  };
  const buyNow = () => {
    if (!variant) return;
    addItem(product, variant);
    setLocation('/checkout');
  };
  const shownImage = product.images[activeImage] ?? product.images[0];

  return <main className="product-detail">
    <div className="detail-gallery" data-reveal>
      <div className="detail-image">{shownImage && <img src={shownImage.url} alt={shownImage.altText || product.title} data-testid="img-product-detail" />}</div>
      {product.images.length > 1 && <div className="detail-thumbnails" aria-label="More product images">{product.images.map((image, index) => <button type="button" className={activeImage === index ? 'active' : ''} key={image.url} onClick={() => setActiveImage(index)} aria-label={`Show product image ${index + 1}`} data-testid={`button-product-image-${index + 1}`}><img src={image.url} alt="" /></button>)}</div>}
    </div>
    <section className="detail-copy" data-reveal>
      <Link className="text-link" href={`/shop/${product.category}`} data-testid="link-product-back"><ArrowLeft size={13} /> Back to {product.category}</Link>
      <p className="eyebrow detail-category">{product.productType}</p>
      <h1 data-testid="text-product-detail-title">{product.title}</h1>
      <div className="detail-price" data-testid="text-product-detail-price">{money(Number(variant?.price ?? product.variants[0]?.price ?? 0))}</div>
      <p className="detail-description" data-testid="text-product-description">{product.description}</p>
      {product.options.filter((option) => option.values.length > 1).map((option) => <div className="option-block" key={option.name}>
        <span className="option-label">{option.name}{selected[option.name] ? ` · ${selected[option.name]}` : ''}</span>
        <div className="option-values">{option.values.map((value) => {
          const available = product.variants.some((candidate) => candidate.availableForSale && candidate.selectedOptions.some((choice) => choice.name === option.name && choice.value === value));
          return <button key={value} type="button" disabled={!available} aria-pressed={selected[option.name] === value} className={`option-value ${selected[option.name] === value ? 'selected' : ''}`} onClick={() => {
            setSelected((current) => ({ ...current, [option.name]: value }));
            if (option.name === 'Color') setActiveImage(Math.min(option.values.indexOf(value), product.images.length - 1));
            setAdded(false);
          }} data-testid={`button-option-${option.name.toLowerCase()}-${value.toLowerCase().replace(/\s+/g, '-')}`}>
            {option.name === 'Color' && <span className={`color-dot color-${value.toLowerCase().replace(/\s+/g, '-')}`} aria-hidden="true" />}
            {value}
          </button>;
        })}</div>
      </div>)}
      <div className="detail-actions">
        <button className="button-dark detail-add" onClick={addToBag} disabled={!variant} data-testid="button-add-to-bag">{added ? <><Check size={15} /> Added to your bag</> : <>Add to bag <ShoppingBag size={15} /> </>}</button>
        <button className="button-light detail-buy" onClick={buyNow} disabled={!variant} data-testid="button-buy-now">Buy now <ArrowRight size={14} /></button>
      </div>
      <p className="preview-inline-note"><LockKeyhole size={14} /> UPI only. Order payment stays pending until provider verification is connected.</p>
      {added && <Link className="text-link view-bag-link" href="/cart" data-testid="link-view-bag">View your bag <ArrowRight size={13} /></Link>}
    </section>
  </main>;
}

function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  if (!items.length) return <main className="cart-page">
    <h1>Your bag</h1>
    <div className="empty-state" data-testid="status-cart-empty"><span className="eyebrow">A little room for something lovely</span><h2>Your bag is empty.</h2><p>Take a look around and find something that feels like you.</p><Link href="/shop" className="button-dark" data-testid="link-empty-cart-shop">Explore the collection <ArrowRight size={14} /></Link></div>
  </main>;

  const shipping = subtotal >= 3000 ? 0 : 99;
  return <main className="cart-page" data-reveal>
    <h1>Your bag <span className="cart-count">({items.reduce((total, item) => total + item.quantity, 0)})</span></h1>
    <div className="cart-layout">
      <section aria-label="Items in your bag">
        {items.map((item) => <article className="cart-line" key={item.id} data-testid={`row-cart-line-${item.id}`}>
          <Link href={`/product/${item.handle}`}><img src={item.image} alt={item.title} data-testid={`img-cart-line-${item.id}`} /></Link>
          <div className="cart-item-copy">
            <h3 data-testid={`text-cart-line-title-${item.id}`}>{item.title}</h3>
            <p>{item.variantTitle}</p>
            <div className="quantity-control" aria-label={`Quantity for ${item.title}`}>
              <button disabled={item.quantity <= 1} onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label="Decrease quantity" data-testid={`button-quantity-minus-${item.id}`}><Minus size={12} /></button>
              <span data-testid={`text-cart-quantity-${item.id}`}>{item.quantity}</span>
              <button onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label="Increase quantity" data-testid={`button-quantity-plus-${item.id}`}><Plus size={12} /></button>
            </div>
            <button className="remove-button" onClick={() => removeItem(item.id)} data-testid={`button-remove-line-${item.id}`}>Remove</button>
          </div>
          <strong data-testid={`text-cart-line-total-${item.id}`}>{money(item.unitPrice * item.quantity)}</strong>
        </article>)}
        <Link href="/shop" className="text-link" data-testid="link-continue-shopping"><ArrowLeft size={13} /> Continue shopping</Link>
      </section>
      <aside className="summary">
        <h2>Order summary</h2>
        <div className="summary-row"><span>Subtotal</span><strong data-testid="text-cart-subtotal">{money(subtotal)}</strong></div>
        <div className="summary-row"><span>Shipping</span><strong>{shipping === 0 ? 'Complimentary' : money(shipping)}</strong></div>
        <p className="summary-note">Shipping is complimentary on orders over ₹3,000.</p>
        <Link href="/checkout" className="button-dark checkout-button" data-testid="link-preview-checkout">Continue to checkout <ArrowRight size={15} /></Link>
        <p className="preview-inline-note"><LockKeyhole size={14} /> UPI payment only</p>
      </aside>
    </div>
  </main>;
}

type CheckoutValues = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  pin: string;
};

function CheckoutPage() {
  const { items, subtotal } = useCart();
  const [upiNotice, setUpiNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<CheckoutValues>({
    defaultValues: { name: '', email: '', phone: '', address: '', city: '', pin: '' },
  });
  if (!items.length) return <main className="cart-page">
    <h1>Checkout preview</h1><div className="empty-state"><h2>Your bag is empty.</h2><p>Add a piece before continuing.</p><Link href="/shop" className="button-dark" data-testid="link-checkout-shop">Browse the collection <ArrowRight size={14} /></Link></div>
  </main>;
  const shipping = subtotal >= 3000 ? 0 : 99;
  const total = subtotal + shipping;

  const submitOrder = form.handleSubmit(async (values) => {
    setSubmitting(true);
    setUpiNotice('');
    const payload: OrderInput = {
      customerName: values.name.trim(),
      email: values.email.trim(),
      phoneNumber: values.phone.trim(),
      address: values.address.trim(),
      city: values.city.trim(),
      pincode: values.pin.trim(),
      items: items.map((item) => ({
        productId: item.productId,
        size: item.size as OrderInput['items'][number]['size'],
        quantity: item.quantity,
      })),
    };
    try {
      const order = await createOrder(payload);
      setUpiNotice(`Order ${order.orderId} is ready. Payment is pending until your UPI provider confirms it.`);
      window.location.assign(order.upiUrl);
    } catch (error) {
      setUpiNotice(error instanceof Error ? error.message : 'We could not create the order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  });

  return <main className="checkout-page">
    <div className="checkout-heading"><Link href="/cart" className="text-link" data-testid="link-checkout-back"><ArrowLeft size={13} /> Back to your bag</Link><h1>Checkout</h1><p>Enter your delivery details, then continue to your UPI app.</p></div>
    <div className="checkout-layout">
      <Form {...form}>
        <form className="checkout-form" onSubmit={submitOrder} noValidate>
          <section className="checkout-section">
            <span className="eyebrow">01 · Delivery details</span>
            <h2>Where should we send it?</h2>
            <div className="form-grid">
              <FormField control={form.control} name="name" rules={{ required: 'Please enter your name.' }} render={({ field }) => <FormItem className="form-field"><FormLabel>Full name</FormLabel><FormControl><Input {...field} autoComplete="name" placeholder="Your name" data-testid="input-checkout-name" /></FormControl><FormMessage /></FormItem>} />
              <FormField control={form.control} name="email" rules={{ required: 'Please enter your email.', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address.' } }} render={({ field }) => <FormItem className="form-field"><FormLabel>Email address</FormLabel><FormControl><Input {...field} type="email" autoComplete="email" placeholder="you@example.com" data-testid="input-checkout-email" /></FormControl><FormMessage /></FormItem>} />
              <FormField control={form.control} name="phone" rules={{ required: 'Please enter your mobile number.', pattern: { value: /^[6-9]\d{9}$/, message: 'Enter a valid 10-digit Indian mobile number.' } }} render={({ field }) => <FormItem className="form-field"><FormLabel>Mobile number</FormLabel><FormControl><Input {...field} type="tel" inputMode="numeric" autoComplete="tel" placeholder="10-digit number" data-testid="input-checkout-phone" /></FormControl><FormMessage /></FormItem>} />
              <FormField control={form.control} name="address" rules={{ required: 'Please enter a delivery address.' }} render={({ field }) => <FormItem className="form-field form-field-wide"><FormLabel>Address</FormLabel><FormControl><Input {...field} autoComplete="street-address" placeholder="House number and street" data-testid="input-checkout-address" /></FormControl><FormMessage /></FormItem>} />
              <FormField control={form.control} name="city" rules={{ required: 'Please enter your city.' }} render={({ field }) => <FormItem className="form-field"><FormLabel>City</FormLabel><FormControl><Input {...field} autoComplete="address-level2" placeholder="City" data-testid="input-checkout-city" /></FormControl><FormMessage /></FormItem>} />
              <FormField control={form.control} name="pin" rules={{ required: 'Please enter your PIN code.', pattern: { value: /^[1-9][0-9]{5}$/, message: 'Enter a valid 6-digit PIN code.' } }} render={({ field }) => <FormItem className="form-field"><FormLabel>PIN code</FormLabel><FormControl><Input {...field} inputMode="numeric" autoComplete="postal-code" placeholder="6-digit PIN" data-testid="input-checkout-pin" /></FormControl><FormMessage /></FormItem>} />
            </div>
          </section>
          <section className="checkout-section payment-section">
            <span className="eyebrow">02 · UPI</span>
            <h2>Pay via UPI</h2>
            <div className="payment-preview-note"><LockKeyhole size={18} /><div><strong>100% Secure Payment</strong><span>Your UPI app handles payment details. We never ask for your UPI PIN; payment verification is not connected yet.</span></div></div>
          </section>
          <button type="submit" className="button-dark place-preview-order" disabled={submitting} data-testid="button-pay-via-upi">{submitting ? 'Preparing secure UPI checkout…' : <>Pay via UPI <ArrowRight size={15} /></>}</button>
          {upiNotice && <p className="checkout-disclaimer upi-status" role="status" data-testid="status-upi-result">{upiNotice}</p>}
          <p className="checkout-disclaimer">Payment status stays pending until a provider verification callback is connected. We do not collect card, COD, or UPI PIN details.</p>
        </form>
      </Form>
      <aside className="summary checkout-summary">
        <h2>Your order</h2>
        {items.map((item) => <div className="checkout-line" key={item.id}><img src={item.image} alt="" /><div><strong>{item.title}</strong><span>{item.variantTitle} · Qty {item.quantity}</span></div><b>{money(item.unitPrice * item.quantity)}</b></div>)}
        <div className="summary-row"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
        <div className="summary-row"><span>Shipping</span><strong>{shipping ? money(shipping) : 'Complimentary'}</strong></div>
        <div className="summary-row summary-total"><span>Total</span><strong>{money(total)}</strong></div>
        <p className="summary-note">Preview pricing only. Final shipping and tax settings are not configured.</p>
      </aside>
    </div>
  </main>;
}

type ContactValues = { name: string; email: string; message: string };

function ContactPage() {
  const [draftReady, setDraftReady] = useState(false);
  const form = useForm<ContactValues>({ defaultValues: { name: '', email: '', message: '' } });
  return <main className="page">
      <section className="content-page">
      <span className="eyebrow">We’re here to help</span><h1>Let’s talk.</h1>
      <p>Questions about a piece or just want to say hello? Send a note to the ig.lifestyles team. Contact delivery is not connected in this preview.</p>
      <Form {...form}>
        <form className="contact-form" onSubmit={form.handleSubmit(() => setDraftReady(true))}>
          <FormField control={form.control} name="name" rules={{ required: 'Please enter your name.' }} render={({ field }) => <FormItem className="form-field"><FormLabel>Your name</FormLabel><FormControl><Input {...field} autoComplete="name" data-testid="input-contact-name" /></FormControl><FormMessage /></FormItem>} />
          <FormField control={form.control} name="email" rules={{ required: 'Please enter your email.', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address.' } }} render={({ field }) => <FormItem className="form-field"><FormLabel>Email address</FormLabel><FormControl><Input {...field} type="email" autoComplete="email" data-testid="input-contact-email" /></FormControl><FormMessage /></FormItem>} />
          <FormField control={form.control} name="message" rules={{ required: 'Please add a message.' }} render={({ field }) => <FormItem className="form-field"><FormLabel>Your message</FormLabel><FormControl><textarea {...field} className="contact-textarea" data-testid="input-contact-message" /></FormControl><FormMessage /></FormItem>} />
          <button type="submit" className="button-dark" data-testid="button-contact-send">Prepare message <Mail size={14} /></button>
          {draftReady && <p className="status-note" role="status" data-testid="status-contact-ready">Your message is ready. Contact delivery will be available when the store is connected.</p>}
        </form>
      </Form>
    </section>
  </main>;
}

function AboutPage() {
  return <main className="page">
    <section className="content-page" data-reveal><span className="eyebrow">The ig.lifestyles point of view</span><h1>A little less to think about.</h1>
      <p>Getting dressed shouldn’t ask too much of you. ig.lifestyles brings together the pieces you reach for again and again: comfortable essentials with a thoughtful eye for fit, feel, and the small details that make everyday dressing easier.</p>
      <p>We believe a wardrobe works best when it reflects the people who wear it. That means room for different ages, different days, and all the in-between moments that make a life.</p>
      <div className="story-mark" style={{ margin: '45px 0' }}>ig.</div><span className="eyebrow">Considered, never complicated</span>
      <p>Our collection is built around a simple idea: buy what you love, wear it often, and let the rest be quiet. We’re glad you’re here.</p>
      <Link className="button-dark" href="/shop" data-testid="button-about-shop">Find your everyday <ArrowRight size={14} /></Link>
    </section>
  </main>;
}

function StoreLayout({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed.filter((item): item is CartLine =>
            typeof item?.id === 'string'
            && typeof item?.productId === 'string'
            && typeof item?.handle === 'string'
            && typeof item?.title === 'string'
            && typeof item?.variantTitle === 'string'
            && typeof item?.size === 'string'
            && typeof item?.image === 'string'
            && Number.isInteger(item?.quantity)
            && typeof item?.unitPrice === 'number',
          ));
        }
      }
    } catch {
      localStorage.removeItem(CART_STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [hydrated, items]);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('[data-reveal]').forEach((element) => element.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('[data-reveal]').forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [location, hydrated]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: items.reduce((total, item) => total + item.unitPrice * item.quantity, 0),
    addItem: (product, variant) => {
      const id = `${product.id}:${variant.id}`;
      const existing = items.find((item) => item.id === id);
      const line: CartLine = {
        id,
        productId: product.id,
        handle: product.handle,
        title: product.title,
        variantTitle: variant.selectedOptions.map((option) => option.value).join(' · ') || variant.title,
        size: variant.selectedOptions.find((option) => option.name === 'Size')?.value ?? 'M',
        image: product.images[0]?.url ?? '',
        quantity: (existing?.quantity ?? 0) + 1,
        unitPrice: Number(variant.price),
      };
      setItems((current) => current.some((item) => item.id === id)
        ? current.map((item) => item.id === id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...current, line]);
    },
    updateQuantity: (id, quantity) => setItems((current) => current.map((item) => item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item)),
    removeItem: (id) => setItems((current) => current.filter((item) => item.id !== id)),
    clear: () => setItems([]),
  }), [items]);

  return <CartContext.Provider value={value}><div className="site-shell"><SiteHeader />{children}<SiteFooter /></div></CartContext.Provider>;
}

function Router() {
  const [location] = useLocation();
  if (location === '/admin' || location.startsWith('/admin/')) return <AdminPage />;
  return <StoreLayout><Switch>
    <Route path="/" component={HomePage} />
    <Route path="/shop" component={() => <ShopPage />} />
    <Route path="/shop/men" component={() => <ShopPage category="men" />} />
    <Route path="/shop/women" component={() => <ShopPage category="women" />} />
    <Route path="/shop/kids" component={() => <ShopPage category="kids" />} />
    <Route path="/shop/shoes" component={() => <ShopPage category="shoes" />} />
    <Route path="/product/:handle" component={ProductPage} />
    <Route path="/cart" component={CartPage} />
    <Route path="/checkout" component={CheckoutPage} />
    <Route path="/about" component={AboutPage} />
    <Route path="/contact" component={ContactPage} />
    <Route component={NotFound} />
  </Switch></StoreLayout>;
}

function NotFound() {
  return <main className="page error-state"><span className="eyebrow">A wrong turn</span><h2>We couldn’t find that page.</h2><p>Let’s get you back to the collection.</p><Link className="button-dark" href="/" data-testid="link-not-found-home">Back home <ArrowRight size={14} /></Link></main>;
}

export default function StorefrontDemo() {
  return <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter>;
}
