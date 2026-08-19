import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/auth/signin",
  },
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - auth/signin (login page)
     * - api/auth (auth API routes)
     * - favicon.ico, logo, static files
     */
    "/((?!auth/signin|auth/signup|auth/forgot-password|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
