# reshuffle-shopify-connector

[Code](https://github.com/reshufflehq/reshuffle-shopify-connector) |  [npm](https://www.npmjs.com/package/reshuffle-shopify-connector) | [Code sample](https://github.com/reshufflehq/reshuffle/tree/master/examples/shopify)

`npm install reshuffle-shopify-connector`

This connector uses [Official Node Shopify Client](https://www.npmjs.com/package/shopify-api-node) package.

### Reshuffle Shopify Connector

This connector provides a connector for [Shopify](https://www.shopify.com/online).

The following example listen to Shopify events:
```js
const { Reshuffle } = require('reshuffle')
const { ShopifyConnector } = require('reshuffle-shopify-connector')

const app = new Reshuffle()
const connector = new ShopifyConnector(app, {
  shopName: process.env.SHOPIFY_SHOP_NAME,
  apiKey: process.env.SHOPIFY_API_KEY,
  password: process.env.SHOPIFY_PASSWORD
})
  
connector.on({ topic: 'orders/fulfilled' }, (event, app) => {
  console.log('congratulations! Another order fulfilled')
})

app.start()
```

Create an API token from your Shopify Admin Page:

1. Go to https://<your_shop_name>.myshopify.com/admin/apps/private
2. Click `Create new private app`, 
3. Provide a name and scopes (keeping in mind that permissions are very limited per default)
4. Click Save, and you'll get api key and password

#### Configuration Options:

Provide options as below for connecting to Shopify:
```typescript
const connector = new ShopifyConnector(app, {
  shopName: '<your_shop_name>',
  apiKey: '<your_api_key>',
  password: '<your password>',
})
``` 

To use Shopify connector events, you need to provide at least your runtime baseURL. 
You can also override the default webhookPath and webhookName.
```typescript
interface ShopifyConnectorConfigOptions extends Shopify.IPrivateShopifyConfig {
  baseURL?: string
  webhookPath?: string // Default to '/reshuffle-shopify-connector/webhook'
}

// Full list of available options to connect to Shopify API
interface IPrivateShopifyConfig {
  shopName: string
  apiKey: string
  password: string
  apiVersion?: string
  autoLimit?: boolean | IAutoLimit
  presentmentPrices?: boolean
  timeout?: number
}
```

#### Connector events

##### listening to Shopify events

To listen to events happening in Shopify, pass the topic as options to the `connector.on` function

```typescript
interface ShopifyConnectorEventOptions {
  topic: WebhookTopic
}

// List extracted from https://github.com/MONEI/Shopify-api-node/blob/master/index.d.ts#L2869
type WebhookTopic =
    | 'app/uninstalled'
    | 'carts/create'
    | 'carts/update'
    | 'checkouts/create'
    | 'checkouts/delete'
    | 'checkouts/update'
    | 'collection_listings/add'
    | 'collection_listings/remove'
    | 'collection_listings/update'
    | 'collections/create'
    | 'collections/delete'
    | 'collections/update'
    | 'customer_groups/create'
    | 'customer_groups/delete'
    | 'customer_groups/update'
    | 'customers/create'
    | 'customers/delete'
    | 'customers/disable'
    | 'customers/enable'
    | 'customers/update'
    | 'draft_orders/create'
    | 'draft_orders/delete'
    | 'draft_orders/update'
    | 'fulfillment_events/create'
    | 'fulfillment_events/delete'
    | 'fulfillments/create'
    | 'fulfillments/update'
    | 'inventory_items/create'
    | 'inventory_items/update'
    | 'inventory_items/delete'
    | 'inventory_levels/connect'
    | 'inventory_levels/update'
    | 'inventory_levels/disconnect'
    | 'locations/create'
    | 'locations/update'
    | 'locations/delete'
    | 'order_transactions/create'
    | 'orders/cancelled'
    | 'orders/create'
    | 'orders/delete'
    | 'orders/fulfilled'
    | 'orders/paid'
    | 'orders/partially_fulfilled'
    | 'orders/updated'
    | 'product_listings/add'
    | 'product_listings/remove'
    | 'product_listings/update'
    | 'products/create'
    | 'products/delete'
    | 'products/update'
    | 'refunds/create'
    | 'shop/update'
    | 'themes/create'
    | 'themes/delete'
    | 'themes/publish'
    | 'themes/update'
```

Examples of event listeners:
```typescript
const app = new Reshuffle()
const connector = new ShopifyConnector(app, {
  shopName: '<shop_name>',
  apiKey: '<api_key>',
  password: '<password>',
  baseURL: '<your_reshuffle_runtime_base_url>',
})

connector.on({ topic: 'shop/update' }, async (event, app) => {
  console.log(event.options.topic) // 'shop/update'
  console.log(event) // { id: '<your_shop_id>', name: 'shop name', ... }
})    

connector.on({ topic: 'orders/create' }, async (event, app) => {                             
  console.log(event) // event representing the order just created 
})  
```
                                                                    
#### Connector actions

All actions are provided via the sdk.
// See full list of actions documentations in [Shopify Client Available Resources and Methods](https://www.npmjs.com/package/shopify-api-node#available-resources-and-methods)

Few examples:

- Get list of products (you can filter them by passing options to `list(options)`)
```typescript
const products = await connector.sdk().product.list()
console.log(products) // [{ id: 6095693840581, tite: 'Reshuffle cap', created_at: '2020-11-23T15:23:09+13:00', published_scope: 'web', admin_graphql_api_id: 'gid://shopify/Product/6095693840581', ... }]
```

- Get list of issues for a board
```typescript
const orders = await connector.sdk().order.list({ limit: 5 })
console.log(orders)
```

- Add a country:
```typescript
const country = await connector.sdk().country.create({ code: 'FR', tax: 0.25 })
console.log(country) // { id: 381258858693, name: 'France', tax: 0.25, code: 'FR', tax_name: 'FR TVA', provinces: [] }
```

##### sdk

Full access to the Node Shopify Client SDK

```typescript
const sdk = await connector.sdk()
```
