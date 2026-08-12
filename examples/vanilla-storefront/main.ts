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
    // Render `snapshot.cart` with your preferred DOM/UI framework.
    console.log(snapshot.cart?.priceDue);
});

// Call unsubscribe when the storefront is unmounted.
unsubscribe();
