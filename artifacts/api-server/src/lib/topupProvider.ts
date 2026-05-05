export type TopupRequest = {
  operator: string;
  mobileNumber: string;
  amountPkr: number;
  reference: string;
};

export type TopupResult = {
  succeeded: boolean;
  providerReference: string | null;
  payload: unknown;
};

function getMode(): "mock" | "http" {
  const raw = (process.env.TOPUP_PROVIDER_MODE ?? "mock").trim().toLowerCase();
  if (raw === "http") return "http";
  return "mock";
}

export async function redeemMobileTopup(request: TopupRequest): Promise<TopupResult> {
  if (getMode() === "mock") {
    return {
      succeeded: true,
      providerReference: `mock-${Date.now()}`,
      payload: {
        mode: "mock",
        request,
      },
    };
  }

  const baseUrl = process.env.TOPUP_PROVIDER_BASE_URL?.trim();
  const apiKey = process.env.TOPUP_PROVIDER_API_KEY?.trim();
  if (!baseUrl || !apiKey) {
    throw new Error("TOPUP_PROVIDER_BASE_URL and TOPUP_PROVIDER_API_KEY are required in http mode");
  }

  const endpoint = `${baseUrl.replace(/\/+$/, "")}/redeem`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(request),
  });

  const text = await response.text();
  let parsed: unknown = null;
  try {
    parsed = text.trim() ? JSON.parse(text) : null;
  } catch {
    parsed = { raw: text };
  }

  if (!response.ok) {
    return {
      succeeded: false,
      providerReference: null,
      payload: {
        status: response.status,
        body: parsed,
      },
    };
  }

  const providerReference =
    parsed && typeof parsed === "object" && "reference" in parsed
      ? String((parsed as { reference?: unknown }).reference ?? "")
      : null;

  return {
    succeeded: true,
    providerReference,
    payload: parsed,
  };
}
