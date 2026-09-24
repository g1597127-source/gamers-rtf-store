import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { createCheckoutPreference } from "./mercadopago";
import { quoteCorreiosShipping } from "./correios";
import { isValidBirthDate, isValidCpf } from "../shared/customer";
import { getOrderByExternalReference, getOrderItems, listRecentOrders } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  checkout: router({
    createPreference: publicProcedure
      .input(z.object({
        items: z.array(z.object({ productId: z.number().int(), quantity: z.number().int() })).min(1),
        payerEmail: z.string().email().optional(),
        couponCode: z.string().optional(),
        shipping: z.object({ cep: z.string(), service: z.enum(["PAC", "SEDEX"]) }).optional(),
        customer: z.object({
          fullName: z.string().trim().min(3, "Informe seu nome completo."),
          cpf: z.string().refine(isValidCpf, "Informe um CPF válido."),
          birthDate: z.string().refine(isValidBirthDate, "Informe uma data de nascimento válida para maiores de 18 anos."),
          address: z.string().trim().min(8, "Informe seu endereço completo."),
          phone: z.string().regex(/^(?:\+?55\s?)?\(?\d{2}\)?\s?9?\d{4,5}-?\d{4}$/, "Informe um telefone válido."),
          email: z.string().email("Informe um e-mail válido."),
        }),
      }))
      .mutation(({ input, ctx }) => createCheckoutPreference({ ...input, req: ctx.req })),
    quoteShipping: publicProcedure
      .input(z.object({
        items: z.array(z.object({ productId: z.number().int(), quantity: z.number().int() })).min(1),
        cep: z.string(),
      }))
      .mutation(({ input }) => quoteCorreiosShipping(input)),
  }),
  orders: router({
    track: publicProcedure.input(z.object({ externalReference: z.string().min(8) })).query(async ({ input }) => {
      const order = await getOrderByExternalReference(input.externalReference.trim());
      if (!order) return null;
      return { order, items: await getOrderItems(order.id) };
    }),
    adminList: adminProcedure.query(() => listRecentOrders()),
  }),
});

export type AppRouter = typeof appRouter;
