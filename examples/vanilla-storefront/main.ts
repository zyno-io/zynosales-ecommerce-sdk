import { createZynoSales } from '@zyno-io/zynosales-ecommerce-sdk';

const storefront = createZynoSales({
    publishableKey: '<your-publishable-key>'
});

const products = await storefront.catalog.getProducts();
const firstProduct = products[0];

if (firstProduct) {
    await storefront.cart.add({ productId: firstProduct.id, qty: 1 });
}

const unsubscribe = storefront.cart.subscribe(snapshot => {
    const cart = snapshot.cart;
    // Render one row per cart item using Sales' exact price groups when present.
    for (const item of cart?.items ?? []) {
        console.log(item.product.name, item.qty, item.priceGroups);
    }
    console.log(cart?.automaticPromotion?.name, cart?.automaticPromotion?.savings, cart?.priceDue);
    if (cart?.automaticPromotionSuppressedReason) console.log(cart.automaticPromotionSuppressedReason);
});

// Call unsubscribe when the storefront is unmounted.
unsubscribe();
