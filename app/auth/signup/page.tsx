import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";


const SignUpForm = dynamic(() => import("./signup-form"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <div className="text-zinc-500 text-sm flex items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
        Chargement...
      </div>
    </div>
  ),
});

export default function SignUpPage() {
  return <SignUpForm />;
}
