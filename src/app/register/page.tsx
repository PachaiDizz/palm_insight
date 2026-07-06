"use client";
import AuthPage from "@/components/AuthPage";
import PageTransition from "@/components/PageTransition";

export default function RegisterPage() {
  return (
    <PageTransition>
      <AuthPage initialMode="register" />
    </PageTransition>
  );
}

