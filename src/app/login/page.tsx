"use client";
import AuthPage from "@/components/AuthPage";
import PageTransition from "@/components/PageTransition";

export default function LoginPage() {
  return (
    <PageTransition>
      <AuthPage initialMode="login" />
    </PageTransition>
  );
}

