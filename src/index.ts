import { Reshuffle, BaseConnector, EventConfiguration } from 'reshuffle-base-connector'
import Shopify, { WebhookTopic } from 'shopify-api-node'
import { Request, Response } from 'express'

const DEFAULT_WEBHOOK_PATH = '/reshuffle-shopify-connector/webhook'

export interface ShopifyConnectorConfigOptions extends Shopify.IPrivateShopifyConfig {
  baseURL?: string
  webhookPath?: string
  webhookName?: string
}

export interface ShopifyConnectorEventOptions {
  topic: WebhookTopic
}

function validateBaseURL(url?: string): string {
  if (typeof url !== 'string') {
    throw new Error(`Invalid url: ${url}`)
  }
  const match = url.match(/^(https:\/\/[\w-]+(\.[\w-]+)*(:\d{1,5})?)\/?$/)
  if (!match) {
    throw new Error(`Invalid url: ${url}`)
  }
  return match[1]
}

export default class ShopifyConnector extends BaseConnector<
  ShopifyConnectorConfigOptions,
  ShopifyConnectorEventOptions
> {
  private readonly _sdk: Shopify

  constructor(app: Reshuffle, options: ShopifyConnectorConfigOptions, id?: string) {
    const { baseURL, webhookPath, webhookName, ...shopifyOptions } = options
    super(app, options, id)
    this._sdk = new Shopify(shopifyOptions)
  }

  async onStart(): Promise<void> {
    const logger = this.app.getLogger()
    const events = Object.values(this.eventConfigurations)
    if (events.length) {
      const url = validateBaseURL(this.configOptions?.baseURL)
      const address = url + (this.configOptions?.webhookPath || DEFAULT_WEBHOOK_PATH)

      const webhooks = await this._sdk.webhook.list()

      for (const event of events) {
        const {
          options: { topic },
        } = event
        // Check existing webhook
        const existingWebhook = webhooks.find(
          (hook) => hook.address === address && hook.topic === topic,
        )

        if (existingWebhook) {
          logger.info(
            `Reshuffle Shopify - reusing existing webhook (topic: ${existingWebhook.topic}, address ${existingWebhook.address})`,
          )
        } else {
          const webhook = await this._sdk.webhook.create({ address, topic })

          if (webhook.created_at) {
            logger.info(
              `Reshuffle Shopify - webhook registered successfully (topic: ${webhook.topic}, address ${webhook.address})`,
            )
          } else {
            logger.error(
              `Reshuffle Shopify - webhook registration failure (topic: ${webhook.topic}, address: ${webhook.address})`,
            )
          }
        }
      }
    }
  }

  on(options: ShopifyConnectorEventOptions, handler: any, eventId: string): EventConfiguration {
    const path = this.configOptions?.webhookPath || DEFAULT_WEBHOOK_PATH

    if (!eventId) {
      eventId = `Shopify${path}/${options.topic}/${this.id}`
    }
    const event = new EventConfiguration(eventId, this, options)
    this.eventConfigurations[event.id] = event

    this.app.when(event, handler)
    this.app.registerHTTPDelegate(path, this)

    return event
  }

  async handle(req: Request, res: Response): Promise<boolean> {
    const topic = req.headers['x-shopify-topic']
    const eventsUsingShopifyEvent = Object.values(this.eventConfigurations).filter(
      ({ options }) => options.topic === topic,
    )

    for (const event of eventsUsingShopifyEvent) {
      await this.app.handleEvent(event.id, {
        ...event,
        ...req.body,
        topic,
      })
    }

    return true
  }

  // https://www.npmjs.com/package/shopify-api-node#available-resources-and-methods
  sdk(): Shopify {
    return this._sdk
  }
}

export { ShopifyConnector }
