import { redirect } from 'next/navigation';
import { auth } from '@/app/(auth)/auth';

export default async function ChatIndexPage() {
  // Check authentication
  const session = await auth();
  if (!session) {
    redirect('/login');
  }

  // Redirect to dashboard by default
  redirect('/dashboard');
} 