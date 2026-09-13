import { reserveBackingPaymentRequest } from "../../../../../lib/backing-payment-server";

export async function POST(request: Request): Promise<Response> {
  return reserveBackingPaymentRequest(request, process.env);
}
