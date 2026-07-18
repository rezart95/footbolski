import { api } from "../lib/axios";

export interface TermsStatus {
  current_version: string;
  accepted: boolean;
}

export async function getTermsStatus(displayName: string) {
  const { data } = await api.get<TermsStatus>("/terms/status", {
    params: { display_name: displayName }
  });
  return data;
}

export async function acceptTerms(displayName: string, termsVersion: string) {
  const { data } = await api.post("/terms/accept", {
    display_name: displayName,
    terms_version: termsVersion
  });
  return data;
}
