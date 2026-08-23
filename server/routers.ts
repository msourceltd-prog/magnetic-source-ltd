import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createContactSubmission, hasRecentContactSubmission, markContactSubmissionDelivered } from "./db";
import { deliverContactMail, getSmtpConfig } from "./contactMailer";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  contact: router({
    deliveryStatus: publicProcedure.query(() => ({
      recipientConfigured: Boolean(process.env.CONTACT_RECIPIENT?.trim()),
      smtpConfigured: Boolean(getSmtpConfig()),
    })),
    submit: publicProcedure.input(z.object({
      name: z.string().trim().min(2).max(100),
      email: z.string().trim().email().max(254),
      company: z.string().trim().max(120).optional(),
      topic: z.enum(["range", "delivery", "account", "other"]),
      message: z.string().trim().min(20).max(2000),
      website: z.string().max(200).optional(),
    })).mutation(async ({ input }) => {
      if (input.website) return { accepted: true, delivered: false, spam: true };

      const email = input.email.toLowerCase();
      const isRateLimited = await hasRecentContactSubmission(email, new Date(Date.now() - 5 * 60_000));
      if (isRateLimited) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Please wait a few minutes before sending another message." });
      }

      const submissionId = await createContactSubmission({
        name: input.name,
        email,
        company: input.company || null,
        topic: input.topic,
        message: input.message,
      });

      try {
        const mail = await deliverContactMail({ ...input, email });
        if (mail.delivered) await markContactSubmissionDelivered(submissionId);
        return { accepted: true, delivered: mail.delivered, spam: false };
      } catch {
        return { accepted: true, delivered: false, spam: false };
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
