import "dotenv/config";
import fastify from "fastify";
import pino from "pino";
import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";

const server = fastify();
const logger = pino();
const bot = new Telegraf(process.env.TOKEN_BOT);

// get product data from ML page
async function getProductFromUrl(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
    });

    const html = await res.text();

    // title
    const titleMatch = html.match(
      /<h1[^>]*class="[^"]*ui-pdp-title[^"]*"[^>]*>(.*?)<\/h1>/s,
    );
    const title = titleMatch?.[1]?.trim() ?? null;

    // current price
    const pricePatterns = [
      /"price":(\d+\.?\d*)/,
      /"amount":(\d+)/,
      /itemprop="price" content="(\d+\.?\d*)"/,
      /"price_amount":(\d+\.?\d*)/,
      /"salePriceAmount":(\d+)/,
    ];

    let price = null;
    for (const pattern of pricePatterns) {
      const match = html.match(pattern);
      if (match) {
        price = parseFloat(match[1]);
        break;
      }
    }

    // original price (before discount)
    const originalPriceMatch = html.match(/"original_price":(\d+\.?\d*)/);
    const original_price = originalPriceMatch
      ? parseFloat(originalPriceMatch[1])
      : null;

    console.log(
      "title:",
      title,
      "| price:",
      price,
      "| original_price:",
      original_price,
    );

    return { title, price, original_price };
  } catch (err) {
    console.error("Scraping error:", err);
    logger.info("Scraping error")
    return null;
  }
}

server.post("/telegram-webhook", async (req, reply) => {
  await bot.handleUpdate(req.body);
  reply.send({ ok: true });
});

server.get("/setWebhook", async (req, reply) => {
  await bot.telegram.setWebhook(`${process.env.URI}/telegram-webhook`);
  logger.info("Webhook configured!")
  reply.send("Webhook configured!");
});

// bot
bot.on(message("text"), async (ctx) => {
  try {
    const text = ctx.message.text.trim();
    const lines = text.split(",").map(l => l.trim()).filter(Boolean);

    const [productUrl, affiliateLink] = lines;

    if (!productUrl.includes("mercadolivre.com.br")) return;

    await ctx.reply("🔍 Buscando produto...");

    const product = await getProductFromUrl(productUrl);
    if (!product?.title || !product?.price) {
      return ctx.reply("Não consegui buscar o produto. Tente novamente.");
    }

    const hasDiscount = product.original_price && product.original_price > product.price;

    // format price with two decimal places
    const formatPrice = (value) => value.toFixed(2).replace(".", ",")

    const msg =
      `🚀 <b>${product.title}</b>\n\n` +
      (hasDiscount
        ? `💰 De <s>R$ ${formatPrice(product.original_price)}</s> por apenas <b>R$ ${formatPrice(product.price)}</b>`
        : `💰 <b>R$ ${formatPrice(product.price)}</b>`) +
      `\n\n🔗 ${affiliateLink}`;

    ctx.reply(msg, { parse_mode: "HTML" });

  } catch (err) {
    console.error("Bot error:", err);
    ctx.reply("Ocorreu um erro ao processar o link.");
  }
});

server.listen({ port: 3000, host: "0.0.0.0" });
