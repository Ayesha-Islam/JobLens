import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { loginUser, exchangeAuthTicket } from '@/lib/api';

class EmailNotVerifiedError extends CredentialsSignin {
  code = 'email_not_verified';
}
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        ticket: { label: 'Authentication Ticket', type: 'text' },
      },

      async authorize(credentials) {
        try {
          // Automatic sign-in using the temporary authentication ticket.
          if (credentials?.ticket) {
            const response = await exchangeAuthTicket(
              credentials.ticket as string
            );

            if (response.success && response.data && response.token) {
              return {
                id: String(response.data.id),
                email: response.data.email,
                name: response.data.name,
                backendToken: response.token,
              };
            }

            return null;
          }

          // Normal sign-in using email and password.
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const response = await loginUser(
            credentials.email as string,
            credentials.password as string
          );

          if (response.success && response.data && response.token) {
            return {
              id: String(response.data.id),
              email: response.data.email,
              name: response.data.name,
              backendToken: response.token,
            };
          }

          return null;
        } catch (error) {
          if (
            error instanceof Error &&
            error.message === 'Please verify your email before logging in.'
          ) {
            throw new EmailNotVerifiedError();
          }

          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authenticatedUser = user as typeof user & { backendToken?: string };
        token.id = authenticatedUser.id;
        token.email = authenticatedUser.email;
        token.name = authenticatedUser.name;
        token.backendToken = authenticatedUser.backendToken;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return {
        ...session,
        backendToken: token.backendToken as string | undefined,
      };
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    // Keep the frontend session aligned with the backend JWT embedded in it.
    maxAge: 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,
});
