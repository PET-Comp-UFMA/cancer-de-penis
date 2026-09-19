import Head from "next/head";
import { Box } from "@mui/material";
import type { ReactNode } from "react";
import Footer from "@/shared/components/Footer";
import type { FormDefinition } from "../domain/form-definitions";
import FormHeader from "./FormHeader";

type FormInstanceLayoutProps = {
  form: FormDefinition;
  children: ReactNode;
  pageTitle?: string;
};

export default function FormInstanceLayout({
  form,
  children,
  pageTitle,
}: FormInstanceLayoutProps) {
  return (
    <>
      <Head>
        <title>{pageTitle ?? form.title}</title>
        <meta name="description" content={form.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <FormHeader form={form} />
      <Box component="main" sx={{ bgcolor: "#FAFCFC" }}>
        {children}
      </Box>
      <Footer />
    </>
  );
}
