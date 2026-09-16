import { beginBackingPaymentDispatchRequest } from "../../../../../lib/backing-payment-server";

export async function POST(request: Request): Promise<Response> {
  return beginBackingPaymentDispatchRequest(request, process.env);
}
