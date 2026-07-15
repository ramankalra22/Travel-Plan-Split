/**
 * src/lib/auth.js
 * NextAuth v4 configuration with credentials provider and role support
 */

import CredentialsProvider from 'next-auth/providers/credentials';
import { query } from './db';
import bcrypt from 'bcryptjs';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        try {
          const result = await query(
            'SELECT id, name, email, password_hash, role, avatar_url FROM users WHERE email = $1',
            [credentials.email.toLowerCase().trim()]
          );

          if (result.rows.length === 0) {
            throw new Error('Invalid email or password');
          }

          const user = result.rows[0];
          const passwordValid = await bcrypt.compare(credentials.password, user.password_hash);

          if (!passwordValid) {
            throw new Error('Invalid email or password');
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatarUrl: user.avatar_url,
          };
        } catch (err) {
          console.error('Auth error:', err.message);
          throw new Error(err.message || 'Authentication failed');
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.avatarUrl = user.avatarUrl;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.avatarUrl = token.avatarUrl;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,
};
