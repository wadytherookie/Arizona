import type { NextApiRequest, NextApiResponse } from "next";
import { api } from "../../server/handler";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const result = await api(new Request("http://localhost" + req.url));
  res.status(result.status);
  result.headers.forEach((v, k) => res.setHeader(k, v));
  res.send(await result.text());
}
