import { defineConfig } from 'vitepress';

export default defineConfig({
    base: '/zynosales-ecommerce-sdk/',
    title: 'ZynoSales eCommerce SDK',
    description: 'Framework-neutral JavaScript APIs for ZynoSales storefronts.',
    lastUpdated: true,
    cleanUrls: true,
    themeConfig: {
        nav: [
            { text: 'Guide', link: '/guide/' },
            { text: 'API reference', link: '/api/' },
            {
                text: 'GitHub',
                link: 'https://github.com/zyno-io/zynosales-ecommerce-sdk'
            }
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
                        { text: 'Stripe and order completion', link: '/guide/stripe' },
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
            ],
            '/api/': [
                {
                    text: 'API reference',
                    items: [
                        { text: 'Overview', link: '/api/' },
                        { text: 'Public package', link: '/api/index/' }
                    ]
                },
                {
                    text: 'Entry points',
                    items: [
                        { text: 'createZynoSales', link: '/api/index/functions/createZynoSales' },
                        { text: 'createZynoSalesClient', link: '/api/index/functions/createZynoSalesClient' },
                        { text: 'stripeConfiguration', link: '/api/index/functions/stripeConfiguration' }
                    ]
                },
                {
                    text: 'Classes',
                    items: [
                        { text: 'CartSession', link: '/api/index/classes/CartSession' },
                        { text: 'CatalogApi', link: '/api/index/classes/CatalogApi' },
                        { text: 'CheckoutCoordinator', link: '/api/index/classes/CheckoutCoordinator' },
                        { text: 'ZynoSalesClient', link: '/api/index/classes/ZynoSalesClient' },
                        { text: 'ZynoSalesError', link: '/api/index/classes/ZynoSalesError' }
                    ]
                },
                {
                    text: 'Core types',
                    items: [
                        { text: 'ZynoSalesOptions', link: '/api/index/type-aliases/ZynoSalesOptions' },
                        { text: 'ZynoSalesStorefront', link: '/api/index/type-aliases/ZynoSalesStorefront' },
                        { text: 'ZynoSalesHooks', link: '/api/index/type-aliases/ZynoSalesHooks' },
                        { text: 'CartSnapshot', link: '/api/index/type-aliases/CartSnapshot' },
                        { text: 'CheckoutSnapshot', link: '/api/index/type-aliases/CheckoutSnapshot' },
                        { text: 'StoreProduct', link: '/api/index/type-aliases/StoreProduct' },
                        { text: 'StorefrontConfig', link: '/api/index/type-aliases/StorefrontConfig' },
                        { text: 'PublicError', link: '/api/index/type-aliases/PublicError' },
                        { text: 'ZynoSalesStorage', link: '/api/index/interfaces/ZynoSalesStorage' }
                    ]
                },
                {
                    text: 'Generated contract',
                    items: [
                        { text: 'Sales modules', link: '/api/generated/sales/' }
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
        },
        footer: {
            message: 'MIT Licensed',
            copyright: 'Copyright © Zyno Consulting'
        }
    }
});
