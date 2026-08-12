import { defineConfig } from 'vitepress';

export default defineConfig({
    base: '/zynosales-ecommerce-sdk/',
    title: 'ZynoSales eCommerce SDK',
    description: 'Framework-neutral JavaScript APIs for ZynoSales storefronts.',
    themeConfig: {
        nav: [
            { text: 'Get started', link: '/guide/' },
            { text: 'Products', link: '/guide/products' },
            { text: 'Cart', link: '/guide/cart' },
            { text: 'Checkout', link: '/guide/checkout' },
            { text: 'Hooks', link: '/guide/hooks' },
            { text: 'API reference', link: '/api/' }
        ],
        sidebar: {
            '/guide/': [
                {
                    text: 'Start',
                    items: [
                        { text: 'Overview', link: '/guide/' },
                        { text: 'Install and configure', link: '/guide/installation' }
                    ]
                },
                {
                    text: 'Build a storefront',
                    items: [
                        { text: 'Load products', link: '/guide/products' },
                        { text: 'Create and manage a cart', link: '/guide/cart' },
                        { text: 'Buyer, delivery, and discounts', link: '/guide/checkout' },
                        { text: 'Stripe', link: '/guide/stripe' },
                        { text: 'Hooks', link: '/guide/hooks' }
                    ]
                },
                {
                    text: 'Operate safely',
                    items: [
                        { text: 'State, recovery, and errors', link: '/guide/state-and-errors' },
                        { text: 'Server handoff', link: '/guide/server-handoff' }
                    ]
                }
            ]
        },
        socialLinks: [
            { icon: 'github', link: 'https://github.com/zyno-io/zynosales-ecommerce-sdk' }
        ],
        search: {
            provider: 'local'
        },
        outline: {
            level: [2, 3]
        },
        editLink: {
            pattern: 'https://github.com/zyno-io/zynosales-ecommerce-sdk/edit/main/docs/:path',
            text: 'Edit this page on GitHub'
        }
    }
});
