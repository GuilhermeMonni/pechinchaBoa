import "dotenv/config";
import fastify from "fastify";
import pino from "pino";
import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";

const server = fastify();
const logger = pino();
const bot = new Telegraf(process.env.TOKEN_BOT);

async function getProductFromUrl(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9",
        Connection: "keep-alive",
      },
    });

    const html = await res.text();
    console.log("Status:", res.status, "| URL:", url);

    if (url.includes("mercadolivre")) {
      const titleMatch = html.match(
        /<h1[^>]*class="[^"]*ui-pdp-title[^"]*"[^>]*>(.*?)<\/h1>/s,
      );
      const title = titleMatch?.[1]?.trim() ?? null;

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
    } 
  } catch (err) {
    console.error("Scraping error:", err.message);
    return null;
  }
}

server.get("/test", (req, reply) => reply.send("Server online!"));

server.post("/telegram-webhook", async (req, reply) => {
  await bot.handleUpdate(req.body);
  reply.send({ ok: true });
});

server.get("/setWebhook", async (req, reply) => {
  await bot.telegram.setWebhook(`${process.env.URI}/telegram-webhook`);
  logger.info("Webhook configured!");
  reply.send("Webhook configured!");
});

bot.on(message("text"), async (ctx) => {
  // ignora mensagens sem vírgula
  if (!ctx.message.text.includes(",")) return;

  try {
    const text = ctx.message.text.trim();
    const lines = text
      .split(",")
      .map((l) => l.trim())
      .filter(Boolean);
    const [productUrl, affiliateLink] = lines;

    // remove tudo após # da URL
    const cleanUrl = productUrl.split("#")[0];
    const linkAffiliate = affiliateLink ? affiliateLink.trim() : cleanUrl;

    await ctx.reply("🔍 Buscando produto...");

    const product = await getProductFromUrl(cleanUrl);
    console.log("product:", product);

    if (!product?.title || !product?.price) {
      await ctx
        .reply("Não consegui buscar o produto. Tente novamente.")
        .catch(() => {});
      return;
    }

    const hasDiscount =
      product.original_price && product.original_price > product.price;
    const formatPrice = (value) => value.toFixed(2).replace(".", ",");

    const msg =
      `🚀 <b>${product.title}</b>\n\n` +
      (hasDiscount
        ? `💰 De <s>~R$${formatPrice(product.original_price)}~</s> por apenas <b>*R$${formatPrice(product.price)}*</b>`
        : `💰 <b>R$ ${formatPrice(product.price)}</b>`) +
      `\n\n🔗 ${linkAffiliate}`;

    await ctx.reply(msg, { parse_mode: "HTML" }).catch(() => {});
  } catch (err) {
    console.error("Erro:", err.message);
    console.error("Stack:", err.stack);
    await ctx.reply("Não foi possível achar o produto 😓").catch(() => {});
  }
});

server.listen({ port: 3000, host: "0.0.0.0" });
