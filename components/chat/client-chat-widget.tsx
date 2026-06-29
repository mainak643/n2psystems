"use client"

import dynamic from "next/dynamic"

export const ClientChatWidget = dynamic(
  () => import("./ai-chat-widget").then((mod) => mod.AIChatWidget),
  { ssr: false }
)
