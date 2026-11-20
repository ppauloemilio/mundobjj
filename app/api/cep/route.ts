import { connection } from "next/server";

type ViaCepResponse = {
  erro?: boolean;
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
};

export async function GET(request: Request) {
  await connection();
  const url = new URL(request.url);
  const raw = (url.searchParams.get("cep") || "").replace(/\D/g, "");

  if (raw.length !== 8) {
    return Response.json({ error: "CEP inválido." }, { status: 400 });
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${raw}/json/`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    });
    if (!response.ok) {
      return Response.json({ error: "Falha ao consultar CEP." }, { status: 502 });
    }

    const data = (await response.json()) as ViaCepResponse;
    if (data.erro) {
      return Response.json({ error: "CEP não encontrado." }, { status: 404 });
    }

    return Response.json({
      postalCode: data.cep?.replace(/\D/g, "") ?? raw,
      street: data.logradouro ?? "",
      neighborhood: data.bairro ?? "",
      city: data.localidade ?? "",
      stateCode: data.uf ?? "",
      countryIso2: "BR",
    });
  } catch {
    return Response.json({ error: "Falha ao consultar CEP." }, { status: 502 });
  }
}