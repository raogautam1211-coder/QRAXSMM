const SOCIALGROW_URL = "https://socialgrowsmm.in/api/v2";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders()
    }
  });
}

async function socialGrow(params, env) {
  const body = new URLSearchParams();

  body.set("key", env.SOCIALGROW_API_KEY);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      body.set(key, String(value));
    }
  }

  const response = await fetch(SOCIALGROW_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }

    const url = new URL(request.url);

    // Provider services
    if (
      url.pathname === "/api/services" ||
      url.pathname === "/services"
    ) {
      const result = await socialGrow(
        { action: "services" },
        env
      );

      return json(result);
    }

    // Provider balance
    if (
      url.pathname === "/api/balance" ||
      url.pathname === "/balance"
    ) {
      const result = await socialGrow(
        { action: "balance" },
        env
      );

      return json(result);
    }

    // Order status
    if (
      url.pathname === "/api/status" ||
      url.pathname === "/status"
    ) {
      const id =
        url.searchParams.get("order") ||
        url.searchParams.get("order_id");

      if (!id) {
        return json(
          { error: "Order ID required" },
          400
        );
      }

      const result = await socialGrow(
        {
          action: "status",
          order: id
        },
        env
      );

      return json(result);
    }

    // New order
    if (
      request.method === "POST" &&
      (
        url.pathname === "/api/order" ||
        url.pathname === "/order" ||
        url.pathname === "/"
      )
    ) {
      let data;

      try {
        data = await request.json();
      } catch {
        return json(
          { error: "Invalid JSON request" },
          400
        );
      }

      const service = data.service;
      const link = data.link;
      const quantity = data.quantity;

      if (!service || !link || !quantity) {
        return json(
          {
            error: "service, link and quantity are required"
          },
          400
        );
      }

      const result = await socialGrow(
        {
          action: "add",
          service,
          link,
          quantity
        },
        env
      );

      return json(result);
    }

    // Normal website request
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return json({
      status: "ok",
      message: "Qraxsmm API is running"
    });
  }
};
