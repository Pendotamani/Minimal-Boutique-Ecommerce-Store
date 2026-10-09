import { createContext, type FormEvent, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  getGetStoreCartQueryKey,
  useAddStoreCartLine,
  useCreateStoreCart,
  useGetStoreCart,
  useGetStoreProduct,
  useGetStoreProducts,
  useRemoveStoreCartLine,
  useUpdateStoreCartLine,
} from '@workspace/api-client-react';
import type { StoreCart, StoreProduct } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, Check, LoaderCircle, Minus, Plus, ShoppingBag } from 'lucide-react';
import { Link, Route, Switch, useLocation, useParams, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();
const CART_STORAGE_KEY = 'atelier-shopify-cart-id';
type CartContextValue = { cartId: string | null; setCartId: (id: string | null) => void };
const CartContext = createContext<CartContextValue>({ cartId: null, setCartId: () => undefined });

function money(value: string | number | undefined, currency = 'USD') {
  const amount = Number(value ?? 0);
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number.isFinite(amount) ? amount : 0);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function useCartContext() {
  return useContext(CartContext);
}

function SiteHeader() {
  const { cartId } = useCartContext();
  const [count, setCount] = useState(0);
  const { data: cart } = useGetStoreCart(cartId ?? '', { query: { enabled: Boolean(cartId), queryKey: getGetStoreCartQueryKey(cartId ?? '') } });
  useEffect(() => { if (cart) setCount(cart.totalQuantity); }, [cart]);
  return <>
    <div className="announcement">Thoughtful essentials, made for every day</div>
    <header className="header">
      <div className="nav-wrap">
        <Link href="/" className="brand" data-testid="link-home">atelier</Link>
        <nav className="nav-links" aria-label="Main navigation">
          <Link href="/shop/men" data-testid="link-shop-men">Men</Link>
          <Link href="/shop/women" data-testid="link-shop-women">Women</Link>
          <Link href="/shop/kids" data-testid="link-shop-kids">Kids</Link>
          <Link href="/about" data-testid="link-about">Our story</Link>
        </nav>
        <div className="nav-actions">
          <Link href="/shop" data-testid="link-all-shop">Shop all</Link>
          <Link href="/cart" className="cart-link" data-testid="link-cart"><ShoppingBag size={16} strokeWidth={1.5} /><span>Bag{count > 0 ? ` (${count})` : ''}</span></Link>
        </div>
      </div>
      <nav className="mobile-nav" aria-label="Browse categories">
        <Link href="/shop/men" data-testid="mobile-link-men">Men</Link>
        <Link href="/shop/women" data-testid="mobile-link-women">Women</Link>
        <Link href="/shop/kids" data-testid="mobile-link-kids">Kids</Link>
        <Link href="/about" data-testid="mobile-link-about">About</Link>
      </nav>
    </header>
  </>;
}

function SiteFooter() {
  return <footer className="footer">
    <Link href="/" className="brand" data-testid="footer-link-home">atelier</Link>
    <span>Considered clothes for real life.</span>
    <nav className="footer-links" aria-label="Footer navigation">
      <Link href="/shop" data-testid="footer-link-shop">Shop</Link>
      <Link href="/about" data-testid="footer-link-about">About</Link>
      <Link href="/contact" data-testid="footer-link-contact">Contact</Link>
    </nav>
    <span>© Atelier</span>
  </footer>;
}

function ProductCard({ product }: { product: StoreProduct }) {
  const image = product.images?.[0];
  const variant = product.variants?.find((item) => item.availableForSale) ?? product.variants?.[0];
  return <article className="product-card" data-testid={`card-product-${product.id}`}>
    <Link href={`/product/${product.handle}`} className="product-image" data-testid={`link-product-${product.handle}`}>
      {image?.url ? <img src={image.url} alt={image.altText || product.title} loading="lazy" data-testid={`img-product-${product.id}`} /> : <div className="image-placeholder" aria-label="Product image unavailable">A</div>}
    </Link>
    <div className="product-meta">
      <Link href={`/product/${product.handle}`} data-testid={`text-product-title-${product.id}`}>{product.title}</Link>
      <span data-testid={`text-product-price-${product.id}`}>{variant ? money(variant.price, variant.currencyCode) : '—'}</span>
    </div>
    <div className="product-type" data-testid={`text-product-category-${product.id}`}>{product.productType || 'Everyday essentials'}</div>
  </article>;
}

function ProductGrid({ products, loading, error, retry, emptyTitle = 'Nothing here just yet' }: {
  products?: StoreProduct[]; loading?: boolean; error?: boolean; retry?: () => void; emptyTitle?: string;
}) {
  if (loading) return <div className="product-grid" aria-label="Loading products" data-testid="status-products-loading">{[1, 2, 3, 4].map((n) => <div className="skeleton" key={n} />)}</div>;
  if (error) return <div className="error-state" role="alert" data-testid="status-products-error"><span className="eyebrow">A small pause</span><h2>We couldn’t load the collection.</h2><p>Please try again in a moment.</p><button className="button-dark" onClick={retry} data-testid="button-retry-products">Try again</button></div>;
  if (!products?.length) return <div className="empty-state" data-testid="status-catalog-empty"><span className="eyebrow">The rails are clear</span><h2>{emptyTitle}</h2><p>Our collection is being carefully prepared. Check back soon, or explore another part of Atelier.</p><Link className="text-link" href="/about" data-testid="link-empty-about">A little about us <ArrowRight size={13} /></Link></div>;
  return <div className="product-grid" data-testid="grid-products">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>;
}

function HomePage() {
  const query = useGetStoreProducts({ limit: 4 });
  return <main className="page">
    <section className="home-hero">
      <div className="hero-copy">
        <span className="eyebrow">A wardrobe, made simpler</span>
        <h1>Wear what<br />feels like you.</h1>
        <p>Thoughtful everyday pieces for the whole family. Easy to wear, considered in every detail, and made to stay in rotation.</p>
        <Link href="/shop" className="button-dark" data-testid="button-home-shop">Explore the collection <ArrowRight size={15} /></Link>
      </div>
      <div className="hero-art" role="img" aria-label="Softly layered neutral wardrobe forms">
        <span className="art-sun" /><span className="art-caption">A softer kind of everyday</span>
      </div>
    </section>
    <section className="section">
      <div className="section-heading"><div><span className="eyebrow">A good place to begin</span><h2>Find your everyday.</h2></div><Link href="/shop" className="text-link" data-testid="link-home-view-all">Shop all <ArrowUpRight size={13} /></Link></div>
      <div className="category-strip">
        <Link href="/shop/men" className="category-tile" data-testid="tile-category-men"><span>For him <ArrowDownRight size={16} /></span></Link>
        <Link href="/shop/women" className="category-tile" data-testid="tile-category-women"><span>For her <ArrowDownRight size={16} /></span></Link>
        <Link href="/shop/kids" className="category-tile" data-testid="tile-category-kids"><span>For little ones <ArrowDownRight size={16} /></span></Link>
      </div>
    </section>
    <section className="section" style={{ paddingTop: 8 }}>
      <div className="section-heading"><div><span className="eyebrow">Made to be reached for</span><h2>In the rotation</h2></div><Link href="/shop" className="text-link" data-testid="link-home-shop-products">Discover all <ArrowRight size={13} /></Link></div>
      <ProductGrid products={query.data} loading={query.isLoading} error={query.isError} retry={() => void query.refetch()} emptyTitle="Good things take their time" />
    </section>
    <section className="story-band">
      <div><span className="eyebrow">Less, but better</span><h2>Clothes for the life you’re actually living.</h2><p>Atelier is a considered wardrobe for the everyday: comfortable, quietly confident pieces that make getting dressed feel a little easier.</p><Link href="/about" className="text-link" data-testid="link-home-our-story">Get to know us <ArrowRight size={13} /></Link></div>
      <div className="story-mark" aria-label="Atelier monogram">a.</div>
    </section>
    <section className="newsletter"><span className="eyebrow">A note from Atelier</span><h2>Only the good things.</h2><p>New arrivals, thoughtful ideas, and a little inspiration for the everyday.</p><Link href="/contact" className="text-link" data-testid="link-home-contact">Say hello <ArrowRight size={13} /></Link></section>
  </main>;
}

function ShopPage({ category }: { category?: 'men' | 'women' | 'kids' }) {
  const [search, setSearch] = useState('');
  const params = useMemo(() => ({ ...(category ? { category } : {}), ...(search.trim() ? { search: search.trim() } : {}), limit: 50 }), [category, search]);
  const query = useGetStoreProducts(params);
  const title = category ? `${category[0].toUpperCase()}${category.slice(1)}` : 'All essentials';
  return <main className="page">
    <section className="catalog-head"><span className="eyebrow">The Atelier collection</span><h1>{title}</h1><p>Easy pieces for every day, thoughtfully chosen for the whole family.</p></section>
    <div className="catalog-tools">
      <nav className="category-pills" aria-label="Shop by category">
        <Link className={`pill ${!category ? 'active' : ''}`} href="/shop" data-testid="filter-category-all">Everything</Link>
        <Link className={`pill ${category === 'men' ? 'active' : ''}`} href="/shop/men" data-testid="filter-category-men">Men</Link>
        <Link className={`pill ${category === 'women' ? 'active' : ''}`} href="/shop/women" data-testid="filter-category-women">Women</Link>
        <Link className={`pill ${category === 'kids' ? 'active' : ''}`} href="/shop/kids" data-testid="filter-category-kids">Kids</Link>
      </nav>
      <label><span className="sr-only">Search the collection</span><input className="search-input" type="search" placeholder="Search the collection" value={search} onChange={(event) => setSearch(event.target.value)} data-testid="input-product-search" /></label>
    </div>
    <ProductGrid products={query.data} loading={query.isLoading} error={query.isError} retry={() => void query.refetch()} emptyTitle={search ? `No pieces found for “${search}”` : 'A little space for what’s next'} />
  </main>;
}

function ProductPage() {
  const params = useParams<{ handle: string }>();
  const handle = params.handle || '';
  const query = useGetStoreProduct(handle);
  const { cartId, setCartId } = useCartContext();
  const createCart = useCreateStoreCart();
  const addLine = useAddStoreCartLine();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [added, setAdded] = useState(false);
  const product = query.data;
  useEffect(() => { setSelected({}); setMessage(''); setAdded(false); }, [handle]);
  const variant = useMemo(() => {
    if (!product?.variants?.length) return undefined;
    const available = product.variants.filter((candidate) => candidate.availableForSale);
    const matching = available.find((candidate) => candidate.selectedOptions.every((option) => selected[option.name] === option.value));
    return matching ?? (Object.keys(selected).length ? undefined : available[0]);
  }, [product, selected]);
  const choose = (optionName: string, value: string) => setSelected((current) => ({ ...current, [optionName]: value }));
  const addToBag = () => {
    if (!variant) return;
    setMessage('');
    const onSuccess = (cart: StoreCart) => {
      setCartId(cart.id);
      queryClient.setQueryData(getGetStoreCartQueryKey(cart.id), cart);
      setAdded(true);
    };
    if (cartId) addLine.mutate({ cartId, data: { merchandiseId: variant.id, quantity: 1 } }, { onSuccess, onError: () => setMessage('We couldn’t update your bag. Please try again.') });
    else createCart.mutate({ data: { merchandiseId: variant.id, quantity: 1 } }, { onSuccess, onError: () => setMessage('We couldn’t start your bag. Please try again.') });
  };
  if (query.isLoading) return <main className="product-detail" data-testid="status-product-loading"><div className="skeleton" /><div className="skeleton" /></main>;
  if (query.isError || !product) return <main className="error-state" role="alert" data-testid="status-product-error"><span className="eyebrow">Not on this rail</span><h2>We couldn’t find that piece.</h2><p>It may have moved on. Browse our current collection instead.</p><Link className="button-dark" href="/shop" data-testid="link-product-error-shop">Browse the collection <ArrowRight size={14} /></Link></main>;
  const image = product.images?.[0];
  const busy = createCart.isPending || addLine.isPending;
  return <main className="product-detail">
    <div className="detail-image">{image?.url ? <img src={image.url} alt={image.altText || product.title} data-testid="img-product-detail" /> : <div className="image-placeholder">A</div>}</div>
    <section className="detail-copy">
      <Link className="text-link" href="/shop" data-testid="link-product-back"><ArrowLeft size={13} /> Back to the collection</Link>
      <p className="eyebrow" style={{ marginTop: 28 }}>{product.productType || 'Atelier everyday'}</p>
      <h1 data-testid="text-product-detail-title">{product.title}</h1>
      <div className="detail-price" data-testid="text-product-detail-price">{variant ? money(variant.price, variant.currencyCode) : 'Choose an available option'}</div>
      <p className="detail-description" data-testid="text-product-description">{product.description || 'A thoughtful everyday piece, chosen for comfort and made to find its way into your regular rotation.'}</p>
      {product.options?.filter((option) => option.values.length && !(option.values.length === 1 && option.values[0] === 'Default Title')).map((option) => <div className="option-block" key={option.name}>
        <span className="option-label">{option.name}{selected[option.name] ? ` · ${selected[option.name]}` : ''}</span>
        <div className="option-values">{option.values.map((value) => {
          const matching = product.variants.find((candidate) => candidate.selectedOptions.some((choice) => choice.name === option.name && choice.value === value) && candidate.availableForSale);
          return <button key={value} type="button" disabled={!matching} aria-pressed={selected[option.name] === value} className={`option-value ${selected[option.name] === value ? 'selected' : ''}`} onClick={() => choose(option.name, value)} data-testid={`button-option-${option.name.toLowerCase().replace(/\s+/g, '-')}-${value.toLowerCase().replace(/\s+/g, '-')}`}>{value}</button>;
        })}</div>
      </div>)}
      <button className="button-dark detail-add" onClick={addToBag} disabled={!variant || busy} data-testid="button-add-to-bag">{busy ? <><LoaderCircle size={15} /> Adding</> : added ? <><Check size={15} /> Added to your bag</> : <>Add to bag <ArrowRight size={15} /></>}</button>
      {message && <p className="inline-message" role="alert" data-testid="status-add-to-bag-error">{message}</p>}
      <p className="product-type" style={{ marginTop: 17 }}>Secure checkout is completed on Shopify.</p>
      {added && <Link className="text-link" href="/cart" data-testid="link-view-bag">View your bag <ArrowRight size={13} /></Link>}
    </section>
  </main>;
}

function CartPage() {
  const { cartId, setCartId } = useCartContext();
  const query = useGetStoreCart(cartId ?? '', { query: { enabled: Boolean(cartId), queryKey: getGetStoreCartQueryKey(cartId ?? '') } });
  const update = useUpdateStoreCartLine();
  const remove = useRemoveStoreCartLine();
  const client = useQueryClient();
  const [error, setError] = useState('');
  const updateFrom = (cart: StoreCart) => { client.setQueryData(getGetStoreCartQueryKey(cart.id), cart); setError(''); };
  const changeQuantity = (lineId: string, quantity: number) => {
    if (!cartId || quantity < 1) return;
    update.mutate({ cartId, data: { lineId, quantity } }, { onSuccess: updateFrom, onError: () => setError('Your bag could not be updated. Please try again.') });
  };
  const removeLine = (lineId: string) => {
    if (!cartId) return;
    remove.mutate({ cartId, lineId }, { onSuccess: (cart) => { updateFrom(cart); if (!cart.lines.length) setCartId(null); }, onError: () => setError('That piece could not be removed. Please try again.') });
  };
  if (cartId && query.isLoading) return <main className="cart-page"><h1>Your bag</h1><div className="cart-layout"><div className="skeleton" /><div className="skeleton" /></div></main>;
  if (cartId && query.isError) return <main className="cart-page"><h1>Your bag</h1><div className="error-state" role="alert" data-testid="status-cart-error"><h2>Your bag needs a refresh.</h2><p>We couldn’t reconnect to this Shopify cart.</p><button className="button-dark" onClick={() => void query.refetch()} data-testid="button-retry-cart">Try again</button><button className="button-light" onClick={() => { setCartId(null); localStorage.removeItem(CART_STORAGE_KEY); }} data-testid="button-clear-cart">Start a new bag</button></div></main>;
  const cart = query.data;
  if (!cart || cart.lines.length === 0) return <main className="cart-page"><h1>Your bag</h1><div className="empty-state" data-testid="status-cart-empty"><span className="eyebrow">A little room for something lovely</span><h2>Your bag is empty.</h2><p>Take a look around and find something that feels like you.</p><Link href="/shop" className="button-dark" data-testid="link-empty-cart-shop">Explore the collection <ArrowRight size={14} /></Link></div></main>;
  const busy = update.isPending || remove.isPending;
  return <main className="cart-page">
    <h1>Your bag <span style={{ fontSize: 15, color: '#82786d', verticalAlign: 'middle' }}>({cart.totalQuantity})</span></h1>
    <div className="cart-layout">
      <section aria-label="Items in your bag">
        {cart.lines.map((line) => <article className="cart-line" key={line.id} data-testid={`row-cart-line-${line.id}`}>
          {line.image ? <img src={line.image} alt={line.title} data-testid={`img-cart-line-${line.id}`} /> : <div className="cart-image-empty" aria-hidden="true" />}
          <div><h3 data-testid={`text-cart-line-title-${line.id}`}>{line.title}</h3><p>{line.variantTitle}</p><div className="quantity-control" aria-label={`Quantity for ${line.title}`}><button disabled={busy || line.quantity <= 1} onClick={() => changeQuantity(line.id, line.quantity - 1)} aria-label="Decrease quantity" data-testid={`button-quantity-minus-${line.id}`}><Minus size={12} /></button><span data-testid={`text-cart-quantity-${line.id}`}>{line.quantity}</span><button disabled={busy} onClick={() => changeQuantity(line.id, line.quantity + 1)} aria-label="Increase quantity" data-testid={`button-quantity-plus-${line.id}`}><Plus size={12} /></button></div><button className="remove-button" disabled={busy} onClick={() => removeLine(line.id)} data-testid={`button-remove-line-${line.id}`}>Remove</button></div>
          <strong data-testid={`text-cart-line-total-${line.id}`}>{money(line.lineTotal, line.currencyCode)}</strong>
        </article>)}
        {error && <p className="inline-message" role="alert" data-testid="status-cart-update-error">{error}</p>}
        <Link href="/shop" className="text-link" data-testid="link-continue-shopping"><ArrowLeft size={13} /> Continue shopping</Link>
      </section>
      <aside className="summary">
        <h2>Order summary</h2>
        <div className="summary-row"><span>Subtotal</span><strong data-testid="text-cart-subtotal">{money(cart.subtotal, cart.currencyCode)}</strong></div>
        <p className="summary-note">Shipping and applicable taxes are calculated by Shopify at checkout. You’ll complete your purchase securely on Shopify.</p>
        <a href={cart.checkoutUrl} className="button-dark checkout-button" target="_blank" rel="noopener noreferrer" data-testid="link-shopify-checkout">Continue to checkout <ArrowRight size={15} /></a>
      </aside>
    </div>
  </main>;
}

function AboutPage() {
  return <main className="page">
    <section className="content-page"><span className="eyebrow">The Atelier point of view</span><h1>A little less to think about.</h1><p>Getting dressed shouldn’t ask too much of you. Atelier brings together the pieces you reach for again and again: comfortable essentials with a thoughtful eye for fit, feel, and the small details that make everyday dressing easier.</p><p>We believe a wardrobe works best when it reflects the people who wear it. That means room for different ages, different days, and all the in-between moments that make a life.</p><div className="story-mark" style={{ margin: '45px 0' }}>a.</div><span className="eyebrow">Considered, never complicated</span><p>Our collection is built around a simple idea: buy what you love, wear it often, and let the rest be quiet. We’re glad you’re here.</p><Link className="button-dark" href="/shop" data-testid="button-about-shop">Find your everyday <ArrowRight size={14} /></Link></section>
  </main>;
}

function ContactPage() {
  const [sent, setSent] = useState(false);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const subject = encodeURIComponent(`A note for Atelier — ${String(data.get('subject') || 'Hello')}`);
    const body = encodeURIComponent(`From: ${String(data.get('name') || '')} (${String(data.get('email') || '')})\n\n${String(data.get('message') || '')}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setSent(true);
  };
  return <main className="page"><section className="content-page"><span className="eyebrow">We’re here to help</span><h1>Let’s talk.</h1><p>Questions about a piece, your order, or just want to say hello? Leave us a note and your email app will open with your message ready to send. Choose the Atelier contact address when your draft opens.</p><form className="contact-form" onSubmit={submit}>
    <label>Your name<input name="name" required autoComplete="name" data-testid="input-contact-name" /></label>
    <label>Email address<input name="email" type="email" required autoComplete="email" data-testid="input-contact-email" /></label>
    <label>Subject<input name="subject" required data-testid="input-contact-subject" /></label>
    <label>Your message<textarea name="message" required data-testid="input-contact-message" /></label>
    <button type="submit" className="button-dark" data-testid="button-contact-send">Open your email app <ArrowRight size={14} /></button>
    {sent && <p className="status-note" role="status" data-testid="status-contact-ready">Your email app should be ready with your note.</p>}
  </form></section></main>;
}

function StoreLayout({ children }: { children: ReactNode }) {
  const [cartId, setCartIdState] = useState<string | null>(null);
  useEffect(() => { setCartIdState(localStorage.getItem(CART_STORAGE_KEY)); }, []);
  const setCartId = (id: string | null) => {
    setCartIdState(id);
    if (id) localStorage.setItem(CART_STORAGE_KEY, id);
    else localStorage.removeItem(CART_STORAGE_KEY);
  };
  return <CartContext.Provider value={{ cartId, setCartId }}><div className="site-shell"><SiteHeader />{children}<SiteFooter /></div></CartContext.Provider>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><StoreLayout><Switch>
    <Route path="/" component={HomePage} />
    <Route path="/shop" component={() => <ShopPage />} />
    <Route path="/shop/men" component={() => <ShopPage category="men" />} />
    <Route path="/shop/women" component={() => <ShopPage category="women" />} />
    <Route path="/shop/kids" component={() => <ShopPage category="kids" />} />
    <Route path="/product/:handle" component={ProductPage} />
    <Route path="/cart" component={CartPage} />
    <Route path="/about" component={AboutPage} />
    <Route path="/contact" component={ContactPage} />
    <Route component={NotFound} />
  </Switch></StoreLayout></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;
