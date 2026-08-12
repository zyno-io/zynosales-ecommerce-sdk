import { defineConfig } from 'vitepress';

export default defineConfig({
    base: '/zynosales-ecommerce-sdk/',
    title: 'ZynoSales eCommerce SDK',
    description: 'Framework-neutral JavaScript APIs for ZynoSales storefronts.',
    themeConfig: {
        nav: [
            { text: 'Guide', link: '/guide/' },
            { text: 'SDK API', link: '/api/' }
        ],
        sidebar: {
            '/guide/': [
                {
                    text: 'Guide',
                    items: [
                        { text: 'Overview', link: '/guide/' },
                        { text: 'Installation', link: '/guide/installation' },
                        { text: 'Checkout', link: '/guide/checkout' },
                        { text: 'Stripe', link: '/guide/stripe' },
                        { text: 'Server handoff', link: '/guide/server-handoff' }
                    ]
                }
            ]
        },
        socialLinks: []
    }
});
