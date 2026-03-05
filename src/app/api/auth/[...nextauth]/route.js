import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
    providers: [
        CredentialsProvider({
            name: "Technician Access",
            credentials: {
                password: { label: "Technician Password", type: "password" }
            },
            async authorize(credentials) {
                // Simple comparison with environment variable
                if (credentials?.password === process.env.TECH_PASS) {
                    return { id: "1", name: "Technician", email: "tech@smashops.pro" };
                }
                return null;
            }
        })
    ],
    pages: {
        signIn: "/auth/signin", // Optional: Custom sign-in page if desired
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
