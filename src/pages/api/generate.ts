import type { APIRoute } from "astro";
import { generatePayload, parseOpenAIStream } from "@/utils/openAI";
import { verifySignature } from "@/utils/auth";

const apiKey = import.meta.env.OPENAI_API_KEY;

export const post: APIRoute = async (context) => {
  const body = await context.request.json();
  const { sign, time, messages } = body;
  if (!messages) {
    return new Response("No input text");
  }
  if (
    import.meta.env.PROD &&
    !(await verifySignature(
      { t: time, m: messages?.[messages.length - 1]?.content || "" },
      sign
    ))
  ) {
    return new Response("Invalid signature");
  }
  const initOptions = generatePayload(apiKey, messages);

  const response = await fetch(
    "https://api.openai.com/v1/chat/completions",
    initOptions
  ).catch((error) => {
    console.log(error);
  });
  if (response) return new Response(parseOpenAIStream(response));
  else
    return {
      body: "连接超时",
    };
};
